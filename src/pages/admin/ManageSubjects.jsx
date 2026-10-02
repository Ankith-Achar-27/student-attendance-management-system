import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, AlertBanner } from '../../components/common/UIComponents';
import { subjectService } from '../../services/subjectService';
import { facultyService } from '../../services/facultyService';
import { storageService } from '../../services/storageService';

export const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);

  // Modals state
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [subjectFormData, setSubjectFormData] = useState({
    code: '',
    name: '',
    department: 'CSE',
    semester: 5,
    credits: 4,
    facultyId: '',
  });

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningSubject, setAssigningSubject] = useState(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');

  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [subs, facs] = await Promise.all([
        subjectService.getAll(),
        facultyService.getAll(),
      ]);
      setSubjects(subs || []);
      setFacultyList(facs || []);
    } catch (err) {
      console.error('Failed to load subjects data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddSubjectModal = () => {
    setEditingSubjectId(null);
    setSubjectFormData({
      code: '',
      name: '',
      department: 'CSE',
      semester: 5,
      credits: 4,
      facultyId: '',
    });
    setFormError('');
    setIsSubjectModalOpen(true);
  };

  const openEditSubjectModal = (sub) => {
    setEditingSubjectId(sub.id);
    setSubjectFormData({
      code: sub.code,
      name: sub.name,
      department: sub.department,
      semester: sub.semester,
      credits: sub.credits,
      facultyId: sub.facultyId || '',
    });
    setFormError('');
    setIsSubjectModalOpen(true);
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    let res;
    if (editingSubjectId) {
      res = await subjectService.update(editingSubjectId, subjectFormData);
    } else {
      res = await subjectService.add(subjectFormData);
    }

    if (!res.success) {
      setFormError(res.error);
      return;
    }

    setIsSubjectModalOpen(false);
    await loadData();
    setNotice({
      type: 'info',
      message: editingSubjectId
        ? `Subject ${subjectFormData.code.toUpperCase()} updated successfully.`
        : `New subject ${subjectFormData.code.toUpperCase()} created successfully.`,
    });
  };

  const openAssignModal = (sub) => {
    setAssigningSubject(sub);
    setSelectedFacultyId(sub.facultyId || '');
    setFormError('');
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assigningSubject) return;

    const res = await subjectService.assignFaculty(assigningSubject.id, selectedFacultyId || null);
    if (!res.success) {
      setFormError(res.error);
      return;
    }

    setIsAssignModalOpen(false);
    await loadData();
    const assignedFac = facultyList.find((f) => f.id === selectedFacultyId);
    setNotice({
      type: 'info',
      message: assignedFac
        ? `${assigningSubject.code} successfully assigned to ${assignedFac.name}.`
        : `Faculty assignment removed for ${assigningSubject.code}.`,
    });
  };

  const handleDeleteSubject = async (id, code) => {
    await subjectService.delete(id);
    await loadData();
    setNotice({
      type: 'warning',
      message: `Subject ${code} removed from catalog.`,
    });
  };

  const handleExportCSV = () => {
    const headers = ['Subject Code', 'Course Title', 'Department', 'Semester', 'Credits', 'Assigned Instructor'];
    const rows = subjects.map((s) => {
      const fac = facultyList.find((f) => f.id === s.facultyId);
      return [
        s.code,
        s.name,
        s.department,
        `Sem ${s.semester}`,
        s.credits,
        fac ? fac.name : 'Unallocated',
      ];
    });
    storageService.exportToCSV('Curriculum_Subjects_Catalog', headers, rows);
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span>Admin</span>
          <span className="breadcrumb-separator">/</span>
          <span>Subjects & Allotment</span>
        </div>
        <div className="page-title-row">
          <div>
            <h1 className="page-title">Curriculum Subjects & Faculty Allotment</h1>
            <p className="page-subtitle">
              Configure academic subject offerings and map responsible instructional faculty
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              Export Catalog (CSV)
            </Button>
            <Button size="sm" onClick={openAddSubjectModal}>
              + Create Subject
            </Button>
          </div>
        </div>
      </div>

      <AlertBanner
        type={notice?.type}
        message={notice?.message}
        onDismiss={() => setNotice(null)}
      />

      <Card title={`Active Curriculum Subjects (${subjects.length} Offerings)`}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject Code</th>
                <th>Course Title</th>
                <th>Dept</th>
                <th>Semester</th>
                <th>Credits</th>
                <th>Assigned Instructor</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    ⏳ Loading curriculum subjects...
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No subjects in catalog. Click '+ Create Subject' to add one.
                  </td>
                </tr>
              ) : (
                subjects.map((sub) => {
                  const faculty = facultyList.find((f) => f.id === sub.facultyId);
                  return (
                    <tr key={sub.id}>
                      <td><strong style={{ fontFamily: 'var(--font-mono)' }}>{sub.code}</strong></td>
                      <td>{sub.name}</td>
                      <td>{sub.department}</td>
                      <td>Sem {sub.semester}</td>
                      <td className="tabular-nums">{sub.credits}</td>
                      <td>
                        {faculty ? (
                          <div>
                            <span style={{ fontWeight: 600 }}>{faculty.name}</span>
                            <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                              ({faculty.employeeId})
                            </span>
                          </div>
                        ) : (
                          <Badge variant="warning">Unallocated</Badge>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openAssignModal(sub)}
                          >
                            Assign Faculty
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditSubjectModal(sub)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDeleteSubject(sub.id, sub.code)}
                            style={{ color: '#991b1b' }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Subject Modal */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title={editingSubjectId ? 'Edit Subject Offering' : 'Create New Curriculum Subject'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSubjectModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubjectSubmit}>
              {editingSubjectId ? 'Save Changes' : 'Create Subject'}
            </Button>
          </>
        }
      >
        {formError && (
          <div className="alert-box alert-danger" style={{ marginBottom: '14px' }}>
            <span>⚠️</span>
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubjectSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Subject Code <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                style={{ width: '100%' }}
                placeholder="e.g. CS505"
                value={subjectFormData.code}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, code: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Credits <span className="required">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="6"
                className="form-control"
                style={{ width: '100%' }}
                value={subjectFormData.credits}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, credits: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Course Title <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              style={{ width: '100%' }}
              placeholder="e.g. Computer Networks & Protocols"
              value={subjectFormData.name}
              onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Department <span className="required">*</span>
              </label>
              <select
                className="form-control"
                style={{ width: '100%' }}
                value={subjectFormData.department}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, department: e.target.value })}
              >
                <option value="CSE">Computer Science (CSE)</option>
                <option value="ECE">Electronics (ECE)</option>
                <option value="IT">Information Tech (IT)</option>
                <option value="ME">Mechanical (ME)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Semester <span className="required">*</span>
              </label>
              <select
                className="form-control"
                style={{ width: '100%' }}
                value={subjectFormData.semester}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, semester: e.target.value })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Instructor (Optional)</label>
            <select
              className="form-control"
              style={{ width: '100%' }}
              value={subjectFormData.facultyId}
              onChange={(e) => setSubjectFormData({ ...subjectFormData, facultyId: e.target.value })}
            >
              <option value="">-- Unallocated --</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.employeeId} - {f.department})
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Assign Faculty Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Instructor to ${assigningSubject?.code}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignSubmit}>Save Assignment</Button>
          </>
        }
      >
        <div style={{ marginBottom: '14px', fontSize: '13px', color: '#475569' }}>
          Assigning responsible faculty instructor for course: <strong>{assigningSubject?.name}</strong> ({assigningSubject?.department} Sem {assigningSubject?.semester})
        </div>

        <div className="form-group">
          <label className="form-label">Select Faculty Instructor</label>
          <select
            className="form-control"
            style={{ width: '100%' }}
            value={selectedFacultyId}
            onChange={(e) => setSelectedFacultyId(e.target.value)}
          >
            <option value="">-- No Instructor (Unallocated) --</option>
            {facultyList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} &bull; {f.designation} ({f.employeeId} - {f.department})
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  );
};
