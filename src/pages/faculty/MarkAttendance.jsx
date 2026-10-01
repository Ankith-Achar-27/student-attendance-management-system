import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, AlertBanner } from '../../components/common/UIComponents';
import { useRole } from '../../context/RoleContext';
import { subjectService } from '../../services/subjectService';
import { studentService } from '../../services/studentService';
import { attendanceService } from '../../services/attendanceService';

export const MarkAttendance = () => {
  const { activeUser } = useRole();
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('Slot 2 (10:00 - 11:00 AM)');

  const [studentRoster, setStudentRoster] = useState([]);
  const [notice, setNotice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setStudentRoster([]);
    }
  };

  useEffect(() => {
    if (selectedSubjectId) {
      loadRosterForSubject(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  const loadRosterForSubject = (subjId) => {
    const subject = subjectService.getById(subjId);
    if (!subject) return;

    // Load active students belonging to this department and semester
    const allStudents = studentService.getAll();
    const enrolled = allStudents.filter(
      (s) =>
        s.department.toUpperCase() === subject.department.toUpperCase() &&
        Number(s.semester) === Number(subject.semester) &&
        s.status === 'Active'
    );

    // Default to PRESENT for easy roll call marking
    const initialRoster = enrolled.map((s) => ({
      studentId: s.id,
      rollNumber: s.rollNumber,
      name: s.name,
      section: s.section,
      status: 'PRESENT',
    }));

    initialRoster.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
    setStudentRoster(initialRoster);
    setNotice(null);
  };

  const toggleStudentStatus = (studentId) => {
    setStudentRoster((prev) =>
      prev.map((s) =>
        s.studentId === studentId
          ? { ...s, status: s.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' }
          : s
      )
    );
  };

  const handleMarkAll = (status) => {
    setStudentRoster((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSubmitAttendance = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    const facultyId = activeUser?.entityId || activeUser?.entity?.id;

    const records = studentRoster.map((s) => ({
      studentId: s.studentId,
      status: s.status,
    }));

    const result = attendanceService.saveSession({
      subjectId: selectedSubjectId,
      facultyId,
      date: selectedDate,
      period: selectedSlot,
      records,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setNotice({
        type: 'danger',
        message: result.error,
      });
      return;
    }

    const currentSub = assignedSubjects.find((s) => s.id === selectedSubjectId);
    const presentCount = studentRoster.filter((s) => s.status === 'PRESENT').length;
    const absentCount = studentRoster.length - presentCount;

    setNotice({
      type: 'info',
      message: `Attendance recorded successfully for ${currentSub?.code} on ${selectedDate} (${selectedSlot}). Present: ${presentCount}, Absent: ${absentCount}.`,
    });
  };

  const presentCount = studentRoster.filter((s) => s.status === 'PRESENT').length;
  const absentCount = studentRoster.length - presentCount;
  const currentSubject = assignedSubjects.find((s) => s.id === selectedSubjectId);

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span>Faculty</span>
          <span className="breadcrumb-separator">/</span>
          <span>Mark Attendance</span>
        </div>
        <div className="page-title-row">
          <div>
            <h1 className="page-title">Record Classroom Attendance</h1>
            <p className="page-subtitle">
              Select allocated course lecture slot and record student attendance roll call
            </p>
          </div>
        </div>
      </div>

      <AlertBanner
        type={notice?.type}
        message={notice?.message}
        onDismiss={() => setNotice(null)}
      />

      {/* Session Selection Controls */}
      <Card title="Lecture Session Details">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>
              Allocated Subject
            </label>
            <select
              className="form-control"
              style={{ width: '100%' }}
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

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>
              Attendance Date
            </label>
            <input
              type="date"
              className="form-control"
              style={{ width: '100%' }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>
              Lecture Period / Slot
            </label>
            <select
              className="form-control"
              style={{ width: '100%' }}
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
            >
              <option value="Slot 1 (09:00 - 10:00 AM)">Slot 1 (09:00 - 10:00 AM)</option>
              <option value="Slot 2 (10:00 - 11:00 AM)">Slot 2 (10:00 - 11:00 AM)</option>
              <option value="Slot 3 (11:15 - 12:15 PM)">Slot 3 (11:15 - 12:15 PM)</option>
              <option value="Slot 4 (01:00 - 02:00 PM)">Slot 4 (01:00 - 02:00 PM)</option>
              <option value="Slot 5 (02:00 - 03:00 PM)">Slot 5 (02:00 - 03:00 PM)</option>
              <option value="Lab Slot (02:00 - 05:00 PM)">Lab Slot (02:00 - 05:00 PM)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Roster & Attendance Table */}
      <Card
        title={`Student Roster (${studentRoster.length} Enrolled in ${currentSubject?.code || 'Course'})`}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', marginRight: '8px' }}>
              Present: <strong>{presentCount}</strong> | Absent: <strong style={{ color: '#991b1b' }}>{absentCount}</strong>
            </span>
            <Button variant="secondary" size="sm" onClick={() => handleMarkAll('PRESENT')}>
              All Present
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleMarkAll('ABSENT')}>
              All Absent
            </Button>
          </div>
        }
      >
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>S.No</th>
                <th>Roll Number</th>
                <th>Student Full Name</th>
                <th>Section</th>
                <th>Attendance Status</th>
                <th style={{ textAlign: 'center', width: '160px' }}>Toggle Action</th>
              </tr>
            </thead>
            <tbody>
              {studentRoster.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No students currently enrolled for this department and semester.
                  </td>
                </tr>
              ) : (
                studentRoster.map((student, idx) => (
                  <tr key={student.studentId}>
                    <td className="tabular-nums">{idx + 1}</td>
                    <td><strong>{student.rollNumber}</strong></td>
                    <td>{student.name}</td>
                    <td>Sec {student.section}</td>
                    <td>
                      <Badge variant={student.status === 'PRESENT' ? 'present' : 'absent'}>
                        {student.status}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Button
                        variant={student.status === 'PRESENT' ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => toggleStudentStatus(student.studentId)}
                        style={{
                          backgroundColor: student.status === 'PRESENT' ? '#dcfce7' : '#fee2e2',
                          color: student.status === 'PRESENT' ? '#166534' : '#991b1b',
                          borderColor: student.status === 'PRESENT' ? '#86efac' : '#fca5a5',
                          fontWeight: 600,
                          width: '120px',
                        }}
                      >
                        {student.status === 'PRESENT' ? 'Mark Absent' : 'Mark Present'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Button
            variant="secondary"
            onClick={() => loadRosterForSubject(selectedSubjectId)}
          >
            Reset Form
          </Button>
          <Button
            disabled={isSubmitting || studentRoster.length === 0}
            onClick={handleSubmitAttendance}
          >
            💾 Save & Submit Attendance
          </Button>
        </div>
      </Card>
    </div>
  );
};
