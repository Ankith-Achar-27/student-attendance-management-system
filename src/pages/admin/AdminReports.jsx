import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, AlertBanner } from '../../components/common/UIComponents';
import { reportService } from '../../services/reportService';
import { storageService } from '../../services/storageService';

export const AdminReports = () => {
  const [threshold, setThreshold] = useState('75');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedSem, setSelectedSem] = useState('All');
  const [defaulters, setDefaulters] = useState([]);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    loadDefaulters();
  }, [threshold, selectedDept, selectedSem]);

  const loadDefaulters = () => {
    const list = reportService.getDefaulterList(Number(threshold), selectedDept, selectedSem);
    setDefaulters(list);
  };

  const handleExportCSV = () => {
    if (defaulters.length === 0) {
      setNotice({ type: 'warning', message: 'No records to export for current criteria.' });
      return;
    }

    const headers = [
      'Roll Number',
      'Student Name',
      'Department',
      'Semester',
      'Section',
      'Email',
      'Total Held',
      'Attended',
      'Attendance %',
      'Threshold Benchmark',
    ];
    const rows = defaulters.map((item) => [
      item.rollNumber,
      item.name,
      item.department,
      `Sem ${item.semester}`,
      item.section,
      item.email,
      item.totalHeld,
      item.attended,
      `${item.percentage}%`,
      `< ${threshold}%`,
    ]);

    storageService.exportToCSV(`Attendance_Defaulters_Below_${threshold}pct`, headers, rows);
    setNotice({ type: 'info', message: 'Defaulter audit report exported successfully.' });
  };

  const handleIssueNotice = (student) => {
    setNotice({
      type: 'info',
      message: `Formal attendance shortfall notice queued for ${student.name} (${student.rollNumber}) at ${student.percentage}%.`,
    });
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span>Admin</span>
          <span className="breadcrumb-separator">/</span>
          <span>Institutional Reports</span>
        </div>
        <div className="page-title-row">
          <div>
            <h1 className="page-title">Institutional Attendance Reports & Audits</h1>
            <p className="page-subtitle">
              Dynamic semester attendance audits and defaulter monitoring computed from classroom session records
            </p>
          </div>
          <div>
            <Button size="sm" onClick={handleExportCSV}>
              Export Report (CSV)
            </Button>
          </div>
        </div>
      </div>

      <AlertBanner
        type={notice?.type}
        message={notice?.message}
        onDismiss={() => setNotice(null)}
      />

      <div className="alert-box alert-warning">
        <span>⚠️</span>
        <div>
          <strong>Statutory University Rule:</strong> Students with cumulative attendance below 75% are ineligible for final semester examinations without medical board clearance.
        </div>
      </div>

      <Card title="Attendance Defaulter Audit (Dynamically Computed)">
        <div className="filter-bar">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Threshold:</span>
              <select
                className="form-control"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              >
                <option value="85">Below 85% (Advisory Warning)</option>
                <option value="75">Below 75% (Mandatory Exam Cutoff)</option>
                <option value="65">Below 65% (Critical Shortage)</option>
                <option value="50">Below 50% (Severe Default)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Department:</span>
              <select
                className="form-control"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="All">All Departments</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="IT">IT</option>
                <option value="ME">ME</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Semester:</span>
              <select
                className="form-control"
                value={selectedSem}
                onChange={(e) => setSelectedSem(e.target.value)}
              >
                <option value="All">All Semesters</option>
                <option value="1">Sem 1</option>
                <option value="3">Sem 3</option>
                <option value="5">Sem 5</option>
                <option value="7">Sem 7</option>
              </select>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600 }}>
            {defaulters.length} student(s) identified below {threshold}%
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Student Full Name</th>
                <th>Department / Batch</th>
                <th>Total Held</th>
                <th>Attended</th>
                <th>Cumulative %</th>
                <th>Defaulter Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {defaulters.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#166534', fontWeight: 500 }}>
                    ✅ No students fall below {threshold}% attendance for the selected criteria.
                  </td>
                </tr>
              ) : (
                defaulters.map((item) => (
                  <tr key={item.studentId}>
                    <td><strong>{item.rollNumber}</strong></td>
                    <td>{item.name}</td>
                    <td>{item.department} - Sem {item.semester} ({item.section})</td>
                    <td className="tabular-nums">{item.totalHeld}</td>
                    <td className="tabular-nums">{item.attended}</td>
                    <td
                      className="tabular-nums"
                      style={{
                        fontWeight: 700,
                        color: item.percentage < 65 ? '#dc2626' : '#b45309',
                      }}
                    >
                      {item.percentage}%
                    </td>
                    <td>
                      <Badge variant={item.percentage < 65 ? 'absent' : 'warning'}>
                        {item.percentage < 65 ? 'Critical Shortage' : 'Exam Ineligible'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleIssueNotice(item)}
                      >
                        Issue Warning Notice
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
