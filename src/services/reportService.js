/**
 * Report Service - Real-time Calculated Attendance Reports & Defaulter Audits
 * Computes all metrics dynamically from the attendance records.
 */

import { studentService } from './studentService';
import { facultyService } from './facultyService';
import { subjectService } from './subjectService';
import { attendanceService } from './attendanceService';

export const reportService = {
  // Returns students falling below a specified attendance threshold
  getDefaulterList(threshold = 75, department = 'All', semester = 'All') {
    const students = studentService.getAll();
    const defaulters = [];

    students.forEach((student) => {
      if (student.status !== 'Active') return;
      if (department !== 'All' && student.department !== department) return;
      if (semester !== 'All' && String(student.semester) !== String(semester)) return;

      const stats = attendanceService.calculateStudentOverallStats(student.id);

      // Only evaluate if there have been sessions held
      if (stats.totalHeld > 0 && stats.percentage < Number(threshold)) {
        defaulters.push({
          studentId: student.id,
          rollNumber: student.rollNumber,
          name: student.name,
          department: student.department,
          semester: student.semester,
          section: student.section,
          email: student.email,
          totalHeld: stats.totalHeld,
          attended: stats.attended,
          percentage: stats.percentage,
        });
      }
    });

    // Sort by lowest percentage first
    defaulters.sort((a, b) => a.percentage - b.percentage);
    return defaulters;
  },

  // Returns live aggregate attendance summaries by department
  getDepartmentSummaries() {
    const students = studentService.getAll();
    const faculty = facultyService.getAll();
    const departments = ['CSE', 'ECE', 'IT', 'ME'];

    const summaries = departments.map((dept) => {
      const deptStudents = students.filter((s) => s.department === dept && s.status === 'Active');
      const deptFaculty = faculty.filter((f) => f.department === dept && f.status === 'Active');

      let totalPctSum = 0;
      let evaluatedCount = 0;
      let defaultersCount = 0;

      deptStudents.forEach((student) => {
        const stats = attendanceService.calculateStudentOverallStats(student.id);
        if (stats.totalHeld > 0) {
          totalPctSum += stats.percentage;
          evaluatedCount += 1;
          if (stats.percentage < 75.0) {
            defaultersCount += 1;
          }
        }
      });

      const avgAttendance = evaluatedCount > 0
        ? Number((totalPctSum / evaluatedCount).toFixed(1))
        : 0;

      let deptFullName = dept;
      if (dept === 'CSE') deptFullName = 'Computer Science & Engineering';
      if (dept === 'ECE') deptFullName = 'Electronics & Communication';
      if (dept === 'IT') deptFullName = 'Information Technology';
      if (dept === 'ME') deptFullName = 'Mechanical Engineering';

      return {
        code: dept,
        name: deptFullName,
        studentCount: deptStudents.length,
        facultyCount: deptFaculty.length,
        avgAttendance,
        defaultersCount,
        status: avgAttendance >= 80.0 ? 'Normal' : avgAttendance >= 75.0 ? 'Borderline' : 'Action Required',
      };
    });

    return summaries;
  },

  // Returns overall high-level stats for Admin Dashboard
  getOverallInstituteMetrics() {
    const students = studentService.getAll();
    const faculty = facultyService.getAll();
    const subjects = subjectService.getAll();

    let totalPctSum = 0;
    let evaluatedCount = 0;

    students.forEach((student) => {
      if (student.status === 'Active') {
        const stats = attendanceService.calculateStudentOverallStats(student.id);
        if (stats.totalHeld > 0) {
          totalPctSum += stats.percentage;
          evaluatedCount += 1;
        }
      }
    });

    const campusAverage = evaluatedCount > 0
      ? Number((totalPctSum / evaluatedCount).toFixed(1))
      : 0;

    return {
      totalStudents: students.filter((s) => s.status === 'Active').length,
      totalFaculty: faculty.filter((f) => f.status === 'Active').length,
      totalSubjects: subjects.length,
      campusAverage,
    };
  },
};
