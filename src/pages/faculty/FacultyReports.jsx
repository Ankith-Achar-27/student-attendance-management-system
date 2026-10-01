import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, AlertBanner } from '../../components/common/UIComponents';
import { useRole } from '../../context/RoleContext';
import { subjectService } from '../../services/subjectService';
import { attendanceService } from '../../services/attendanceService';
import { storageService } from '../../services/storageService';

export const FacultyReports = () => {
  const { activeUser } = useRole();
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [registerData, setRegisterData] = useState({ subject: null, sessionsCount: 0, studentStats: [] });
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    loadSubjects();
  }, [activeUser]);

  const loadSubjects = () => {
    const facultyId = activeUser?.entityId || activeUser?.entity?.id;
    const subs = facultyId ? subjectService.getByFaculty(facultyId) : [];
    setAssignedSubjects(subs);
    if (subs.length > 0) {
      setSelectedSubjectId(subs[0].id);
    } else {
      setSelectedSubjectId('');
      setRegisterData({ subject: null, sessionsCount: 0, studentStats: [] });
    }
  };

  useEffect(() => {
    if (selectedSubjectId) {
      loadRegister(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  const loadRegister = (subjId) => {
    const data = attendanceService.calculateCourseRegisterStats(subjId);
    setRegisterData(data);
  };

  const handleExportCSV = () => {
    if (!registerData.studentStats || registerData.studentStats.length === 0) {
      setNotice({ type: 'warning', message: 'No student records available to export.' });
      return;
    }

    const headers = [
      'Roll Number',
      'Student Name',
      'Course Code',
      'Course Name',
      'Total Held',
      'Attended',
      'Attendance %',
      'Compliance Status',
    ];
    const rows = registerData.studentStats.map((item) => [
      item.student.rollNumber,
      item.student.name,
      registerData.subject?.code || '',
      registerData.subject?.name || '',
      item.held,
      item.attended,
      `${item.percentage}%`,
      item.status,
    ]);

    const filename = `Course_Register_${registerData.subject?.code || 'Subject'}_Export`;
    storageService.exportToCSV(filename, headers, rows);
    setNotice({ type: 'info', message: 'Course register exported successfully.' });
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span>Faculty</span>
          <span className="breadcrumb-separator">/</span>
          <span>Course Registers</span>
        </div>
        <div className="page-title-row">
          <div>
            <h1 className="page-title">Course Attendance Register & Reports</h1>
            <p className="page-subtitle">
              Cumulative semester attendance status per enrolled student computed from recorded lectures
            </p>
          </div>
          <div>
            <Button size="sm" onClick={handleExportCSV}>
              Export Register (CSV)
            </Button>
          </div>
        </div>
      </div>

      <AlertBanner
        type={notice?.type}
        message={notice?.message}
        onDismiss={() => setNotice(null)}
      />

      <Card>
        <div className="filter-bar">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Select Course:</span>
            <select
              className="form-control"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
            >
              {assignedSubjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code} - {sub.name} (Sem {sub.semester} - {sub.department})
                </option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Total Lectures Conducted to Date: <strong>{registerData.sessionsCount}</strong>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Student Full Name</th>
                <th>Department / Batch</th>
                <th>Total Classes Held</th>
                <th>Classes Attended</th>
                <th>Attendance %</th>
                <th>Compliance Status</th>
              </tr>
            </thead>
            <tbody>
              {registerData.studentStats.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No enrolled students found for this course department and semester.
                  </td>
                </tr>
              ) : (
                registerData.studentStats.map((item) => (
                  <tr key={item.student.id}>
                    <td><strong>{item.student.rollNumber}</strong></td>
                    <td>{item.student.name}</td>
                    <td>{item.student.department} - Sem {item.student.semester} ({item.student.section})</td>
                    <td className="tabular-nums">{item.held}</td>
                    <td className="tabular-nums">{item.attended}</td>
                    <td
                      className="tabular-nums"
                      style={{
                        fontWeight: 700,
                        color: item.percentage < 75 ? '#991b1b' : '#166534',
                      }}
                    >
                      {item.percentage}%
                    </td>
                    <td>
                      <Badge
                        variant={
                          item.percentage >= 75
                            ? 'present'
                            : item.percentage >= 65
                            ? 'warning'
                            : 'absent'
                        }
                      >
                        {item.status}
                      </Badge>
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
