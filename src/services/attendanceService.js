/**
 * Attendance Service - Core Business Logic & Dynamic Attendance Calculations
 * Source of truth: Session records. Percentages are ALWAYS computed dynamically.
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { studentService } from './studentService';
import { subjectService } from './subjectService';

export const attendanceService = {
  getAllSessions() {
    return storageService.getItem(STORAGE_KEYS.SESSIONS) || [];
  },

  getSessionById(id) {
    const sessions = this.getAllSessions();
    return sessions.find((s) => s.id === id) || null;
  },

  getSessionsBySubject(subjectId) {
    const sessions = this.getAllSessions();
    return sessions.filter((s) => s.subjectId === subjectId);
  },

  getSessionsByFaculty(facultyId) {
    const sessions = this.getAllSessions();
    return sessions.filter((s) => s.facultyId === facultyId);
  },

  // Duplicate session check (prevent accidental double marking of same subject/date/slot)
  checkDuplicateSession(subjectId, date, period, excludeSessionId = null) {
    const sessions = this.getAllSessions();
    return sessions.some(
      (s) =>
        s.id !== excludeSessionId &&
        s.subjectId === subjectId &&
        s.date === date &&
        s.period.trim().toLowerCase() === period.trim().toLowerCase()
    );
  },

  saveSession(sessionData) {
    const { id, subjectId, facultyId, date, period, records } = sessionData;

    if (!subjectId) {
      return { success: false, error: 'Subject is required.' };
    }
    if (!date) {
      return { success: false, error: 'Date is required.' };
    }
    if (!period) {
      return { success: false, error: 'Lecture Slot/Period is required.' };
    }
    if (!records || !records.length) {
      return { success: false, error: 'Attendance records for students are required.' };
    }

    const sessions = this.getAllSessions();

    if (id) {
      // Editing existing session
      const index = sessions.findIndex((s) => s.id === id);
      if (index === -1) {
        return { success: false, error: 'Session not found to update.' };
      }

      if (this.checkDuplicateSession(subjectId, date, period, id)) {
        return {
          success: false,
          error: `Another session for this subject on ${date} during ${period} already exists.`,
        };
      }

      sessions[index] = {
        ...sessions[index],
        subjectId,
        facultyId: facultyId || sessions[index].facultyId,
        date,
        period,
        records,
        updatedAt: new Date().toISOString(),
      };

      storageService.setItem(STORAGE_KEYS.SESSIONS, sessions);
      return { success: true, data: sessions[index] };
    } else {
      // New session
      if (this.checkDuplicateSession(subjectId, date, period)) {
        return {
          success: false,
          error: `An attendance session for this subject on ${date} (${period}) has already been recorded. Use Edit Attendance to modify it.`,
        };
      }

      const newSession = {
        id: `sess-${Date.now()}`,
        subjectId,
        facultyId: facultyId || null,
        date,
        period,
        records,
        createdAt: new Date().toISOString(),
      };

      sessions.push(newSession);
      storageService.setItem(STORAGE_KEYS.SESSIONS, sessions);
      return { success: true, data: newSession };
    }
  },

  // Calculate dynamic attendance stats for a single student in a specific subject
  calculateStudentSubjectStats(studentId, subjectId) {
    const sessions = this.getSessionsBySubject(subjectId);
    let totalHeld = 0;
    let attended = 0;

    sessions.forEach((session) => {
      const record = session.records.find((r) => r.studentId === studentId);
      if (record) {
        totalHeld += 1;
        if (record.status === 'PRESENT') {
          attended += 1;
        }
      }
    });

    const percentage = totalHeld > 0 ? Number(((attended / totalHeld) * 100).toFixed(1)) : 0;
    return { totalHeld, attended, percentage };
  },

  // Calculate dynamic overall attendance stats for a single student across all enrolled subjects
  calculateStudentOverallStats(studentId) {
    const student = studentService.getById(studentId);
    if (!student) {
      return { totalHeld: 0, attended: 0, percentage: 0, subjectBreakdown: [] };
    }

    // Get subjects applicable to student's department & semester
    const subjects = subjectService.getByDepartmentAndSemester(
      student.department,
      student.semester
    );

    let totalHeld = 0;
    let totalAttended = 0;
    const subjectBreakdown = [];

    subjects.forEach((subject) => {
      const stats = this.calculateStudentSubjectStats(studentId, subject.id);
      totalHeld += stats.totalHeld;
      totalAttended += stats.attended;

      subjectBreakdown.push({
        subjectId: subject.id,
        code: subject.code,
        name: subject.name,
        credits: subject.credits,
        facultyId: subject.facultyId,
        totalHeld: stats.totalHeld,
        attended: stats.attended,
        percentage: stats.percentage,
        isShortage: stats.totalHeld > 0 && stats.percentage < 75.0,
      });
    });

    const percentage = totalHeld > 0 ? Number(((totalAttended / totalHeld) * 100).toFixed(1)) : 0;

    return {
      student,
      totalHeld,
      attended: totalAttended,
      percentage,
      isShortage: percentage < 75.0,
      subjectBreakdown,
    };
  },

  // Get chronological history of attendance for a student
  getStudentAttendanceHistory(studentId, filterSubjectId = null) {
    const sessions = this.getAllSessions();
    const history = [];

    sessions.forEach((session) => {
      if (filterSubjectId && filterSubjectId !== 'ALL' && session.subjectId !== filterSubjectId) {
        return;
      }

      const record = session.records.find((r) => r.studentId === studentId);
      if (record) {
        const subject = subjectService.getById(session.subjectId);
        history.push({
          sessionId: session.id,
          date: session.date,
          period: session.period,
          subjectId: session.subjectId,
          subjectCode: subject ? subject.code : 'UNKNOWN',
          subjectName: subject ? subject.name : 'Unknown Course',
          status: record.status,
        });
      }
    });

    // Sort newest to oldest
    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    return history;
  },

  // Calculate course register for faculty view
  calculateCourseRegisterStats(subjectId) {
    const subject = subjectService.getById(subjectId);
    if (!subject) return { subject: null, sessionsCount: 0, studentStats: [] };

    const sessions = this.getSessionsBySubject(subjectId);
    const sessionsCount = sessions.length;

    // Get all students enrolled in this subject's department & semester
    const allStudents = studentService.getAll();
    const enrolledStudents = allStudents.filter(
      (s) =>
        s.department.toUpperCase() === subject.department.toUpperCase() &&
        Number(s.semester) === Number(subject.semester) &&
        s.status === 'Active'
    );

    const studentStats = enrolledStudents.map((student) => {
      let attended = 0;
      sessions.forEach((session) => {
        const rec = session.records.find((r) => r.studentId === student.id);
        if (rec && rec.status === 'PRESENT') {
          attended += 1;
        }
      });

      const percentage = sessionsCount > 0 ? Number(((attended / sessionsCount) * 100).toFixed(1)) : 0;
      let status = 'Satisfactory';
      if (percentage < 65.0) {
        status = 'Critical Shortage';
      } else if (percentage < 75.0) {
        status = 'Shortage Warning';
      } else if (percentage < 80.0) {
        status = 'Borderline';
      }

      return {
        student,
        held: sessionsCount,
        attended,
        percentage,
        status,
      };
    });

    // Sort alphabetically by rollNumber
    studentStats.sort((a, b) => a.student.rollNumber.localeCompare(b.student.rollNumber));

    return {
      subject,
      sessionsCount,
      studentStats,
    };
  },
};
