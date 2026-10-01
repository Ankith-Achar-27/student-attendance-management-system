/**
 * Faculty Service - Business logic & CRUD for Faculty Staff
 */

import { storageService, STORAGE_KEYS } from './storageService';

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const facultyService = {
  getAll() {
    return storageService.getItem(STORAGE_KEYS.FACULTY) || [];
  },

  getById(id) {
    const facultyList = this.getAll();
    return facultyList.find((f) => f.id === id) || null;
  },

  getByEmpId(employeeId) {
    if (!employeeId) return null;
    const facultyList = this.getAll();
    return facultyList.find(
      (f) => f.employeeId.toLowerCase() === employeeId.trim().toLowerCase()
    ) || null;
  },

  validate(data, currentId = null) {
    if (!data.employeeId?.trim()) {
      return { valid: false, error: 'Employee ID is required.' };
    }
    if (!data.name?.trim()) {
      return { valid: false, error: 'Faculty member name is required.' };
    }
    if (!data.email?.trim()) {
      return { valid: false, error: 'Official email is required.' };
    }
    if (!isValidEmail(data.email.trim())) {
      return { valid: false, error: 'Please enter a valid email address.' };
    }
    if (!data.department?.trim()) {
      return { valid: false, error: 'Department is required.' };
    }

    const facultyList = this.getAll();
    const cleanEmpId = data.employeeId.trim().toLowerCase();
    const cleanEmail = data.email.trim().toLowerCase();

    // Check duplicate employee ID
    const duplicateEmpId = facultyList.find(
      (f) => f.id !== currentId && f.employeeId.toLowerCase() === cleanEmpId
    );
    if (duplicateEmpId) {
      return { valid: false, error: `Employee ID '${data.employeeId.trim()}' is already in use.` };
    }

    // Check duplicate email
    const duplicateEmail = facultyList.find(
      (f) => f.id !== currentId && f.email.toLowerCase() === cleanEmail
    );
    if (duplicateEmail) {
      return { valid: false, error: `Email '${data.email.trim()}' is already in use.` };
    }

    return { valid: true };
  },

  add(facultyData) {
    const validation = this.validate(facultyData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const facultyList = this.getAll();
    const newFaculty = {
      id: `fac-${Date.now()}`,
      employeeId: facultyData.employeeId.trim().toUpperCase(),
      name: facultyData.name.trim(),
      email: facultyData.email.trim().toLowerCase(),
      department: facultyData.department.trim().toUpperCase(),
      designation: facultyData.designation?.trim() || 'Assistant Professor',
      status: facultyData.status || 'Active',
    };

    facultyList.push(newFaculty);
    storageService.setItem(STORAGE_KEYS.FACULTY, facultyList);
    return { success: true, data: newFaculty };
  },

  update(id, facultyData) {
    const validation = this.validate(facultyData, id);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const facultyList = this.getAll();
    const index = facultyList.findIndex((f) => f.id === id);
    if (index === -1) {
      return { success: false, error: 'Faculty member not found.' };
    }

    const updatedFaculty = {
      ...facultyList[index],
      employeeId: facultyData.employeeId.trim().toUpperCase(),
      name: facultyData.name.trim(),
      email: facultyData.email.trim().toLowerCase(),
      department: facultyData.department.trim().toUpperCase(),
      designation: facultyData.designation?.trim() || facultyList[index].designation,
      status: facultyData.status || facultyList[index].status,
    };

    facultyList[index] = updatedFaculty;
    storageService.setItem(STORAGE_KEYS.FACULTY, facultyList);
    return { success: true, data: updatedFaculty };
  },

  toggleStatus(id) {
    const facultyList = this.getAll();
    const faculty = facultyList.find((f) => f.id === id);
    if (!faculty) {
      return { success: false, error: 'Faculty member not found.' };
    }
    faculty.status = faculty.status === 'Active' ? 'Inactive' : 'Active';
    storageService.setItem(STORAGE_KEYS.FACULTY, facultyList);
    return { success: true, data: faculty };
  },

  delete(id) {
    const facultyList = this.getAll();
    const filtered = facultyList.filter((f) => f.id !== id);
    storageService.setItem(STORAGE_KEYS.FACULTY, filtered);
    return { success: true };
  },
};
