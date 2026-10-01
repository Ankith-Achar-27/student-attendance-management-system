import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '../../components/common/UIComponents';
import { reportService } from '../../services/reportService';
import { storageService } from '../../services/storageService';

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalSubjects: 0,
    campusAverage: 0,
  });
  const [deptSummaries, setDeptSummaries] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const calculatedMetrics = reportService.getOverallInstituteMetrics();
    const calculatedSummaries = reportService.getDepartmentSummaries();
    setMetrics(calculatedMetrics);
    setDeptSummaries(calculatedSummaries);
  };

  const handleExportDefaulters = () => {
    const defaulters = reportService.getDefaulterList(75);
    const headers = ['Roll Number', 'Student Name', 'Department', 'Semester', 'Section', 'Total Classes', 'Attended', 'Attendance %'];
    const rows = defaulters.map((d) => [
      d.rollNumber,
      d.name,
      d.department,
      d.semester,
      d.section,
      d.totalHeld,
      d.attended,
      `${d.percentage}%`,
    ]);
    storageService.exportToCSV('Campus_Defaulter_List_Below_75pct', headers, rows);
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span>Admin</span>
          <span className="breadcrumb-separator">/</span>
          <span>Dashboard</span>
        </div>
        <div className="page-title-row">
          <div>
            <h1 className="page-title">Institutional Overview & Administration</h1>
            <p className="page-subtitle">
              Academic Year 2026–2027 &bull; Central Attendance & Roster Monitoring
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" onClick={handleExportDefaulters}>
              Download Defaulter List (CSV)
            </Button>
            <Link to="/admin/students">
              <Button size="sm">+ Manage Students</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Aggregate Metrics Grid (Dynamically Calculated) */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Enrolled Students</div>
          <div className="stat-value">{metrics.totalStudents}</div>
          <div className="stat-desc">Active institutional registrations</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Faculty Members</div>
          <div className="stat-value">{metrics.totalFaculty}</div>
          <div className="stat-desc">Active instructional staff</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Subjects</div>
          <div className="stat-value">{metrics.totalSubjects}</div>
          <div className="stat-desc">Curriculum course offerings</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Campus Attendance Avg.</div>
          <div
            className="stat-value"
            style={{ color: metrics.campusAverage >= 75 ? '#166534' : '#991b1b' }}
          >
            {metrics.campusAverage}%
          </div>
          <div className="stat-desc">Computed across all recorded sessions</div>
        </div>
      </div>

      {/* Departmental Overview & Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <Card title="Departmental Attendance Summaries (Calculated Live)">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Students</th>
                  <th>Faculty</th>
                  <th>Overall Average</th>
                  <th>Defaulters (&lt;75%)</th>
                  <th>Compliance</th>
                </tr>
              </thead>
              <tbody>
                {deptSummaries.map((dept) => (
                  <tr key={dept.code}>
                    <td><strong>{dept.name}</strong></td>
                    <td className="tabular-nums">{dept.studentCount}</td>
                    <td className="tabular-nums">{dept.facultyCount}</td>
                    <td className="tabular-nums" style={{ fontWeight: 600 }}>
                      {dept.avgAttendance > 0 ? `${dept.avgAttendance}%` : 'N/A'}
                    </td>
                    <td className="tabular-nums" style={{ color: dept.defaultersCount > 0 ? '#991b1b' : 'inherit' }}>
                      {dept.defaultersCount}
                    </td>
                    <td>
                      <Badge
                        variant={
                          dept.status === 'Normal'
                            ? 'present'
                            : dept.status === 'Borderline'
                            ? 'warning'
                            : 'absent'
                        }
                      >
                        {dept.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Quick Administrative Actions">
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li>
              <Link to="/admin/students" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  🎓 Register & Manage Students
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/admin/faculty" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  👨‍🏫 Manage Faculty Directory
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/admin/subjects" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  📚 Allocate Courses to Faculty
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/admin/reports" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  📑 View Semester Defaulters & Audits
                </Button>
              </Link>
            </li>
          </ul>

          <div style={{ marginTop: '20px', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
            <div style={{ fontWeight: 600, fontSize: '12px', color: '#334155' }}>Institutional Rule</div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Minimum 75% attendance is required under university guidelines for students to appear in end-semester examinations.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
