import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../components/common/UIComponents';
import { useRole } from '../../context/RoleContext';
import { attendanceService } from '../../services/attendanceService';
import { subjectService } from '../../services/subjectService';
import { storageService } from '../../services/storageService';

export const AttendanceLog = () => {
  const { activeUser } = useRole();
  const [history, setHistory] = useState([]);
  const [filterSubjectId, setFilterSubjectId] = useState('ALL');
  const [availableSubjects, setAvailableSubjects] = useState([]);

  useEffect(() => {
    loadHistory();
  }, [activeUser, filterSubjectId]);

  const loadHistory = async () => {
    const studentId = activeUser?.entityId || activeUser?.entity?.id || 'stud-042';
    const log = await attendanceService.getStudentAttendanceHistory(studentId, filterSubjectId);
    setHistory(log || []);

    // Get subjects applicable to student's department & semester
    if (activeUser?.entity) {
      const subs = await subjectService.getByDepartmentAndSemester(
        activeUser.entity.department,
        activeUser.entity.semester
      );
      setAvailableSubjects(subs || []);
    } else {
      const allSubs = await subjectService.getAll();
      setAvailableSubjects(allSubs || []);
    }
  };

  const handleExportCSV = () => {
    if (!history.length) return;
    const headers = ['Lecture Date', 'Lecture Slot', 'Subject Code', 'Course Name', 'Attendance Status'];
    const rows = history.map((item) => [
      item.date,
      item.period,
      item.subjectCode,
      item.subjectName,
      item.status,
    ]);
    storageService.exportToCSV('Student_Personal_Attendance_Log', headers, rows);
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span>Student</span>
          <span className="breadcrumb-separator">/</span>
          <span>Attendance Log</span>
        </div>
        <div className="page-title-row">
          <div>
            <h1 className="page-title">Personal Attendance Session Log</h1>
            <p className="page-subtitle">
              Chronological record of all past lecture roll calls recorded by course instructors
            </p>
          </div>
          <div>
            <Button size="sm" onClick={handleExportCSV}>
              Export Log (CSV)
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <div className="filter-bar">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Filter by Subject:</span>
            <select
              className="form-control"
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
            >
              <option value="ALL">All Enrolled Courses</option>
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Showing <strong>{history.length}</strong> logged lecture sessions
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Lecture Date</th>
                <th>Lecture Slot</th>
                <th>Subject Code</th>
                <th>Course Name</th>
                <th>Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No lecture sessions recorded for the selected filter.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.sessionId}>
                    <td><strong>{item.date}</strong></td>
                    <td>{item.period}</td>
                    <td><span style={{ fontFamily: 'var(--font-mono)' }}>{item.subjectCode}</span></td>
                    <td>{item.subjectName}</td>
                    <td>
                      <Badge variant={item.status === 'PRESENT' ? 'present' : 'absent'}>
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
