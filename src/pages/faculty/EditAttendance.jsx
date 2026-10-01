import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, AlertBanner } from '../../components/common/UIComponents';
import { useRole } from '../../context/RoleContext';
import { subjectService } from '../../services/subjectService';
import { studentService } from '../../services/studentService';
import { attendanceService } from '../../services/attendanceService';

export const EditAttendance = () => {
  const { activeUser } = useRole();
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [availableSessions, setAvailableSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');

  const [activeSession, setActiveSession] = useState(null);
  const [records, setRecords] = useState([]);
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
      setAvailableSessions([]);
      setActiveSession(null);
      setRecords([]);
    }
  };

  useEffect(() => {
    if (selectedSubjectId) {
      const sessions = attendanceService.getSessionsBySubject(selectedSubjectId);
      // Sort newest date first
      sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAvailableSessions(sessions);
      if (sessions.length > 0) {
        setSelectedSessionId(sessions[0].id);
      } else {
        setSelectedSessionId('');
        setActiveSession(null);
        setRecords([]);
      }
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    if (selectedSessionId) {
      loadSessionDetails(selectedSessionId);
    }
  }, [selectedSessionId]);

  const loadSessionDetails = (sessId) => {
    const session = attendanceService.getSessionById(sessId);
    if (!session) return;

    setActiveSession(session);

    // Map each record with student info
    const students = studentService.getAll();
    const mapped = session.records.map((r) => {
      const stud = students.find((s) => s.id === r.studentId);
      return {
        studentId: r.studentId,
        rollNumber: stud ? stud.rollNumber : 'UNKNOWN',
        name: stud ? stud.name : 'Unknown Student',
        originalStatus: r.status,
        currentStatus: r.status,
        modified: false,
      };
    });

    mapped.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
    setRecords(mapped);
    setNotice(null);
  };

  const toggleRecord = (studentId) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.studentId === studentId) {
          const nextStatus = r.currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
          return {
            ...r,
            currentStatus: nextStatus,
            modified: nextStatus !== r.originalStatus,
          };
        }
        return r;
      })
    );
  };

  const handleSaveCorrections = (e) => {
    e.preventDefault();
    if (!activeSession) return;

    const updatedRecords = records.map((r) => ({
      studentId: r.studentId,
      status: r.currentStatus,
    }));

    const result = attendanceService.saveSession({
      id: activeSession.id,
      subjectId: activeSession.subjectId,
      facultyId: activeSession.facultyId,
      date: activeSession.date,
      period: activeSession.period,
      records: updatedRecords,
    });

    if (!result.success) {
      setNotice({ type: 'danger', message: result.error });
      return;
    }

    // Reload to reset originalStatus
    loadSessionDetails(activeSession.id);
    const modifiedCount = records.filter((r) => r.modified).length;
    setNotice({
      type: 'info',
      message: `Session updated successfully. ${modifiedCount} record(s) modified and all cumulative attendance percentages recalculated.`,
    });
  };

  const currentSubject = assignedSubjects.find((s) => s.id === selectedSubjectId);
  const modifiedCount = records.filter((r) => r.modified).length;

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span>Faculty</span>
          <span className="breadcrumb-separator">/</span>
          <span>Edit Attendance</span>
        </div>
        <div className="page-title-row">
          <div>
            <h1 className="page-title">Modify Historical Attendance Record</h1>
            <p className="page-subtitle">
              Rectify errors or update excused absences for previously recorded classroom lecture sessions
            </p>
          </div>
        </div>
      </div>

      <AlertBanner
        type={notice?.type}
        message={notice?.message}
        onDismiss={() => setNotice(null)}
      />

      <Card title="Locate Prior Attendance Record">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>
              Subject
            </label>
            <select
              className="form-control"
              style={{ width: '100%' }}
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
            >
              {assignedSubjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code} - {sub.name} (Sem {sub.semester})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>
              Select Recorded Session
            </label>
            <select
              className="form-control"
              style={{ width: '100%' }}
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              disabled={availableSessions.length === 0}
            >
              {availableSessions.length === 0 ? (
                <option value="">No recorded sessions for this course</option>
              ) : (
                availableSessions.map((sess) => (
                  <option key={sess.id} value={sess.id}>
                    {sess.date} &bull; {sess.period} ({sess.records.filter((r) => r.status === 'PRESENT').length} Present)
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </Card>

      {activeSession ? (
        <Card
          title={`Session Attendance Log - ${currentSubject?.code} on ${activeSession.date} (${activeSession.period})`}
          actions={
            modifiedCount > 0 && (
              <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 600 }}>
                ● {modifiedCount} pending change(s)
              </span>
            )
          }
        >
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Originally Recorded</th>
                  <th>Updated Status</th>
                  <th>Change Flag</th>
                  <th style={{ textAlign: 'center', width: '140px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.studentId}>
                    <td><strong>{r.rollNumber}</strong></td>
                    <td>{r.name}</td>
                    <td>
                      <Badge variant={r.originalStatus === 'PRESENT' ? 'present' : 'absent'}>
                        {r.originalStatus}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={r.currentStatus === 'PRESENT' ? 'present' : 'absent'}>
                        {r.currentStatus}
                      </Badge>
                    </td>
                    <td>
                      {r.modified ? (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#b45309' }}>
                          ● Modified
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Unchanged</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toggleRecord(r.studentId)}
                      >
                        Flip Status
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button
              variant="secondary"
              onClick={() => loadSessionDetails(activeSession.id)}
            >
              Discard Edits
            </Button>
            <Button
              disabled={modifiedCount === 0}
              onClick={handleSaveCorrections}
            >
              Confirm & Save Corrections
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
            No recorded session selected. Mark an attendance session first to view or edit historical records.
          </div>
        </Card>
      )}
    </div>
  );
};
