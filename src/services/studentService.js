/**
 * Student Service (Phase 4 - Cloud Firestore Backed)
 * Provides asynchronous CRUD operations interfacing with the 'students' Firestore collection
 * while maintaining backward-compatible local fallback.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { storageService, STORAGE_KEYS } from './storageService';

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const studentService = {
  async getAll() {
    if (isFirebaseConfigured && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'students'));
        const list = [];
        querySnapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        if (list.length > 0) {
          // Sync locally for offline capability
          storageService.setItem(STORAGE_KEYS.STUDENTS, list);
          return list;
        }
      } catch (err) {
        console.warn('Firestore fetch failed, reading from local fallback:', err.message);
      }
    }
    return storageService.getItem(STORAGE_KEYS.STUDENTS) || [];
  },

  async getById(id) {
    if (isFirebaseConfigured && db && id) {
      try {
        const docSnap = await getDoc(doc(db, 'students', id));
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        }
      } catch (err) {
        console.warn('Firestore getById fallback:', err.message);
      }
    }
    const students = await this.getAll();
    return students.find((s) => s.id === id) || null;
  },

  async getByRoll(rollNumber) {
    if (!rollNumber) return null;
    const students = await this.getAll();
    return (
      students.find(
        (s) => s.rollNumber.toLowerCase() === rollNumber.trim().toLowerCase()
      ) || null
    );
  },

  async validate(data, currentId = null) {
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

    const students = await this.getAll();
    const cleanRoll = data.rollNumber.trim().toLowerCase();
    const cleanEmail = data.email.trim().toLowerCase();

    const duplicateRoll = students.find(
      (s) => s.id !== currentId && s.rollNumber.toLowerCase() === cleanRoll
    );
    if (duplicateRoll) {
      return { valid: false, error: `Roll Number '${data.rollNumber.trim()}' is already registered.` };
    }

    const duplicateEmail = students.find(
      (s) => s.id !== currentId && s.email.toLowerCase() === cleanEmail
    );
    if (duplicateEmail) {
      return { valid: false, error: `Email '${data.email.trim()}' is already in use by another student.` };
    }

    return { valid: true };
  },

  async add(studentData) {
    const validation = await this.validate(studentData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const newStudent = {
      id: `stud-${Date.now()}`,
      rollNumber: studentData.rollNumber.trim().toUpperCase(),
      name: studentData.name.trim(),
      email: studentData.email.trim().toLowerCase(),
      department: studentData.department.trim().toUpperCase(),
      semester: parseInt(studentData.semester, 10),
      section: studentData.section.trim().toUpperCase(),
      status: studentData.status || 'Active',
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'students', newStudent.id), newStudent);
      } catch (err) {
        console.warn('Firestore write failed, saving to local store:', err.message);
      }
    }

    const localStudents = storageService.getItem(STORAGE_KEYS.STUDENTS) || [];
    localStudents.push(newStudent);
    storageService.setItem(STORAGE_KEYS.STUDENTS, localStudents);

    return { success: true, data: newStudent };
  },

  async update(id, studentData) {
    const validation = await this.validate(studentData, id);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const updatedStudent = {
      id,
      rollNumber: studentData.rollNumber.trim().toUpperCase(),
      name: studentData.name.trim(),
      email: studentData.email.trim().toLowerCase(),
      department: studentData.department.trim().toUpperCase(),
      semester: parseInt(studentData.semester, 10),
      section: studentData.section.trim().toUpperCase(),
      status: studentData.status || 'Active',
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'students', id), updatedStudent);
      } catch (err) {
        console.warn('Firestore update failed, saving locally:', err.message);
      }
    }

    const localStudents = storageService.getItem(STORAGE_KEYS.STUDENTS) || [];
    const index = localStudents.findIndex((s) => s.id === id);
    if (index !== -1) {
      localStudents[index] = { ...localStudents[index], ...updatedStudent };
      storageService.setItem(STORAGE_KEYS.STUDENTS, localStudents);
    }

    return { success: true, data: updatedStudent };
  },

  async toggleStatus(id) {
    const student = await this.getById(id);
    if (!student) {
      return { success: false, error: 'Student not found.' };
    }
    const newStatus = student.status === 'Active' ? 'Inactive' : 'Active';
    return await this.update(id, { ...student, status: newStatus });
  },

  async delete(id) {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'students', id));
      } catch (err) {
        console.warn('Firestore delete failed:', err.message);
      }
    }

    const localStudents = storageService.getItem(STORAGE_KEYS.STUDENTS) || [];
    const filtered = localStudents.filter((s) => s.id !== id);
    storageService.setItem(STORAGE_KEYS.STUDENTS, filtered);

    return { success: true };
  },
};
