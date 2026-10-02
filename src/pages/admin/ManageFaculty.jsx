import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, AlertBanner } from '../../components/common/UIComponents';
import { facultyService } from '../../services/facultyService';
import { subjectService } from '../../services/subjectService';
import { storageService } from '../../services/storageService';

export const ManageFaculty = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal and Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacultyId, setEditingFacultyId] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    department: 'CSE',
    designation: 'Assistant Professor',
    status: 'Active',
  });
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState(null);

  const loadFaculty = React.useCallback(async () => {
    const [list, subs] = await Promise.all([
      facultyService.getAll(),
      subjectService.getAll(),
    ]);
    setFacultyList(list || []);
    setSubjectList(subs || []);
  }, []);

  useEffect(() => {
    loadFaculty();
  }, [loadFaculty]);

  const openAddModal = () => {
    setEditingFacultyId(null);
    setFormData({
      employeeId: '',
      name: '',
      email: '',
      department: 'CSE',
      designation: 'Assistant Professor',
      status: 'Active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (faculty) => {
    setEditingFacultyId(faculty.id);
    setFormData({
      employeeId: faculty.employeeId,
      name: faculty.name,
      email: faculty.email,
      department: faculty.department,
      designation: faculty.designation,
      status: faculty.status,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    let result;
    if (editingFacultyId) {
      result = await facultyService.update(editingFacultyId, formData);
    } else {
      result = await facultyService.add(formData);
    }

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    setIsModalOpen(false);
    await loadFaculty();
    setNotice({
      type: 'info',
      message: editingFacultyId
        ? `Faculty profile for ${formData.name} updated successfully.`
        : `Faculty member ${formData.name} (${formData.employeeId.toUpperCase()}) added successfully.`,
    });
  };

  const handleToggleStatus = async (id) => {
    const res = await facultyService.toggleStatus(id);
    if (res.success) {
      await loadFaculty();
      setNotice({
        type: 'info',
        message: `Status updated for ${res.data.name} to ${res.data.status}.`,
      });
    }
  };

  const handleDelete = async (id, name) => {
    await facultyService.delete(id);
    await loadFaculty();
    setNotice({
      type: 'warning',
      message: `Faculty record for ${name} has been deleted.`,
    });
  };

  const handleExportCSV = async () => {
    const allSubjects = await subjectService.getAll();
    const headers = ['Employee ID', 'Full Name', 'Department', 'Designation', 'Official Email', 'Assigned Courses', 'Status'];
    const rows = filteredFaculty.map((f) => [
      f.employeeId,
      f.name,
      f.department,
      f.designation,
      f.email,
      allSubjects.filter((s) => s.facultyId === f.id).length,
      f.status,
    ]);
    storageService.exportToCSV('Faculty_Directory_Export', headers, rows);
  };

  const filteredFaculty = facultyList.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span>Admin</span>
          <span className="breadcrumb-separator">/</span>
          <span>Faculty</span>
        </div>
        <div className="page-title-row">
          <div>
            <h1 className="page-title">Faculty Staff Directory</h1>
            <p className="page-subtitle">
              Maintain instructional staff profiles, designations, and department affiliations
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              Export Directory (CSV)
            </Button>
            <Button size="sm" onClick={openAddModal}>
              + Add Faculty Member
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
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search by Employee ID, Name or Department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Showing <strong>{filteredFaculty.length}</strong> of <strong>{facultyList.length}</strong> faculty members
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Faculty Full Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Official Email</th>
                <th>Assigned Courses</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculty.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No faculty records found.
                  </td>
                </tr>
              ) : (
                filteredFaculty.map((faculty) => {
                  const assignedCount = subjectList.filter((s) => s.facultyId === faculty.id).length;
                  return (
                    <tr key={faculty.id}>
                      <td><strong>{faculty.employeeId}</strong></td>
                      <td>{faculty.name}</td>
                      <td>{faculty.department}</td>
                      <td>{faculty.designation}</td>
                      <td style={{ color: '#475569', fontSize: '12px' }}>{faculty.email}</td>
                      <td className="tabular-nums">
                        <Badge variant={assignedCount > 0 ? 'neutral' : 'warning'}>
                          {assignedCount} Subject(s)
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={faculty.status === 'Active' ? 'present' : 'absent'}>
                          {faculty.status}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditModal(faculty)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleToggleStatus(faculty.id)}
                            style={{
                              color: faculty.status === 'Active' ? '#92400e' : '#166534',
                            }}
                          >
                            {faculty.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDelete(faculty.id, faculty.name)}
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

      {/* Add / Edit Faculty Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFacultyId ? 'Edit Faculty Record' : 'Add New Faculty Member'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFormSubmit}>
              {editingFacultyId ? 'Save Changes' : 'Add Faculty'}
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

        <form onSubmit={handleFormSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Employee ID <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                style={{ width: '100%' }}
                placeholder="e.g. FAC-125"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                style={{ width: '100%' }}
                placeholder="e.g. Dr. Anand Verma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Official Email <span className="required">*</span>
            </label>
            <input
              type="email"
              className="form-control"
              style={{ width: '100%' }}
              placeholder="e.g. anand.v@mce-sams.local"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="CSE">Computer Science (CSE)</option>
                <option value="ECE">Electronics (ECE)</option>
                <option value="IT">Information Tech (IT)</option>
                <option value="ME">Mechanical (ME)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Designation <span className="required">*</span>
              </label>
              <select
                className="form-control"
                style={{ width: '100%' }}
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              >
                <option value="Professor & HOD">Professor & HOD</option>
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Adjunct Lecturer">Adjunct Lecturer</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-control"
              style={{ width: '100%' }}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};
