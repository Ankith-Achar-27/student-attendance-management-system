/**
 * Authentication Service (Phase 4 - Firebase Authentication & Cloud Firestore Integration)
 * Manages Firebase email/password authentication, Firestore user profile retrieval,
 * and graceful fallback for local development.
 */

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/config';
import { storageService } from './storageService';
import { facultyService } from './facultyService';
import { studentService } from './studentService';

const SESSION_KEY = 'sams_auth_session';

export const DEV_PASSWORD = 'password123';

export const ROLES = {
  ADMIN: 'ADMIN',
  FACULTY: 'FACULTY',
  STUDENT: 'STUDENT',
};

// Translates Firebase Auth error codes into clean institutional messages
export const getFriendlyErrorMessage = (error) => {
  if (!error) return 'An error occurred during authentication.';
  const code = error.code || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid institutional email or password. Please verify your credentials.';
    case 'auth/invalid-email':
      return 'The email format entered is invalid. Please enter your valid institutional email.';
    case 'auth/user-disabled':
      return 'This institutional account has been deactivated. Please contact the administrator.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Access temporarily locked for security. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please verify your internet connection.';
    case 'permission-denied':
      return 'Access denied. You do not have permissions to access this institutional record.';
    default:
      return error.message || 'Authentication failed. Please verify your details and try again.';
  }
};

export const authService = {
  // Returns currently stored local session
  getCurrentUser() {
    return storageService.getItem(SESSION_KEY);
  },

  setSession(user) {
    storageService.setItem(SESSION_KEY, user);
  },

  clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.error('Failed to clear auth session', e);
    }
  },

  // Listen to Firebase authentication state changes
  subscribeToAuthState(callback) {
    if (isFirebaseConfigured && auth) {
      return onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // Retrieve role profile from Firestore /users/{uid}
            let userProfile = null;
            if (db) {
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              if (userDoc.exists()) {
                userProfile = userDoc.data();
              }
            }

            const appUser = {
              uid: firebaseUser.uid,
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: userProfile?.name || firebaseUser.displayName || 'Authorized User',
              role: userProfile?.role || ROLES.STUDENT,
              code: userProfile?.code || 'INST-01',
              dept: userProfile?.department || 'General',
              roleTitle: userProfile?.roleTitle || 'Institutional User',
              initials: (userProfile?.name || 'AU')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2),
              linkedEntityId: userProfile?.linkedEntityId || null,
              entity: userProfile || null,
            };

            this.setSession(appUser);
            callback(appUser);
          } catch (err) {
            console.error('Error fetching user profile from Firestore:', err);
            callback(this.getCurrentUser());
          }
        } else {
          this.clearSession();
          callback(null);
        }
      });
    }

    // Fallback observer when Firebase environment variables are not yet configured
    callback(this.getCurrentUser());
    return () => {};
  },

  // Authenticate user via Firebase Auth or local fallback
  async login(email, password) {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanPassword = password?.trim();

    if (!cleanEmail) {
      return { success: false, error: 'Please enter your institutional email.' };
    }
    if (!cleanPassword) {
      return { success: false, error: 'Please enter your password.' };
    }

    // 1. Live Firebase Authentication Mode
    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        const fbUser = userCredential.user;

        // Retrieve role & entity mapping from Firestore /users/{uid}
        let profile = null;
        if (db) {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            profile = userDoc.data();
          }
        }

        const appUser = {
          uid: fbUser.uid,
          id: fbUser.uid,
          email: fbUser.email,
          name: profile?.name || fbUser.displayName || 'Authorized User',
          role: profile?.role || ROLES.STUDENT,
          code: profile?.code || 'INST-01',
          dept: profile?.department || 'Academic Department',
          roleTitle: profile?.roleTitle || 'Institutional Member',
          initials: (profile?.name || 'AU')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2),
          linkedEntityId: profile?.linkedEntityId || null,
          entity: profile || null,
        };

        this.setSession(appUser);
        return { success: true, user: appUser };
      } catch (fbError) {
        return { success: false, error: getFriendlyErrorMessage(fbError) };
      }
    }

    // 2. Development Mock Accounts Fallback (when .env variables are pending setup)
    const isDevPassword =
      cleanPassword === DEV_PASSWORD ||
      cleanPassword === 'college123' ||
      cleanPassword === 'Admin@123' ||
      cleanPassword === 'Faculty@123' ||
      cleanPassword === 'Student@123' ||
      cleanPassword.toLowerCase() === 'admin123' ||
      cleanPassword.toLowerCase() === 'faculty123' ||
      cleanPassword.toLowerCase() === 'student123';

    if (cleanEmail === 'admin@mce-sams.local' && isDevPassword) {
      const adminUser = {
        uid: 'usr-admin-01',
        id: 'usr-admin-01',
        name: 'System Administrator',
        email: cleanEmail,
        role: ROLES.ADMIN,
        code: 'ADM-01',
        dept: 'Academic Affairs - MCE Hassan',
        roleTitle: 'Institute Admin',
        initials: 'AD',
        linkedEntityId: null,
      };
      this.setSession(adminUser);
      return { success: true, user: adminUser };
    }

    const allFaculty = await facultyService.getAll();
    let matchedFaculty = null;
    if (cleanEmail === 'faculty@mce-sams.local' && isDevPassword) {
      matchedFaculty = (await facultyService.getByEmpId('FAC-104')) || allFaculty[0];
    } else {
      matchedFaculty = allFaculty.find(
        (f) => f.email.toLowerCase() === cleanEmail && f.status === 'Active'
      );
    }

    if (matchedFaculty && isDevPassword) {
      const deptDisplay =
        matchedFaculty.department === 'CSE'
          ? 'Computer Science & Engineering'
          : `${matchedFaculty.department} Department`;

      const facultyUser = {
        uid: `usr-${matchedFaculty.id}`,
        id: `usr-${matchedFaculty.id}`,
        name: matchedFaculty.name,
        email: matchedFaculty.email,
        role: ROLES.FACULTY,
        code: matchedFaculty.employeeId,
        dept: deptDisplay,
        roleTitle: matchedFaculty.designation,
        initials: matchedFaculty.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2),
        linkedEntityId: matchedFaculty.id,
        entity: matchedFaculty,
      };
      this.setSession(facultyUser);
      return { success: true, user: facultyUser };
    }

    const allStudents = await studentService.getAll();
    let matchedStudent = null;
    if (cleanEmail === 'student@mce-sams.local' && isDevPassword) {
      matchedStudent = (await studentService.getByRoll('CS2024-042')) || allStudents[0];
    } else {
      matchedStudent = allStudents.find(
        (s) => s.email.toLowerCase() === cleanEmail && s.status === 'Active'
      );
    }

    if (matchedStudent && isDevPassword) {
      const studentUser = {
        uid: `usr-${matchedStudent.id}`,
        id: `usr-${matchedStudent.id}`,
        name: matchedStudent.name,
        email: matchedStudent.email,
        role: ROLES.STUDENT,
        code: matchedStudent.rollNumber,
        dept: `B.E. ${matchedStudent.department} - Sem ${matchedStudent.semester} (${matchedStudent.section})`,
        roleTitle: 'Enrolled Student',
        initials: matchedStudent.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2),
        linkedEntityId: matchedStudent.id,
        entity: matchedStudent,
      };
      this.setSession(studentUser);
      return { success: true, user: studentUser };
    }

    return {
      success: false,
      error: 'Invalid institutional email or password. Please verify credentials.',
    };
  },

  async logout() {
    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.error('Firebase signout error:', err);
      }
    }
    this.clearSession();
  },
};
