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
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import {
  INITIAL_STUDENTS,
  INITIAL_FACULTY,
  INITIAL_SUBJECTS,
  INITIAL_ATTENDANCE_SESSIONS,
} from '../data/seedData';
import { ROLES } from '../services/authService';

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

      // 5. Seed Core Mock User Roles into /users collection
      const seedUsers = [
        {
          uid: 'usr-admin-01',
          name: 'System Administrator',
          email: 'admin@mce-sams.local',
          role: ROLES.ADMIN,
          linkedEntityId: null,
          department: 'Academic Affairs - MCE Hassan',
          status: 'Active',
        },
        {
          uid: 'usr-fac-104',
          name: 'Dr. Sarah Jenkins',
          email: 'faculty@mce-sams.local',
          role: ROLES.FACULTY,
          linkedEntityId: 'fac-104',
          department: 'Computer Science and Engineering',
          status: 'Active',
        },
        {
          uid: 'usr-stud-042',
          name: 'Rahul Sharma',
          email: 'student@mce-sams.local',
          role: ROLES.STUDENT,
          linkedEntityId: 'stud-042',
          department: 'Computer Science and Engineering',
          status: 'Active',
        },
      ];

      for (const u of seedUsers) {
        await setDoc(doc(db, 'users', u.uid), u);
      }

      console.log('Cloud Firestore successfully seeded with academic datasets.');
      return { success: true, message: 'Firestore collections successfully initialized.' };
    } catch (error) {
      console.error('Error during Firestore seeding:', error);
      return { success: false, error: error.message };
    }
  },
};
