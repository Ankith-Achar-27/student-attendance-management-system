
/**
 * Authentication Service
 * Manages Firebase email/password authentication, Firestore user profiles,
 * and local fallback for development.
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

const VALID_ROLES = Object.values(ROLES);

const isValidRole = (role) => VALID_ROLES.includes(role);

const resolveStudentRecord = async (firebaseUser, profile) => {
  if (profile?.role !== ROLES.STUDENT) return null;
  try {
    return await studentService.resolveStudent({
      ...profile,
      uid: firebaseUser?.uid,
      id: profile.linkedEntityId || profile.entityId || firebaseUser?.uid,
      email: profile.email || firebaseUser?.email,
      name: profile.name || firebaseUser?.displayName,
      code: profile.code || profile.rollNumber,
    });
  } catch (err) {
    console.warn('Could not resolve student record:', err.message);
  }
  return null;
};

const buildAppUser = (firebaseUser, profile, studentRecord = null) => {
  const linkedId =
    studentRecord?.id ||
    profile.linkedEntityId ||
    profile.entityId ||
    null;

  const dept = studentRecord
    ? `B.E. ${studentRecord.department} - Sem ${studentRecord.semester} (${studentRecord.section || 'A'})`
    : (profile.department || 'Academic Department');

  const code = studentRecord?.rollNumber || profile.code || 'INST-01';
  const name = studentRecord?.name || profile.name || firebaseUser.displayName || 'Authorized User';

  return {
    uid: firebaseUser.uid,
    id: firebaseUser.uid,
    email: firebaseUser.email,
    name,
    role: profile.role,
    code,
    dept,
    roleTitle: profile.roleTitle || (profile.role === ROLES.STUDENT ? 'Enrolled Student' : 'Institutional Member'),
    initials: name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2),
    linkedEntityId: linkedId,
    entityId: linkedId,
    entity: studentRecord
      ? { ...profile, ...studentRecord, id: studentRecord.id }
      : profile,
  };
};

/**
 * Translates Firebase Auth errors into user-friendly messages.
 */
export const getFriendlyErrorMessage = (error) => {
  if (!error) {
    return 'An error occurred during authentication.';
  }

  const code = error.code || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid institutional email or password. Please verify your credentials.';

    case 'auth/invalid-email':
      return 'The email format entered is invalid. Please enter a valid institutional email.';

    case 'auth/user-disabled':
      return 'This institutional account has been deactivated. Please contact the administrator.';

    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Access is temporarily locked. Please try again later.';

    case 'auth/network-request-failed':
      return 'Network connection error. Please verify your internet connection.';

    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'Access denied. You do not have permission to access this institutional record.';

    default:
      return error.message ||
        'Authentication failed. Please verify your details and try again.';
  }
};

