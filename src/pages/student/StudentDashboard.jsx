import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '../../components/common/UIComponents';
import { useRole } from '../../context/RoleContext';
import { attendanceService } from '../../services/attendanceService';
import { facultyService } from '../../services/facultyService';

export const StudentDashboard = () => {
  const { activeUser } = useRole();
  const [stats, setStats] = useState({
    totalHeld: 0,
    attended: 0,
    percentage: 0,
    isShortage: false,
    subjectBreakdown: [],
  });
  const [facultyMap, setFacultyMap] = useState({});

  useEffect(() => {
    loadStudentStats();
  }, [activeUser]);

  const loadStudentStats = () => {
    const studentId = activeUser?.entity?.id || 'stud-042';
    const computed = attendanceService.calculateStudentOverallStats(studentId);
    setStats(computed);

    // Build faculty lookup map
    const allFaculty = facultyService.getAll();
    const map = {};
    allFaculty.forEach((f) => {
      map[f.id] = f.name;
    });
    setFacultyMap(map);
  };

  const absences = stats.totalHeld - stats.attended;
  const isEligible = stats.percentage >= 75.0 || stats.totalHeld === 0;

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span>Student</span>
          <span className="breadcrumb-separator">/</span>
          <span>Attendance Dashboard</span>
        </div>
        <div className="page-title-row">
          <div>
            <h1 className="page-title">Student Attendance & Eligibility Overview</h1>
            <p className="page-subtitle">
              {activeUser?.name} &bull; Roll No: {activeUser?.code} &bull; {activeUser?.dept}
            </p>
          </div>
          <div>
            <Link to="/student/log">
              <Button size="sm">View Detailed Log</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Compliance Notice Banner (Dynamically Determined) */}
      <div className={`alert-box ${isEligible ? 'alert-info' : 'alert-warning'}`}>
        <span>{isEligible ? '✅' : '⚠️'}</span>
        <div>
          <strong>Examination Eligibility Status: {isEligible ? 'ELIGIBLE' : 'ATTENDANCE SHORTAGE'}</strong>
          {' '}&mdash; Your cumulative attendance is <strong>{stats.percentage}%</strong> across {stats.totalHeld} conducted lectures.
          {isEligible
            ? ' This satisfies the mandatory university requirement of 75.0%.'
            : ' You are currently below the required 75.0% threshold. Immediate remediation required.'}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Cumulative Attendance</div>
          <div
            className="stat-value"
            style={{ color: stats.percentage >= 75 ? '#166534' : '#991b1b' }}
          >
            {stats.percentage}%
          </div>
          <div className="stat-desc">Mandatory Benchmark: 75.0%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Lectures Held</div>
          <div className="stat-value">{stats.totalHeld}</div>
          <div className="stat-desc">Across all enrolled curriculum courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Lectures Attended</div>
          <div className="stat-value">{stats.attended}</div>
          <div className="stat-desc">Verified classroom roll calls</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Absences Recorded</div>
          <div className="stat-value" style={{ color: absences > 0 ? '#991b1b' : 'inherit' }}>
            {absences}
          </div>
          <div className="stat-desc">Missed lecture sessions</div>
        </div>
      </div>

      {/* Subject-Wise Quick Glance */}
      <Card
        title="Enrolled Subjects & Attendance Summary (Computed Live)"
        actions={
          <Link to="/student/subjects" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm">Full Breakdown</Button>
          </Link>
        }
      >
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Subject Name</th>
                <th>Instructor</th>
                <th>Held</th>
                <th>Attended</th>
                <th>Percentage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.subjectBreakdown.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No subjects assigned for this semester yet.
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
                      <td>{instructor}</td>
                      <td className="tabular-nums">{sub.totalHeld}</td>
                      <td className="tabular-nums">{sub.attended}</td>
                      <td
                        className="tabular-nums"
                        style={{
                          fontWeight: 600,
                          color: isShort ? '#991b1b' : '#166534',
                        }}
                      >
                        {sub.totalHeld > 0 ? `${sub.percentage}%` : 'No sessions'}
                      </td>
                      <td>
                        <Badge variant={isShort ? 'warning' : 'present'}>
                          {sub.totalHeld === 0 ? 'No Classes' : isShort ? 'Shortage Warning' : 'Eligible'}
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
