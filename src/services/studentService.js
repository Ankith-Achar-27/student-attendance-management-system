
/**
 * Student Service
 * Provides asynchronous CRUD operations for the students collection
 * with local storage fallback when Firebase is not configured.
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

const normalizeStudent = (data) => ({
  rollNumber: data.rollNumber.trim().toUpperCase(),
  name: data.name.trim(),
  email: data.email.trim().toLowerCase(),
  department: data.department.trim().toUpperCase(),
  semester: parseInt(data.semester, 10),
  section: data.section.trim().toUpperCase(),
  status: data.status || 'Active',
});

const getErrorMessage = (error, fallbackMessage) => {
  console.error(fallbackMessage, error);

  if (error?.code === 'permission-denied' ||
    error?.code === 'firestore/permission-denied') {
    return 'Permission denied. Please check your account permissions.';
  }

  if (error?.code === 'unavailable' ||
    error?.code === 'firestore/unavailable') {
    return 'Firebase is temporarily unavailable. Please try again.';
  }

  return error?.message || fallbackMessage;
};

export const studentService = {
  /**
   * Retrieves all students from Firestore or local storage.
   */
  async getAll() {
    if (isFirebaseConfigured && db) {
      try {
        const querySnapshot = await getDocs(
          collection(db, 'students')
        );

        const list = querySnapshot.docs.map((studentDoc) => ({
          ...studentDoc.data(),
          id: studentDoc.id,
        }));

        // An empty Firestore collection is a valid result.
        storageService.setItem(STORAGE_KEYS.STUDENTS, list);

        return list;
      } catch (error) {
        console.warn(
          'Firestore fetch failed; using local fallback:',
          error.message
        );

        return storageService.getItem(STORAGE_KEYS.STUDENTS) || [];
      }
    }

    return storageService.getItem(STORAGE_KEYS.STUDENTS) || [];
  },

  /**
   * Resolves a canonical student record from an ID, email, roll number, or user object.
   */
  async resolveStudent(identifierOrUser) {
    if (!identifierOrUser) return null;

    let targetId = null;
    let targetUid = null;
    let targetEmail = null;
    let targetCode = null;
    let targetName = null;

    if (typeof identifierOrUser === 'object') {
      targetId = identifierOrUser.linkedEntityId || identifierOrUser.entityId || identifierOrUser.id || null;
      targetUid = identifierOrUser.uid || (identifierOrUser.id && identifierOrUser.id.length > 15 ? identifierOrUser.id : null) || null;
      targetEmail = identifierOrUser.email || identifierOrUser.entity?.email || null;
      targetCode = identifierOrUser.code || identifierOrUser.rollNumber || identifierOrUser.entity?.rollNumber || null;
      targetName = identifierOrUser.name || identifierOrUser.displayName || identifierOrUser.entity?.name || null;
    } else {
      const str = String(identifierOrUser).trim();
      targetId = str;
      if (str.includes('@')) {
        targetEmail = str;
      } else if (str.length > 20) {
        targetUid = str;
      } else {
        targetCode = str;
        targetName = str;
      }
    }

    // 1. Direct document lookup if targetId looks like a student document ID
    if (isFirebaseConfigured && db && targetId) {
      try {
        const studentDoc = await getDoc(
          doc(db, 'students', targetId)
        );

        if (studentDoc.exists()) {
          return {
            ...studentDoc.data(),
            id: studentDoc.id,
          };
        }
      } catch (error) {
        console.warn(
          'Firestore direct student lookup failed:',
          error.message
        );
      }
    }

    // 2. If targetUid is provided, check users/{uid} for linkedEntityId or user profile
    if (isFirebaseConfigured && db && targetUid) {
      try {
        const userDoc = await getDoc(
          doc(db, 'users', targetUid)
        );
        if (userDoc.exists()) {
          const uData = userDoc.data();
          if (uData.linkedEntityId && uData.linkedEntityId !== targetUid) {
            const linkedDoc = await getDoc(
              doc(db, 'students', uData.linkedEntityId)
            );
            if (linkedDoc.exists()) {
              return {
                ...linkedDoc.data(),
                id: linkedDoc.id,
              };
            }
          }
          if (uData.email) targetEmail = uData.email;
          if (uData.name) targetName = uData.name;
          if (uData.code || uData.rollNumber) targetCode = uData.code || uData.rollNumber;
        }
      } catch (error) {
        console.warn(
          'Firestore user profile lookup failed:',
          error.message
        );
      }
    }

    // 3. Fallback search across all students in Firestore / storage
    const allStudents = await this.getAll();
    const cleanId = targetId ? targetId.toLowerCase() : null;
    const cleanEmail = targetEmail ? targetEmail.trim().toLowerCase() : null;
    const cleanCode = targetCode ? targetCode.trim().toLowerCase() : null;
    const cleanName = targetName ? targetName.trim().toLowerCase() : null;

    return (
      allStudents.find((student) => {
        const sId = student.id?.toLowerCase();
        const sEmail = student.email?.trim().toLowerCase();
        const sRoll = student.rollNumber?.trim().toLowerCase();
        const sName = student.name?.trim().toLowerCase();

        if (cleanId && sId === cleanId) return true;
        if (cleanEmail && sEmail === cleanEmail) return true;
        if (cleanCode && sRoll === cleanCode) return true;
        if (cleanName && sName === cleanName) return true;
        if (cleanName && cleanName.length >= 3 && (sName?.includes(cleanName) || cleanName.includes(sName))) {
          return true;
        }
        return false;
      }) || null
    );
  },

  /**
   * Retrieves a student by document ID, with fallback to email, roll number, or identifier match.
   */
  async getById(id) {
    return this.resolveStudent(id);
  },

  /**
   * Retrieves a student by email address.
   */
  async getByEmail(email) {
    if (!email) {
      return null;
    }

    const students = await this.getAll();
    const cleanEmail = email.trim().toLowerCase();

    return (
      students.find(
        (student) => student.email?.toLowerCase() === cleanEmail
      ) || null
    );
  },

  /**
   * Retrieves a student by roll number.
   */
  async getByRoll(rollNumber) {
    if (!rollNumber) {
      return null;
    }

    const students = await this.getAll();
    const normalizedRoll = rollNumber.trim().toLowerCase();

    return (
      students.find(
        (student) =>
          student.rollNumber?.toLowerCase() === normalizedRoll
      ) || null
    );
  },

  /**
   * Validates student data and checks for duplicate roll numbers/emails.
   */
  async validate(data, currentId = null) {
    if (!data.rollNumber?.trim()) {
      return {
        valid: false,
        error: 'Roll Number (USN) is required.',
      };
    }

    if (!data.name?.trim()) {
      return {
        valid: false,
        error: 'Student full name is required.',
      };
    }

    if (!data.email?.trim()) {
      return {
        valid: false,
        error: 'Institutional email is required.',
      };
    }

    if (!isValidEmail(data.email.trim())) {
      return {
        valid: false,
        error: 'Please enter a valid email address.',
      };
    }

    if (!data.department?.trim()) {
      return {
        valid: false,
        error: 'Department is required.',
      };
    }

    const semester = Number(data.semester);

    if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
      return {
        valid: false,
        error: 'Semester must be between 1 and 8.',
      };
    }

    if (!data.section?.trim()) {
      return {
        valid: false,
        error: 'Section is required.',
      };
    }

    const students = await this.getAll();
    const cleanRoll = data.rollNumber.trim().toLowerCase();
    const cleanEmail = data.email.trim().toLowerCase();

    const duplicateRoll = students.find(
      (student) =>
        student.id !== currentId &&
        student.rollNumber?.toLowerCase() === cleanRoll
    );

    if (duplicateRoll) {
      return {
        valid: false,
        error: `Roll Number '${data.rollNumber.trim()}' is already registered.`,
      };
    }

    const duplicateEmail = students.find(
      (student) =>
        student.id !== currentId &&
        student.email?.toLowerCase() === cleanEmail
    );

    if (duplicateEmail) {
      return {
        valid: false,
        error: `Email '${data.email.trim()}' is already in use by another student.`,
      };
    }

    return { valid: true };
  },

  /**
   * Adds a student.
   *
   * With Firebase configured, Firestore must succeed before success
   * is returned. Local storage is used as the primary store only
   * when Firebase is not configured.
   */
  async add(studentData) {
    const validation = await this.validate(studentData);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const newStudent = {
      id: `stud - ${Date.now()} `,
      ...normalizeStudent(studentData),
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        const { id, ...studentDocument } = newStudent;

        await setDoc(
          doc(db, 'students', id),
          studentDocument
        );

        const localStudents =
          storageService.getItem(STORAGE_KEYS.STUDENTS) || [];

        storageService.setItem(
          STORAGE_KEYS.STUDENTS,
          [
            ...localStudents.filter((student) => student.id !== id),
            newStudent,
          ]
        );

        return {
          success: true,
          data: newStudent,
        };
      } catch (error) {
        return {
          success: false,
          error: getErrorMessage(
            error,
            'Failed to save the student to Firebase.'
          ),
        };
      }
    }

    const localStudents =
      storageService.getItem(STORAGE_KEYS.STUDENTS) || [];

    localStudents.push(newStudent);
    storageService.setItem(STORAGE_KEYS.STUDENTS, localStudents);

    return {
      success: true,
      data: newStudent,
    };
  },

  /**
   * Updates an existing student.
   */
  async update(id, studentData) {
    const validation = await this.validate(studentData, id);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const updatedStudent = {
      ...normalizeStudent(studentData),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(
          doc(db, 'students', id),
          updatedStudent
        );

        const localStudents =
          storageService.getItem(STORAGE_KEYS.STUDENTS) || [];

        const updatedLocalStudents = localStudents.map((student) =>
          student.id === id
            ? { ...student, ...updatedStudent }
            : student
        );

        storageService.setItem(
          STORAGE_KEYS.STUDENTS,
          updatedLocalStudents
        );

        return {
          success: true,
          data: { id, ...updatedStudent },
        };
      } catch (error) {
        return {
          success: false,
          error: getErrorMessage(
            error,
            'Failed to update the student in Firebase.'
          ),
        };
      }
    }

    const localStudents =
      storageService.getItem(STORAGE_KEYS.STUDENTS) || [];

    const index = localStudents.findIndex(
      (student) => student.id === id
    );

    if (index === -1) {
      return {
        success: false,
        error: 'Student not found.',
      };
    }

    localStudents[index] = {
      ...localStudents[index],
      ...updatedStudent,
    };

    storageService.setItem(STORAGE_KEYS.STUDENTS, localStudents);

    return {
      success: true,
      data: localStudents[index],
    };
  },

  /**
   * Toggles a student's active status.
   */
  async toggleStatus(id) {
    const student = await this.getById(id);

    if (!student) {
      return {
        success: false,
        error: 'Student not found.',
      };
    }

    const newStatus =
      student.status === 'Active' ? 'Inactive' : 'Active';

    return this.update(id, {
      ...student,
      status: newStatus,
    });
  },

  /**
   * Deletes a student record.
   */
  async delete(id) {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'students', id));

        const localStudents =
          storageService.getItem(STORAGE_KEYS.STUDENTS) || [];

        storageService.setItem(
          STORAGE_KEYS.STUDENTS,
          localStudents.filter((student) => student.id !== id)
        );

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: getErrorMessage(
            error,
            'Failed to delete the student from Firebase.'
          ),
        };
      }
    }

    const localStudents =
      storageService.getItem(STORAGE_KEYS.STUDENTS) || [];

    storageService.setItem(
      STORAGE_KEYS.STUDENTS,
      localStudents.filter((student) => student.id !== id)
    );

    return { success: true };
  },
};
