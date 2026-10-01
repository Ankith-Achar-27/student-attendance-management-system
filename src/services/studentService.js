/**
 * Student Service - Business logic & CRUD for Students
 */

import { storageService, STORAGE_KEYS } from './storageService';

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const studentService = {
  getAll() {
    return storageService.getItem(STORAGE_KEYS.STUDENTS) || [];
  },

  getById(id) {
    const students = this.getAll();
    return students.find((s) => s.id === id) || null;
  },

  getByRoll(rollNumber) {
    if (!rollNumber) return null;
    const students = this.getAll();
    return students.find(
      (s) => s.rollNumber.toLowerCase() === rollNumber.trim().toLowerCase()
    ) || null;
  },

  validate(data, currentId = null) {
    if (!data.rollNumber?.trim()) {
      return { valid: false, error: 'Roll Number (USN) is required.' };
    }
    if (!data.name?.trim()) {
      return { valid: false, error: 'Student full name is required.' };
    }
    if (!data.email?.trim()) {
      return { valid: false, error: 'Institutional email is required.' };
    }
    if (!isValidEmail(data.email.trim())) {
      return { valid: false, error: 'Please enter a valid email address.' };
    }
    if (!data.department?.trim()) {
      return { valid: false, error: 'Department is required.' };
    }
    if (!data.semester) {
      return { valid: false, error: 'Semester is required.' };
    }
    if (!data.section?.trim()) {
      return { valid: false, error: 'Section is required.' };
    }

    const students = this.getAll();
    const cleanRoll = data.rollNumber.trim().toLowerCase();
    const cleanEmail = data.email.trim().toLowerCase();

    // Check duplicate roll number
    const duplicateRoll = students.find(
      (s) => s.id !== currentId && s.rollNumber.toLowerCase() === cleanRoll
    );
    if (duplicateRoll) {
      return { valid: false, error: `Roll Number '${data.rollNumber.trim()}' is already registered.` };
    }

    // Check duplicate email
    const duplicateEmail = students.find(
      (s) => s.id !== currentId && s.email.toLowerCase() === cleanEmail
    );
    if (duplicateEmail) {
      return { valid: false, error: `Email '${data.email.trim()}' is already in use by another student.` };
    }

    return { valid: true };
  },

  add(studentData) {
    const validation = this.validate(studentData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const students = this.getAll();
    const newStudent = {
      id: `stud-${Date.now()}`,
      rollNumber: studentData.rollNumber.trim().toUpperCase(),
      name: studentData.name.trim(),
      email: studentData.email.trim().toLowerCase(),
      department: studentData.department.trim().toUpperCase(),
      semester: parseInt(studentData.semester, 10),
      section: studentData.section.trim().toUpperCase(),
      status: studentData.status || 'Active',
    };

    students.push(newStudent);
    storageService.setItem(STORAGE_KEYS.STUDENTS, students);
    return { success: true, data: newStudent };
  },

  update(id, studentData) {
    const validation = this.validate(studentData, id);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const students = this.getAll();
    const index = students.findIndex((s) => s.id === id);
    if (index === -1) {
      return { success: false, error: 'Student record not found.' };
    }

    const updatedStudent = {
      ...students[index],
      rollNumber: studentData.rollNumber.trim().toUpperCase(),
      name: studentData.name.trim(),
      email: studentData.email.trim().toLowerCase(),
      department: studentData.department.trim().toUpperCase(),
      semester: parseInt(studentData.semester, 10),
      section: studentData.section.trim().toUpperCase(),
      status: studentData.status || students[index].status,
    };

    students[index] = updatedStudent;
    storageService.setItem(STORAGE_KEYS.STUDENTS, students);
    return { success: true, data: updatedStudent };
  },

  toggleStatus(id) {
    const students = this.getAll();
    const student = students.find((s) => s.id === id);
    if (!student) {
      return { success: false, error: 'Student not found.' };
    }
    student.status = student.status === 'Active' ? 'Inactive' : 'Active';
    storageService.setItem(STORAGE_KEYS.STUDENTS, students);
    return { success: true, data: student };
  },

  delete(id) {
    const students = this.getAll();
    const filtered = students.filter((s) => s.id !== id);
    storageService.setItem(STORAGE_KEYS.STUDENTS, filtered);
    return { success: true };
  },
};
