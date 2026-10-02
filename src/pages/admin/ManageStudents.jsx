import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, AlertBanner } from '../../components/common/UIComponents';
import { studentService } from '../../services/studentService';
import { storageService } from '../../services/storageService';

export const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedSem, setSelectedSem] = useState('All');

  // Modal and Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [formData, setFormData] = useState({
    rollNumber: '',
    name: '',
    email: '',
    department: 'CSE',
    semester: 5,
    section: 'A',
    status: 'Active',
  });
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState(null);

  const loadStudents = React.useCallback(async () => {
    const list = await studentService.getAll();
    setStudents(list || []);
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const openAddModal = () => {
    setEditingStudentId(null);
    setFormData({
      rollNumber: '',
      name: '',
      email: '',
      department: 'CSE',
      semester: 5,
      section: 'A',
      status: 'Active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudentId(student.id);
    setFormData({
      rollNumber: student.rollNumber,
      name: student.name,
      email: student.email,
      department: student.department,
      semester: student.semester,
      section: student.section,
      status: student.status,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    let result;
    if (editingStudentId) {
      result = await studentService.update(editingStudentId, formData);
    } else {
      result = await studentService.add(formData);
    }

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    setIsModalOpen(false);
    await loadStudents();
    setNotice({
      type: 'info',
      message: editingStudentId
        ? `Student record for ${formData.name} updated successfully.`
        : `Student ${formData.name} (${formData.rollNumber.toUpperCase()}) enrolled successfully.`,
    });
  };

  const handleToggleStatus = async (id) => {
    const res = await studentService.toggleStatus(id);
    if (res.success) {
      await loadStudents();
      setNotice({
        type: 'info',
        message: `Status updated for ${res.data.name} to ${res.data.status}.`,
      });
    }
  };

  const handleDelete = async (id, name) => {
    await studentService.delete(id);
    await loadStudents();
    setNotice({
      type: 'warning',
      message: `Student record for ${name} has been removed.`,
    });
  };

  const handleExportCSV = () => {
    const headers = ['Roll Number', 'Full Name', 'Department', 'Semester', 'Section', 'Email', 'Status'];
    const rows = filteredStudents.map((s) => [
      s.rollNumber,
      s.name,
      s.department,
      s.semester,
      s.section,
      s.email,
      s.status,
    ]);
    storageService.exportToCSV('Student_Directory_Export', headers, rows);
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || s.department === selectedDept;
    const matchesSem = selectedSem === 'All' || String(s.semester) === String(selectedSem);
    return matchesSearch && matchesDept && matchesSem;
  });

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span>Admin</span>
          <span className="breadcrumb-separator">/</span>
          <span>Students</span>
        </div>
        <div className="page-title-row">
          <div>
            <h1 className="page-title">Student Directory & Enrollment</h1>
            <p className="page-subtitle">
              Manage student records, batch assignments, and institutional enrollment status
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              Export Directory (CSV)
            </Button>
            <Button size="sm" onClick={openAddModal}>
              + Enroll New Student
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
        {/* Filter Toolbar */}
        <div className="filter-bar">
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-control search-input"
              placeholder="Search by Roll No or Student Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="form-control"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="All">All Departments</option>
              <option value="CSE">Computer Science (CSE)</option>
              <option value="ECE">Electronics (ECE)</option>
              <option value="IT">Information Tech (IT)</option>
              <option value="ME">Mechanical (ME)</option>
            </select>
            <select
              className="form-control"
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
            >
              <option value="All">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="3">Semester 3</option>
              <option value="5">Semester 5</option>
              <option value="7">Semester 7</option>
            </select>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> records
          </div>
        </div>

        {/* Student Data Table */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Student Full Name</th>
                <th>Dept</th>
                <th>Semester</th>
                <th>Section</th>
                <th>Institutional Email</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No students match the current search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td><strong>{student.rollNumber}</strong></td>
                    <td>{student.name}</td>
                    <td>{student.department}</td>
                    <td className="tabular-nums">Sem {student.semester}</td>
                    <td>Sec {student.section}</td>
                    <td style={{ color: '#475569', fontSize: '12px' }}>{student.email}</td>
                    <td>
                      <Badge variant={student.status === 'Active' ? 'present' : 'absent'}>
                        {student.status}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditModal(student)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleToggleStatus(student.id)}
                          style={{
                            color: student.status === 'Active' ? '#92400e' : '#166534',
                          }}
                        >
                          {student.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDelete(student.id, student.name)}
                          style={{ color: '#991b1b' }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudentId ? 'Edit Student Record' : 'Enroll New Student'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFormSubmit}>
              {editingStudentId ? 'Update Record' : 'Save & Enroll'}
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
                Roll Number / USN <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                style={{ width: '100%' }}
                placeholder="e.g. CS2024-050"
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
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
                placeholder="e.g. Ananya Roy"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Institutional Email <span className="required">*</span>
            </label>
            <input
              type="email"
              className="form-control"
              style={{ width: '100%' }}
              placeholder="e.g. ananya.roy@niet.edu"
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
                Semester <span className="required">*</span>
              </label>
              <select
                className="form-control"
                style={{ width: '100%' }}
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              >
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Section <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                style={{ width: '100%' }}
                placeholder="e.g. A"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Enrollment Status</label>
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
          </div>
        </form>
      </Modal>
    </div>
  );
};
