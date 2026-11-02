/**
 * Deliberate Firestore Seeding Mechanism (Controlled Developer Utility)
 * Seeds initial academic data into Firestore only when collections are empty.
 * Never overwrites existing production data.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import {
  INITIAL_STUDENTS,
  INITIAL_FACULTY,
  INITIAL_SUBJECTS,
  INITIAL_ATTENDANCE_SESSIONS,
} from '../data/seedData';

export const seedFirestore = {
  // Checks if Firestore currently contains collections
  async isInitialized() {
    if (!isFirebaseConfigured || !db) return false;
    try {
      const snap = await getDocs(collection(db, 'students'));
      return !snap.empty;
    } catch (err) {
      console.warn('Could not check Firestore initialization status:', err.message);
      return false;
    }
  },

  // Deliberately populates Firestore with initial academic data if empty
  async seedIfEmpty() {
    if (!isFirebaseConfigured || !db) {
      return {
        success: false,
        message: 'Firebase is not yet configured with valid environment variables.',
      };
    }

    try {
      const alreadySeeded = await this.isInitialized();
      if (alreadySeeded) {
        return {
          success: false,
          alreadyInitialized: true,
          message: 'Firestore collections already contain data. Skipping seed to preserve records.',
        };
      }

      console.log('Seeding initial academic collections into Cloud Firestore...');

      // 1. Seed Students
      for (const student of INITIAL_STUDENTS) {
        await setDoc(doc(db, 'students', student.id), student);
      }

      // 2. Seed Faculty
      for (const faculty of INITIAL_FACULTY) {
        await setDoc(doc(db, 'faculty', faculty.id), faculty);
      }

      // 3. Seed Subjects
      for (const subject of INITIAL_SUBJECTS) {
        await setDoc(doc(db, 'subjects', subject.id), subject);
      }

      // 4. Seed Attendance Sessions
      for (const session of INITIAL_ATTENDANCE_SESSIONS) {
        await setDoc(doc(db, 'attendanceSessions', session.id), session);
      }

      console.log('Cloud Firestore successfully seeded with academic datasets.');
      return { success: true, message: 'Firestore collections successfully initialized.' };
    } catch (error) {
      console.error('Error during Firestore seeding:', error);
      return { success: false, error: error.message };
    }
  },
};
