
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Badge,
  AlertBanner,
} from '../../components/common/UIComponents';
import { useRole } from '../../context/RoleContext';
import { subjectService } from '../../services/subjectService';
import { studentService } from '../../services/studentService';
import { attendanceService } from '../../services/attendanceService';

const EMPTY_REGISTER = {
  subject: null,
  sessionsCount: 0,
  studentStats: [],
};

const getFacultyId = (user) => {
  return (
    user?.linkedEntityId ||
    user?.entityId ||
    user?.entity?.id ||
    (user?.id?.startsWith('fac-') ? user.id : null) ||
    null
  );
};

const normalizeText = (value) =>
  String(value ?? '').trim().toUpperCase();

const isActiveStudent = (student) =>
  !student.status ||
  ['ACTIVE', 'ACTIVATE'].includes(normalizeText(student.status));

export const MarkAttendance = () => {
  const { activeUser } = useRole();

  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const localDate = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    );
    return localDate.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState(
    'Slot 2 (10:00 - 11:00 AM)'
  );

  const [studentRoster, setStudentRoster] = useState([]);
  const [notice, setNotice] = useState(null);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const facultyId = getFacultyId(activeUser);

  const loadSubjects = useCallback(async () => {
    setIsLoadingSubjects(true);

    try {
      if (!facultyId) {
        setAssignedSubjects([]);
        setSelectedSubjectId('');
        setStudentRoster([]);
        setNotice({
          type: 'danger',
          message:
            'Could not identify your faculty profile. Check that your user profile has linkedEntityId set to your faculty document ID, such as fac-101.',
        });
        return;
      }

      const subjects = await subjectService.getByFaculty(facultyId);
      const validSubjects = Array.isArray(subjects) ? subjects : [];

      setAssignedSubjects(validSubjects);

      if (validSubjects.length > 0) {
        setSelectedSubjectId((currentId) =>
          validSubjects.some((subject) => subject.id === currentId)
            ? currentId
            : validSubjects[0].id
        );
        setNotice(null);
      } else {
        setSelectedSubjectId('');
        setStudentRoster([]);
        setNotice({
          type: 'warning',
          message: `No subjects are assigned to faculty ID "${facultyId}". Verify the facultyId field in the Firestore subjects collection.`,
        });
      }
    } catch (error) {
      console.error('Failed to load assigned subjects:', error);
      setAssignedSubjects([]);
      setSelectedSubjectId('');
      setStudentRoster([]);
      setNotice({
        type: 'danger',
        message:
          'Could not load your assigned subjects. Check your Firestore connection and permissions, then try again.',
      });
    } finally {
      setIsLoadingSubjects(false);
    }
  }, [facultyId]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const loadRosterForSubject = useCallback(
    async (subjectId) => {
      if (!subjectId) {
        setStudentRoster([]);
        return;
      }

      setIsLoadingRoster(true);

      try {
        const subject = await subjectService.getById(subjectId);

        if (!subject) {
          setStudentRoster([]);
          setNotice({
            type: 'danger',
            message: 'The selected subject could not be found.',
          });
          return;
        }

        const allStudents = await studentService.getAll();
        const students = Array.isArray(allStudents) ? allStudents : [];

        const subjectDepartment = normalizeText(subject.department);
        const subjectSemester = Number(subject.semester);

        const enrolled = students.filter((student) => {
          const sameDepartment =
            normalizeText(student.department) === subjectDepartment;

          const sameSemester =
            Number(student.semester) === subjectSemester;

          return (
            sameDepartment &&
            sameSemester &&
            isActiveStudent(student)
          );
        });

        const initialRoster = enrolled.map((student) => ({
          studentId: student.id,
          rollNumber: student.rollNumber || '',
          name: student.name || 'Unnamed Student',
          section: student.section || '-',
          status: 'PRESENT',
        }));

        initialRoster.sort((a, b) =>
          String(a.rollNumber).localeCompare(
            String(b.rollNumber),
            undefined,
            { numeric: true }
          )
        );

        setStudentRoster(initialRoster);

        if (initialRoster.length === 0) {
          setNotice({
            type: 'warning',
            message: `No active students matched department "${subject.department}" and semester ${subject.semester}. Check the department, semester, and status fields in your Firestore students collection.`,
          });
        } else {
          setNotice(null);
        }
      } catch (error) {
        console.error('Failed to load student roster:', error);
        setStudentRoster([]);
        setNotice({
          type: 'danger',
          message:
            'Failed to load the student roster. Check Firestore permissions and the browser console for details.',
        });
      } finally {
        setIsLoadingRoster(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedSubjectId) {
      loadRosterForSubject(selectedSubjectId);
    } else {
      setStudentRoster([]);
    }
  }, [selectedSubjectId, loadRosterForSubject]);

  const toggleStudentStatus = (studentId) => {
    setStudentRoster((previous) =>
      previous.map((student) =>
        student.studentId === studentId
          ? {
            ...student,
            status:
              student.status === 'PRESENT' ? 'ABSENT' : 'PRESENT',
          }
          : student
      )
    );
  };

  const handleMarkAll = (status) => {
    setStudentRoster((previous) =>
      previous.map((student) => ({ ...student, status }))
    );
  };

  const handleSubmitAttendance = async (event) => {
    event.preventDefault();

    if (!facultyId) {
      setNotice({
        type: 'danger',
        message: 'Your faculty profile ID is missing. Attendance cannot be saved.',
      });
      return;
    }

    if (!selectedSubjectId) {
      setNotice({
        type: 'warning',
        message: 'Please select an allocated subject.',
      });
      return;
    }

    if (studentRoster.length === 0) {
      setNotice({
        type: 'warning',
        message: 'There are no students in the roster to submit.',
      });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const records = studentRoster.map((student) => ({
        studentId: student.studentId,
        status: student.status,
      }));

      const result = await attendanceService.saveSession({
        subjectId: selectedSubjectId,
        facultyId,
        date: selectedDate,
        period: selectedSlot,
        records,
      });

      if (!result?.success) {
        setNotice({
          type: 'danger',
          message: result?.error || 'Unable to save attendance.',
        });
        return;
      }

      const currentSubject = assignedSubjects.find(
        (subject) => subject.id === selectedSubjectId
      );

      const presentCount = studentRoster.filter(
        (student) => student.status === 'PRESENT'
      ).length;

      const absentCount = studentRoster.length - presentCount;

      setNotice({
        type: 'info',
        message: `Attendance recorded successfully for ${currentSubject?.code || 'the selected subject'
          } on ${selectedDate} (${selectedSlot}). Present: ${presentCount}, Absent: ${absentCount}.`,
      });
    } catch (error) {
      console.error('Failed to save attendance:', error);
      setNotice({
        type: 'danger',
        message:
          'An unexpected error occurred while saving attendance. Check the browser console.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const presentCount = studentRoster.filter(
    (student) => student.status === 'PRESENT'
  ).length;

  const absentCount = studentRoster.length - presentCount;

  const currentSubject = assignedSubjects.find(
    (subject) => subject.id === selectedSubjectId
  );

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
              Select an allocated course and record student attendance.
            </p>
          </div>
        </div>
      </div>

      {notice && (
        <AlertBanner
          type={notice.type}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      <Card title="Lecture Session Details">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          <div>
            <label
              htmlFor="allocated-subject"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '6px',
                color: '#475569',
              }}
            >
              Allocated Subject
            </label>

            <select
              id="allocated-subject"
              className="form-control"
              style={{ width: '100%' }}
              value={selectedSubjectId}
              onChange={(event) =>
                setSelectedSubjectId(event.target.value)
              }
              disabled={isLoadingSubjects || assignedSubjects.length === 0}
            >
              <option value="">
                {isLoadingSubjects
                  ? 'Loading subjects...'
                  : 'Select a subject'}
              </option>

              {assignedSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code} - {subject.name} (Sem {subject.semester} -{' '}
                  {subject.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="attendance-date"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '6px',
                color: '#475569',
              }}
            >
              Attendance Date
            </label>

            <input
              id="attendance-date"
              type="date"
              className="form-control"
              style={{ width: '100%' }}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="lecture-slot"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '6px',
                color: '#475569',
              }}
            >
              Lecture Period / Slot
            </label>

            <select
              id="lecture-slot"
              className="form-control"
              style={{ width: '100%' }}
              value={selectedSlot}
              onChange={(event) => setSelectedSlot(event.target.value)}
            >
              <option value="Slot 1 (09:00 - 10:00 AM)">
                Slot 1 (09:00 - 10:00 AM)
              </option>
              <option value="Slot 2 (10:00 - 11:00 AM)">
                Slot 2 (10:00 - 11:00 AM)
              </option>
              <option value="Slot 3 (11:15 - 12:15 PM)">
                Slot 3 (11:15 - 12:15 PM)
              </option>
              <option value="Slot 4 (01:00 - 02:00 PM)">
                Slot 4 (01:00 - 02:00 PM)
              </option>
              <option value="Slot 5 (02:00 - 03:00 PM)">
                Slot 5 (02:00 - 03:00 PM)
              </option>
              <option value="Lab Slot (02:00 - 05:00 PM)">
                Lab Slot (02:00 - 05:00 PM)
              </option>
            </select>
          </div>
        </div>
      </Card>

      <Card
        title={`Student Roster (${studentRoster.length} Enrolled in ${currentSubject?.code || 'Course'
          })`}
        actions={
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '12px', marginRight: '8px' }}>
              Present: <strong>{presentCount}</strong> | Absent:{' '}
              <strong style={{ color: '#991b1b' }}>{absentCount}</strong>
            </span>

            <Button
              variant="secondary"
              size="sm"
              disabled={studentRoster.length === 0 || isLoadingRoster}
              onClick={() => handleMarkAll('PRESENT')}
            >
              All Present
            </Button>

            <Button
              variant="secondary"
              size="sm"
              disabled={studentRoster.length === 0 || isLoadingRoster}
              onClick={() => handleMarkAll('ABSENT')}
            >
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
                <th style={{ textAlign: 'center', width: '160px' }}>
                  Toggle Action
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoadingRoster ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: 'center',
                      padding: '24px',
                      color: '#64748b',
                    }}
                  >
                    Loading student roster...
                  </td>
                </tr>
              ) : studentRoster.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: 'center',
                      padding: '24px',
                      color: '#64748b',
                    }}
                  >
                    {selectedSubjectId
                      ? 'No matching active students found for this subject.'
                      : 'Select an allocated subject to load students.'}
                  </td>
                </tr>
              ) : (
                studentRoster.map((student, index) => (
                  <tr key={student.studentId}>
                    <td className="tabular-nums">{index + 1}</td>
                    <td>
                      <strong>{student.rollNumber}</strong>
                    </td>
                    <td>{student.name}</td>
                    <td>Sec {student.section}</td>
                    <td>
                      <Badge
                        variant={
                          student.status === 'PRESENT' ? 'present' : 'absent'
                        }
                      >
                        {student.status}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Button
                        variant={
                          student.status === 'PRESENT'
                            ? 'secondary'
                            : 'primary'
                        }
                        size="sm"
                        onClick={() =>
                          toggleStudentStatus(student.studentId)
                        }
                        style={{
                          backgroundColor:
                            student.status === 'PRESENT'
                              ? '#dcfce7'
                              : '#fee2e2',
                          color:
                            student.status === 'PRESENT'
                              ? '#166534'
                              : '#991b1b',
                          borderColor:
                            student.status === 'PRESENT'
                              ? '#86efac'
                              : '#fca5a5',
                          fontWeight: 600,
                          width: '120px',
                        }}
                      >
                        {student.status === 'PRESENT'
                          ? 'Mark Absent'
                          : 'Mark Present'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <Button
            variant="secondary"
            disabled={!selectedSubjectId || isLoadingRoster || isSubmitting}
            onClick={() => loadRosterForSubject(selectedSubjectId)}
          >
            Reset Form
          </Button>

          <Button
            disabled={
              isSubmitting ||
              isLoadingRoster ||
              studentRoster.length === 0 ||
              !selectedSubjectId
            }
            onClick={handleSubmitAttendance}
          >
            {isSubmitting
              ? 'Saving Attendance...'
              : 'Save & Submit Attendance'}
          </Button>
        </div>
      </Card>
    </div>
  );
};