export const authService = {
  /**
   * Returns the currently stored local session.
   */
  getCurrentUser() {
    return storageService.getItem(SESSION_KEY);
  },

  /**
   * Stores the authenticated application user.
   */
  setSession(user) {
    storageService.setItem(SESSION_KEY, user);
  },

  /**
   * Clears the locally stored session.
   */
  clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear auth session:', error);
    }
  },

  /**
   * Listens for Firebase authentication state changes.
   */
  subscribeToAuthState(callback) {
    if (isFirebaseConfigured && auth) {
      return onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          this.clearSession();
          callback(null);
          return;
        }

        try {
          if (!db) {
            throw new Error('Firestore is not configured.');
          }

          const userDoc = await getDoc(
            doc(db, 'users', firebaseUser.uid)
          );

          // Reject Firebase accounts without a Firestore profile.
          if (!userDoc.exists()) {
            await firebaseSignOut(auth);
            this.clearSession();
            callback(null);
            return;
          }

          const userProfile = userDoc.data();

          // Reject missing or invalid application roles.
          if (!isValidRole(userProfile.role)) {
            await firebaseSignOut(auth);
            this.clearSession();
            callback(null);
            return;
          }

          const studentRecord = await resolveStudentRecord(firebaseUser, userProfile);
          const appUser = buildAppUser(firebaseUser, userProfile, studentRecord);

          this.setSession(appUser);
          callback(appUser);
        } catch (error) {
          console.error('Error validating Firebase user:', error);

          try {
            await firebaseSignOut(auth);
          } catch (signOutError) {
            console.error('Firebase sign-out failed:', signOutError);
          }

          this.clearSession();
          callback(null);
        }
      });
    }

    // Local development fallback when Firebase is not configured.
    callback(this.getCurrentUser());

    return () => { };
  },

  /**
   * Authenticates through Firebase or the local development fallback.
   */
  async login(email, password) {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanPassword = password?.trim();

    if (!cleanEmail) {
      return {
        success: false,
        error: 'Please enter your institutional email.',
      };
    }

    if (!cleanPassword) {
      return {
        success: false,
        error: 'Please enter your password.',
      };
    }

    // 1. Firebase Authentication.
    if (isFirebaseConfigured && auth) {
      try {
        if (!db) {
          return {
            success: false,
            error: 'The authentication service is not configured correctly.',
          };
        }

        const userCredential = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          cleanPassword
        );

        const firebaseUser = userCredential.user;

        const userDoc = await getDoc(
          doc(db, 'users', firebaseUser.uid)
        );

        // A Firebase account must have a Firestore user profile.
        if (!userDoc.exists()) {
          await firebaseSignOut(auth);
          this.clearSession();

          return {
            success: false,
            error: 'No institutional profile exists for this account. Please contact the administrator.',
          };
        }

        const profile = userDoc.data();

        // Never assign a default role to an unverified profile.
        if (!isValidRole(profile.role)) {
          await firebaseSignOut(auth);
          this.clearSession();

          return {
            success: false,
            error: 'This account does not have a valid institutional role. Please contact the administrator.',
          };
        }

        const studentRecord = await resolveStudentRecord(firebaseUser, profile);
        const appUser = buildAppUser(firebaseUser, profile, studentRecord);

        this.setSession(appUser);

        return {
          success: true,
          user: appUser,
        };
      } catch (firebaseError) {
        return {
          success: false,
          error: getFriendlyErrorMessage(firebaseError),
        };
      }
    }

    // 2. Development fallback when Firebase is not configured.
    const isDevPassword =
      cleanPassword === DEV_PASSWORD ||
      cleanPassword === 'college123' ||
      cleanPassword === 'Admin@123' ||
      cleanPassword === 'Faculty@123' ||
      cleanPassword === 'Student@123' ||
      cleanPassword.toLowerCase() === 'admin123' ||
      cleanPassword.toLowerCase() === 'faculty123' ||
      cleanPassword.toLowerCase() === 'student123';

    if (
      cleanEmail === 'admin@mce-sams.local' &&
      isDevPassword
    ) {
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

      return {
        success: true,
        user: adminUser,
      };
    }

    const allFaculty = await facultyService.getAll();
    let matchedFaculty = null;

    if (
      cleanEmail === 'faculty@mce-sams.local' &&
      isDevPassword
    ) {
      matchedFaculty =
        (await facultyService.getByEmpId('FAC-104')) ||
        allFaculty[0];
    } else {
      matchedFaculty = allFaculty.find(
        (faculty) =>
          faculty.email?.toLowerCase() === cleanEmail &&
          faculty.status === 'Active'
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
          .map((name) => name[0])
          .join('')
          .slice(0, 2),
        linkedEntityId: matchedFaculty.id,
        entityId: matchedFaculty.id,
        entity: matchedFaculty,
      };

      this.setSession(facultyUser);

      return {
        success: true,
        user: facultyUser,
      };
    }

    const allStudents = await studentService.getAll();
    let matchedStudent = null;

    if (
      cleanEmail === 'student@mce-sams.local' &&
      isDevPassword
    ) {
      matchedStudent =
        (await studentService.getByRoll('CS2024-042')) ||
        allStudents[0];
    } else {
      matchedStudent = allStudents.find(
        (student) =>
          student.email?.toLowerCase() === cleanEmail &&
          student.status === 'Active'
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
          .map((name) => name[0])
          .join('')
          .slice(0, 2),
        linkedEntityId: matchedStudent.id,
        entityId: matchedStudent.id,
        entity: matchedStudent,
      };

      this.setSession(studentUser);

      return {
        success: true,
        user: studentUser,
      };
    }

    return {
      success: false,
      error: 'Invalid institutional email or password. Please verify your credentials.',
    };
  },

  /**
   * Signs out the user.
   */
  async logout() {
    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (error) {
        console.error('Firebase sign-out error:', error);
      }
    }

    this.clearSession();
  },
};