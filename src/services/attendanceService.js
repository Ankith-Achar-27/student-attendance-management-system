/**
 * Attendance Service (Phase 4 - Cloud Firestore Backed)
 * Manages attendance sessions and dynamic attendance calculations.
 * Attendance percentages are ALWAYS calculated dynamically from session records.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { storageService, STORAGE_KEYS } from './storageService';
import { studentService } from './studentService';
import { subjectService } from './subjectService';

export const attendanceService = {
  async getAllSessions() {
    if (isFirebaseConfigured && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'attendanceSessions'));
        const list = [];
        querySnapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        if (list.length > 0) {
          storageService.setItem(STORAGE_KEYS.SESSIONS, list);
          return list;
        }
      } catch (err) {
        console.warn('Firestore attendance fetch fallback:', err.message);
      }
    }
    return storageService.getItem(STORAGE_KEYS.SESSIONS) || [];
  },

  async getSessionById(id) {
    if (isFirebaseConfigured && db && id) {
      try {
        const docSnap = await getDoc(doc(db, 'attendanceSessions', id));
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        }
      } catch (err) {
        console.warn('Firestore session getById fallback:', err.message);
      }
    }
    const sessions = await this.getAllSessions();
    return sessions.find((s) => s.id === id) || null;
  },

  async getSessionsBySubject(subjectId) {
    const sessions = await this.getAllSessions();
    return sessions.filter((s) => s.subjectId === subjectId);
  },

  async getSessionsByFaculty(facultyId) {
    const sessions = await this.getAllSessions();
    return sessions.filter((s) => s.facultyId === facultyId);
  },

  async checkDuplicateSession(subjectId, date, period, excludeSessionId = null) {
    const sessions = await this.getAllSessions();
    return sessions.some(
      (s) =>
        s.id !== excludeSessionId &&
        s.subjectId === subjectId &&
        s.date === date &&
        s.period.trim().toLowerCase() === period.trim().toLowerCase()
    );
  },

  async saveSession(sessionData) {
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

    const sessions = await this.getAllSessions();

    if (id) {
      // Editing existing session
      const index = sessions.findIndex((s) => s.id === id);
      if (index === -1) {
        return { success: false, error: 'Session not found to update.' };
      }

      const isDup = await this.checkDuplicateSession(subjectId, date, period, id);
      if (isDup) {
        return {
          success: false,
          error: `Another session for this subject on ${date} during ${period} already exists.`,
        };
      }

      const updatedSession = {
        ...sessions[index],
        subjectId,
        facultyId: facultyId || sessions[index].facultyId,
        date,
        period,
        records,
        updatedAt: new Date().toISOString(),
      };

      if (isFirebaseConfigured && db) {
        try {
          await updateDoc(doc(db, 'attendanceSessions', id), updatedSession);
        } catch (err) {
          console.warn('Firestore session update failed:', err.message);
        }
      }

      sessions[index] = updatedSession;
      storageService.setItem(STORAGE_KEYS.SESSIONS, sessions);
      return { success: true, data: updatedSession };
    } else {
      // New session
      const isDup = await this.checkDuplicateSession(subjectId, date, period);
      if (isDup) {
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

      if (isFirebaseConfigured && db) {
        try {
          await setDoc(doc(db, 'attendanceSessions', newSession.id), newSession);
        } catch (err) {
          console.warn('Firestore session write failed:', err.message);
        }
      }

      sessions.push(newSession);
      storageService.setItem(STORAGE_KEYS.SESSIONS, sessions);
      return { success: true, data: newSession };
    }
  },

  // Calculate dynamic attendance stats for a single student in a specific subject
  async calculateStudentSubjectStats(studentId, subjectId) {
    const sessions = await this.getSessionsBySubject(subjectId);
    let totalHeld = 0;
    let attended = 0;

    sessions.forEach((session) => {
      const record = session.records?.find((r) => r.studentId === studentId);
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
  async calculateStudentOverallStats(studentId) {
    const student = await studentService.getById(studentId);
    if (!student) {
      return { totalHeld: 0, attended: 0, percentage: 0, subjectBreakdown: [] };
    }

    const subjects = await subjectService.getByDepartmentAndSemester(
      student.department,
      student.semester
    );

    let totalHeld = 0;
    let totalAttended = 0;
    const subjectBreakdown = [];

    for (const subject of subjects) {
      const stats = await this.calculateStudentSubjectStats(studentId, subject.id);
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
    }

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

  // Chronological attendance history for a student
  async getStudentAttendanceHistory(studentId, filterSubjectId = null) {
    const sessions = await this.getAllSessions();
    const history = [];

    for (const session of sessions) {
      if (filterSubjectId && filterSubjectId !== 'ALL' && session.subjectId !== filterSubjectId) {
        continue;
      }

      const record = session.records?.find((r) => r.studentId === studentId);
      if (record) {
        const subject = await subjectService.getById(session.subjectId);
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
    }

    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    return history;
  },

  // Course register for faculty
  async calculateCourseRegisterStats(subjectId) {
    const subject = await subjectService.getById(subjectId);
    if (!subject) return { subject: null, sessionsCount: 0, studentStats: [] };

    const sessions = await this.getSessionsBySubject(subjectId);
    const sessionsCount = sessions.length;

    const allStudents = await studentService.getAll();
    const enrolledStudents = allStudents.filter(
      (s) =>
        s.department.toUpperCase() === subject.department.toUpperCase() &&
        Number(s.semester) === Number(subject.semester) &&
        s.status === 'Active'
    );

    const studentStats = enrolledStudents.map((student) => {
      let attended = 0;
      sessions.forEach((session) => {
        const rec = session.records?.find((r) => r.studentId === student.id);
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

    studentStats.sort((a, b) => a.student.rollNumber.localeCompare(b.student.rollNumber));

    return {
      subject,
      sessionsCount,
      studentStats,
    };
  },
};
