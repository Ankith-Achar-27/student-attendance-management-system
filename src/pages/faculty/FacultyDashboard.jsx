import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../../components/common/UIComponents';
import { useRole } from '../../context/RoleContext';
import { subjectService } from '../../services/subjectService';
import { attendanceService } from '../../services/attendanceService';

export const FacultyDashboard = () => {
  const { activeUser } = useRole();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [summary, setSummary] = useState({
    totalCourses: 0,
    totalLectures: 0,
    overallAverage: 0,
  });

  useEffect(() => {
    let isMounted = true;

    const loadFacultyData = async () => {
      setLoading(true);
      setError('');

      try {
        // Support the faculty ID formats used by the application.
        const facultyId =
          activeUser?.linkedEntityId ||
          activeUser?.entityId ||
          activeUser?.entity?.id;

        if (!facultyId) {
          console.warn(
            'Faculty ID is missing from the active user profile:',
            activeUser
          );

          if (isMounted) {
            setCourses([]);
            setSummary({
              totalCourses: 0,
              totalLectures: 0,
              overallAverage: 0,
            });
            setError(
              'Your faculty profile could not be linked to a faculty record. Please contact the administrator.'
            );
          }

          return;
        }

        const assignedSubjects =
          await subjectService.getByFaculty(facultyId);

        let totalSessionsHeld = 0;
        let totalPctSum = 0;
        const courseWithStats = [];

        for (const sub of assignedSubjects) {
          const reg =
            await attendanceService.calculateCourseRegisterStats(sub.id);

          totalSessionsHeld += reg.sessionsCount;

          let avgPct = 0;

          if (reg.studentStats.length > 0) {
            const sum = reg.studentStats.reduce(
              (acc, student) => acc + student.percentage,
              0
            );

            avgPct = Number(
              (sum / reg.studentStats.length).toFixed(1)
            );

            totalPctSum += avgPct;
          }

          courseWithStats.push({
            id: sub.id,
            code: sub.code,
            title: sub.name,
            semester: sub.semester,
            department: sub.department,
            enrolledCount: reg.studentStats.length,
            sessionsCount: reg.sessionsCount,
            avgAttendance: avgPct,
          });
        }

        const overallAverage =
          assignedSubjects.length > 0
            ? Number(
              (totalPctSum / assignedSubjects.length).toFixed(1)
            )
            : 0;

        if (isMounted) {
          setCourses(courseWithStats);

          setSummary({
            totalCourses: assignedSubjects.length,
            totalLectures: totalSessionsHeld,
            overallAverage,
          });
        }
      } catch (err) {
        console.error('Failed to load faculty dashboard:', err);

        if (isMounted) {
          setCourses([]);
          setSummary({
            totalCourses: 0,
            totalLectures: 0,
            overallAverage: 0,
          });
          setError(
            'Unable to load faculty dashboard data. Please refresh the page and try again.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (activeUser) {
      loadFacultyData();
    } else {
      setCourses([]);
      setSummary({
        totalCourses: 0,
        totalLectures: 0,
        overallAverage: 0,
      });
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [activeUser]);

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span>Faculty</span>
          <span className="breadcrumb-separator">/</span>
          <span>Dashboard</span>
        </div>

        <div className="page-title-row">
          <div>
            <h1 className="page-title">
              Faculty Instructional Portal
            </h1>

            <p className="page-subtitle">
              {activeUser?.name} &bull;{' '}
              {activeUser?.roleTitle || 'Faculty'} &bull;{' '}
              {activeUser?.dept || activeUser?.department || ''}
            </p>
          </div>

          <div>
            <Link to="/faculty/mark">
              <Button size="sm">📝 Take Attendance Today</Button>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
          }}
        >
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Assigned Subjects</div>
          <div className="stat-value">
            {loading ? '...' : summary.totalCourses}
          </div>
          <div className="stat-desc">Active course load</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Total Lectures Conducted
          </div>
          <div className="stat-value">
            {loading ? '...' : summary.totalLectures}
          </div>
          <div className="stat-desc">
            Across all allocated batches
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Average Student Attendance
          </div>
          <div
            className="stat-value"
            style={{
              color:
                summary.overallAverage >= 75
                  ? '#166534'
                  : '#991b1b',
            }}
          >
            {loading ? '...' : `${summary.overallAverage}%`}
          </div>
          <div className="stat-desc">
            Calculated across all batches
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Pending Verifications
          </div>
          <div
            className="stat-value"
            style={{ color: '#334155' }}
          >
            0
          </div>
          <div className="stat-desc">
            All sessions recorded up to date
          </div>
        </div>
      </div>

      <Card title="Assigned Courses & Lecture Registers">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Department / Batch</th>
                <th>Enrolled</th>
                <th>Lectures Held</th>
                <th>Batch Average</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: 'center',
                      padding: '24px',
                      color: '#64748b',
                    }}
                  >
                    Loading assigned courses...
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: 'center',
                      padding: '24px',
                      color: '#64748b',
                    }}
                  >
                    {error
                      ? 'Course information could not be loaded.'
                      : 'No courses currently assigned to this faculty profile.'}
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <strong
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {course.code}
                      </strong>
                    </td>

                    <td>{course.title}</td>

                    <td>
                      {course.department} - Sem {course.semester}
                    </td>

                    <td className="tabular-nums">
                      {course.enrolledCount} Students
                    </td>

                    <td className="tabular-nums">
                      {course.sessionsCount} Sessions
                    </td>

                    <td
                      className="tabular-nums"
                      style={{
                        fontWeight: 600,
                        color:
                          course.avgAttendance >= 75
                            ? '#166534'
                            : '#b45309',
                      }}
                    >
                      {course.avgAttendance > 0
                        ? `${course.avgAttendance}%`
                        : 'No sessions'}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div
                        className="table-actions"
                        style={{ justifyContent: 'flex-end' }}
                      >
                        <Link to="/faculty/mark">
                          <Button size="sm">
                            Mark Attendance
                          </Button>
                        </Link>

                        <Link to="/faculty/reports">
                          <Button
                            variant="secondary"
                            size="sm"
                          >
                            View Register
                          </Button>
                        </Link>
                      </div>
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