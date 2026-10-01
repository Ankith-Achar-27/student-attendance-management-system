/**
 * Subject Service - Curriculum catalog & Faculty Assignment
 */

import { storageService, STORAGE_KEYS } from './storageService';

export const subjectService = {
  getAll() {
    return storageService.getItem(STORAGE_KEYS.SUBJECTS) || [];
  },

  getById(id) {
    const subjects = this.getAll();
    return subjects.find((s) => s.id === id) || null;
  },

  getByCode(code) {
    if (!code) return null;
    const subjects = this.getAll();
    return subjects.find(
      (s) => s.code.toLowerCase() === code.trim().toLowerCase()
    ) || null;
  },

  getByFaculty(facultyId) {
    if (!facultyId) return [];
    const subjects = this.getAll();
    return subjects.filter((s) => s.facultyId === facultyId);
  },

  getByDepartmentAndSemester(department, semester) {
    const subjects = this.getAll();
    return subjects.filter((s) => {
      const matchDept = !department || s.department.toLowerCase() === department.toLowerCase();
      const matchSem = !semester || Number(s.semester) === Number(semester);
      return matchDept && matchSem;
    });
  },

  validate(data, currentId = null) {
    if (!data.code?.trim()) {
      return { valid: false, error: 'Subject Code is required (e.g. CS501).' };
    }
    if (!data.name?.trim()) {
      return { valid: false, error: 'Subject Course Title is required.' };
    }
    if (!data.department?.trim()) {
      return { valid: false, error: 'Department is required.' };
    }
    if (!data.semester) {
      return { valid: false, error: 'Semester is required.' };
    }
    if (data.credits === undefined || data.credits === null || isNaN(data.credits)) {
      return { valid: false, error: 'Valid course credits are required.' };
    }

    const subjects = this.getAll();
    const cleanCode = data.code.trim().toLowerCase();

    // Check duplicate code
    const duplicate = subjects.find(
      (s) => s.id !== currentId && s.code.toLowerCase() === cleanCode
    );
    if (duplicate) {
      return { valid: false, error: `Subject Code '${data.code.trim()}' already exists.` };
    }

    return { valid: true };
  },

  add(subjectData) {
    const validation = this.validate(subjectData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const subjects = this.getAll();
    const newSubject = {
      id: `subj-${Date.now()}`,
      code: subjectData.code.trim().toUpperCase(),
      name: subjectData.name.trim(),
      department: subjectData.department.trim().toUpperCase(),
      semester: parseInt(subjectData.semester, 10),
      credits: parseInt(subjectData.credits, 10),
      facultyId: subjectData.facultyId || null,
    };

    subjects.push(newSubject);
    storageService.setItem(STORAGE_KEYS.SUBJECTS, subjects);
    return { success: true, data: newSubject };
  },

  update(id, subjectData) {
    const validation = this.validate(subjectData, id);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const subjects = this.getAll();
    const index = subjects.findIndex((s) => s.id === id);
    if (index === -1) {
      return { success: false, error: 'Subject record not found.' };
    }

    const updatedSubject = {
      ...subjects[index],
      code: subjectData.code.trim().toUpperCase(),
      name: subjectData.name.trim(),
      department: subjectData.department.trim().toUpperCase(),
      semester: parseInt(subjectData.semester, 10),
      credits: parseInt(subjectData.credits, 10),
      facultyId: subjectData.facultyId !== undefined ? subjectData.facultyId : subjects[index].facultyId,
    };

    subjects[index] = updatedSubject;
    storageService.setItem(STORAGE_KEYS.SUBJECTS, subjects);
    return { success: true, data: updatedSubject };
  },

  assignFaculty(subjectId, facultyId) {
    const subjects = this.getAll();
    const index = subjects.findIndex((s) => s.id === subjectId);
    if (index === -1) {
      return { success: false, error: 'Subject not found.' };
    }

    subjects[index].facultyId = facultyId || null;
    storageService.setItem(STORAGE_KEYS.SUBJECTS, subjects);
    return { success: true, data: subjects[index] };
  },

  delete(id) {
    const subjects = this.getAll();
    const filtered = subjects.filter((s) => s.id !== id);
    storageService.setItem(STORAGE_KEYS.SUBJECTS, filtered);
    return { success: true };
  },
};
