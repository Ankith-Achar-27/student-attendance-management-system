/**
 * Faculty Service (Phase 4 - Cloud Firestore Backed)
 * Provides asynchronous CRUD operations interfacing with the 'faculty' Firestore collection.
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

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const facultyService = {
  async getAll() {
    if (isFirebaseConfigured && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'faculty'));
        const list = [];
        querySnapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        if (list.length > 0) {
          storageService.setItem(STORAGE_KEYS.FACULTY, list);
          return list;
        }
      } catch (err) {
        console.warn('Firestore faculty fetch fallback:', err.message);
      }
    }
    return storageService.getItem(STORAGE_KEYS.FACULTY) || [];
  },

  async getById(id) {
    if (isFirebaseConfigured && db && id) {
      try {
        const docSnap = await getDoc(doc(db, 'faculty', id));
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        }
      } catch (err) {
        console.warn('Firestore faculty getById fallback:', err.message);
      }
    }
    const list = await this.getAll();
    return list.find((f) => f.id === id) || null;
  },

  async getByEmpId(employeeId) {
    if (!employeeId) return null;
    const list = await this.getAll();
    return (
      list.find(
        (f) => f.employeeId.toLowerCase() === employeeId.trim().toLowerCase()
      ) || null
    );
  },

  async validate(data, currentId = null) {
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

    const list = await this.getAll();
    const cleanEmpId = data.employeeId.trim().toLowerCase();
    const cleanEmail = data.email.trim().toLowerCase();

    const duplicateEmpId = list.find(
      (f) => f.id !== currentId && f.employeeId.toLowerCase() === cleanEmpId
    );
    if (duplicateEmpId) {
      return { valid: false, error: `Employee ID '${data.employeeId.trim()}' is already in use.` };
    }

    const duplicateEmail = list.find(
      (f) => f.id !== currentId && f.email.toLowerCase() === cleanEmail
    );
    if (duplicateEmail) {
      return { valid: false, error: `Email '${data.email.trim()}' is already in use.` };
    }

    return { valid: true };
  },

  async add(facultyData) {
    const validation = await this.validate(facultyData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const newFaculty = {
      id: `fac-${Date.now()}`,
      employeeId: facultyData.employeeId.trim().toUpperCase(),
      name: facultyData.name.trim(),
      email: facultyData.email.trim().toLowerCase(),
      department: facultyData.department.trim().toUpperCase(),
      designation: facultyData.designation?.trim() || 'Assistant Professor',
      status: facultyData.status || 'Active',
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'faculty', newFaculty.id), newFaculty);
      } catch (err) {
        console.warn('Firestore faculty write failed:', err.message);
      }
    }

    const localList = storageService.getItem(STORAGE_KEYS.FACULTY) || [];
    localList.push(newFaculty);
    storageService.setItem(STORAGE_KEYS.FACULTY, localList);

    return { success: true, data: newFaculty };
  },

  async update(id, facultyData) {
    const validation = await this.validate(facultyData, id);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const updated = {
      id,
      employeeId: facultyData.employeeId.trim().toUpperCase(),
      name: facultyData.name.trim(),
      email: facultyData.email.trim().toLowerCase(),
      department: facultyData.department.trim().toUpperCase(),
      designation: facultyData.designation?.trim() || 'Assistant Professor',
      status: facultyData.status || 'Active',
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'faculty', id), updated);
      } catch (err) {
        console.warn('Firestore faculty update failed:', err.message);
      }
    }

    const localList = storageService.getItem(STORAGE_KEYS.FACULTY) || [];
    const index = localList.findIndex((f) => f.id === id);
    if (index !== -1) {
      localList[index] = { ...localList[index], ...updated };
      storageService.setItem(STORAGE_KEYS.FACULTY, localList);
    }

    return { success: true, data: updated };
  },

  async toggleStatus(id) {
    const faculty = await this.getById(id);
    if (!faculty) {
      return { success: false, error: 'Faculty member not found.' };
    }
    const newStatus = faculty.status === 'Active' ? 'Inactive' : 'Active';
    return await this.update(id, { ...faculty, status: newStatus });
  },

  async delete(id) {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'faculty', id));
      } catch (err) {
        console.warn('Firestore faculty delete failed:', err.message);
      }
    }

    const localList = storageService.getItem(STORAGE_KEYS.FACULTY) || [];
    const filtered = localList.filter((f) => f.id !== id);
    storageService.setItem(STORAGE_KEYS.FACULTY, filtered);

    return { success: true };
  },
};
