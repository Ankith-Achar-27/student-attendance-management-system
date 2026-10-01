import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../components/common/UIComponents';
import { useRole } from '../../context/RoleContext';
import { attendanceService } from '../../services/attendanceService';
import { facultyService } from '../../services/facultyService';
import { storageService } from '../../services/storageService';

export const SubjectAttendance = () => {
  const { activeUser } = useRole();
  const [stats, setStats] = useState({ subjectBreakdown: [], student: null });
  const [facultyMap, setFacultyMap] = useState({});

  useEffect(() => {
    loadSubjectAttendance();
  }, [activeUser]);

  const loadSubjectAttendance = () => {
    const studentId = activeUser?.entity?.id || 'stud-042';
    const computed = attendanceService.calculateStudentOverallStats(studentId);
    setStats(computed);

    const allFaculty = facultyService.getAll();
    const map = {};
    allFaculty.forEach((f) => {
      map[f.id] = f.name;
    });
    setFacultyMap(map);
  };

  const handleExportCSV = () => {
    if (!stats.subjectBreakdown.length) return;
    const headers = ['Subject Code', 'Course Title', 'Credits', 'Instructor', 'Classes Held', 'Classes Attended', 'Attendance %', 'Status'];
    const rows = stats.subjectBreakdown.map((s) => [
      s.code,
      s.name,
      s.credits,
      facultyMap[s.facultyId] || 'Unallocated',
      s.totalHeld,
      s.attended,
      `${s.percentage}%`,
      s.totalHeld === 0 ? 'No Classes' : s.percentage >= 75 ? 'Eligible' : 'Below 75%',
    ]);
    storageService.exportToCSV('Student_Subject_Wise_Attendance', headers, rows);
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span>Student</span>
          <span className="breadcrumb-separator">/</span>
          <span>Subject Attendance</span>
        </div>
        <div className="page-title-row">
          <div>
            <h1 className="page-title">Subject-Wise Attendance Breakdown</h1>
            <p className="page-subtitle">
              Track lecture attendance performance across each enrolled semester course
            </p>
          </div>
          <div>
            <Button size="sm" onClick={handleExportCSV}>
              Export Summary (CSV)
            </Button>
          </div>
        </div>
      </div>

      <Card title={`Current Semester Enrolled Subjects (${activeUser?.dept || 'Enrolled Course'})`}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject Code</th>
                <th>Course Name</th>
                <th>Credits</th>
                <th>Faculty In-Charge</th>
                <th>Held</th>
                <th>Attended</th>
                <th>Attendance %</th>
                <th>Eligibility Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.subjectBreakdown.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No enrolled courses found for current semester.
                  </td>
                </tr>
              ) : (
                stats.subjectBreakdown.map((sub) => {
                  const instructor = facultyMap[sub.facultyId] || 'Unallocated';
                  const isShort = sub.totalHeld > 0 && sub.percentage < 75.0;
                  return (
                    <tr key={sub.subjectId}>
                      <td><strong style={{ fontFamily: 'var(--font-mono)' }}>{sub.code}</strong></td>
                      <td>{sub.name}</td>
                      <td className="tabular-nums">{sub.credits}</td>
                      <td>{instructor}</td>
                      <td className="tabular-nums">{sub.totalHeld}</td>
                      <td className="tabular-nums">{sub.attended}</td>
                      <td
                        className="tabular-nums"
                        style={{
                          fontWeight: 700,
                          color: isShort ? '#991b1b' : '#166534',
                        }}
                      >
                        {sub.totalHeld > 0 ? `${sub.percentage}%` : 'N/A'}
                      </td>
                      <td>
                        <Badge variant={sub.totalHeld === 0 ? 'neutral' : isShort ? 'warning' : 'present'}>
                          {sub.totalHeld === 0 ? 'No Classes' : isShort ? 'Below 75% Minimum' : 'Eligible'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
