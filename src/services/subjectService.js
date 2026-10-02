/**
 * Subject Service (Phase 4 - Cloud Firestore Backed)
 * Provides asynchronous CRUD operations for the curriculum catalog in Firestore.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { storageService, STORAGE_KEYS } from './storageService';

export const subjectService = {
  async getAll() {
    if (isFirebaseConfigured && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'subjects'));
        const list = [];
        querySnapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        if (list.length > 0) {
          storageService.setItem(STORAGE_KEYS.SUBJECTS, list);
          return list;
        }
      } catch (err) {
        console.warn('Firestore subjects fetch fallback:', err.message);
      }
    }
    return storageService.getItem(STORAGE_KEYS.SUBJECTS) || [];
  },

  async getById(id) {
    if (isFirebaseConfigured && db && id) {
      try {
        const docSnap = await getDoc(doc(db, 'subjects', id));
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        }
      } catch (err) {
        console.warn('Firestore subject getById fallback:', err.message);
      }
    }
    const subjects = await this.getAll();
    return subjects.find((s) => s.id === id) || null;
  },

  async getByCode(code) {
    if (!code) return null;
    const subjects = await this.getAll();
    return (
      subjects.find(
        (s) => s.code.toLowerCase() === code.trim().toLowerCase()
      ) || null
    );
  },

  async getByFaculty(facultyId) {
    if (!facultyId) return [];
    const subjects = await this.getAll();
    return subjects.filter((s) => s.facultyId === facultyId);
  },

  async getByDepartmentAndSemester(department, semester) {
    const subjects = await this.getAll();
    return subjects.filter((s) => {
      const matchDept = !department || s.department.toLowerCase() === department.toLowerCase();
      const matchSem = !semester || Number(s.semester) === Number(semester);
      return matchDept && matchSem;
    });
  },

  async validate(data, currentId = null) {
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

    const subjects = await this.getAll();
    const cleanCode = data.code.trim().toLowerCase();

    const duplicate = subjects.find(
      (s) => s.id !== currentId && s.code.toLowerCase() === cleanCode
    );
    if (duplicate) {
      return { valid: false, error: `Subject Code '${data.code.trim()}' already exists.` };
    }

    return { valid: true };
  },

  async add(subjectData) {
    const validation = await this.validate(subjectData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const newSubject = {
      id: `subj-${Date.now()}`,
      code: subjectData.code.trim().toUpperCase(),
      name: subjectData.name.trim(),
      department: subjectData.department.trim().toUpperCase(),
      semester: parseInt(subjectData.semester, 10),
      credits: parseInt(subjectData.credits, 10),
      facultyId: subjectData.facultyId || null,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'subjects', newSubject.id), newSubject);
      } catch (err) {
        console.warn('Firestore subject write failed:', err.message);
      }
    }

    const localSubjects = storageService.getItem(STORAGE_KEYS.SUBJECTS) || [];
    localSubjects.push(newSubject);
    storageService.setItem(STORAGE_KEYS.SUBJECTS, localSubjects);

    return { success: true, data: newSubject };
  },

  async update(id, subjectData) {
    const validation = await this.validate(subjectData, id);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const updatedSubject = {
      id,
      code: subjectData.code.trim().toUpperCase(),
      name: subjectData.name.trim(),
      department: subjectData.department.trim().toUpperCase(),
      semester: parseInt(subjectData.semester, 10),
      credits: parseInt(subjectData.credits, 10),
      facultyId: subjectData.facultyId !== undefined ? subjectData.facultyId : null,
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'subjects', id), updatedSubject);
      } catch (err) {
        console.warn('Firestore subject update failed:', err.message);
      }
    }

    const localSubjects = storageService.getItem(STORAGE_KEYS.SUBJECTS) || [];
    const index = localSubjects.findIndex((s) => s.id === id);
    if (index !== -1) {
      localSubjects[index] = { ...localSubjects[index], ...updatedSubject };
      storageService.setItem(STORAGE_KEYS.SUBJECTS, localSubjects);
    }

    return { success: true, data: updatedSubject };
  },

  async assignFaculty(subjectId, facultyId) {
    const subject = await this.getById(subjectId);
    if (!subject) {
      return { success: false, error: 'Subject not found.' };
    }
    return await this.update(subjectId, { ...subject, facultyId: facultyId || null });
  },

  async delete(id) {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'subjects', id));
      } catch (err) {
        console.warn('Firestore subject delete failed:', err.message);
      }
    }

    const localSubjects = storageService.getItem(STORAGE_KEYS.SUBJECTS) || [];
    const filtered = localSubjects.filter((s) => s.id !== id);
    storageService.setItem(STORAGE_KEYS.SUBJECTS, filtered);

    return { success: true };
  },
};
