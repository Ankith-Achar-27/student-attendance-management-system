/**
 * Local Authentication Service (Phase 3 Development Layer)
 * Handles realistic mock authentication, session storage, and user entity linking.
 * Will be replaced by Firebase Authentication in subsequent cloud phase.
 */

import { storageService } from './storageService.js';
import { facultyService } from './facultyService.js';
import { studentService } from './studentService.js';

const SESSION_KEY = 'sams_auth_session';

// Standard development credential accepted for all mock accounts
export const DEV_PASSWORD = 'password123';

export const ROLES = {
  ADMIN: 'ADMIN',
  FACULTY: 'FACULTY',
  STUDENT: 'STUDENT',
};

export const authService = {
  // Returns currently authenticated user session or null
  getCurrentUser() {
    return storageService.getItem(SESSION_KEY);
  },

  // Save authenticated session
  setSession(user) {
    storageService.setItem(SESSION_KEY, user);
  },

  // Clear authenticated session
  clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.error('Failed to clear auth session', e);
    }
  },

  // Authenticate user with local mock credentials
  login(email, password) {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanPassword = password?.trim();

    if (!cleanEmail) {
      return { success: false, error: 'Please enter your institutional email.' };
    }
    if (!cleanPassword) {
      return { success: false, error: 'Please enter your password.' };
    }

    // Check development password
    const isDevPassword = cleanPassword === DEV_PASSWORD || cleanPassword === 'college123';

    // 1. ADMIN Authentication
    if (
      (cleanEmail === 'admin@college.edu' || cleanEmail === 'admin@niet.edu') &&
      isDevPassword
    ) {
      const adminUser = {
        id: 'usr-admin-01',
        name: 'System Administrator',
        email: cleanEmail,
        role: ROLES.ADMIN,
        code: 'ADM-01',
        dept: 'Academic Affairs & Records',
        roleTitle: 'Institute Admin',
        initials: 'AD',
        entityId: null,
      };
      this.setSession(adminUser);
      return { success: true, user: adminUser };
    }

    // 2. FACULTY Authentication
    const allFaculty = facultyService.getAll();
    let matchedFaculty = null;

    if (cleanEmail === 'faculty@college.edu' && isDevPassword) {
      // Default faculty account links to Dr. Sarah Jenkins (fac-104)
      matchedFaculty = facultyService.getByEmpId('FAC-104') || allFaculty[0];
    } else {
      matchedFaculty = allFaculty.find(
        (f) => f.email.toLowerCase() === cleanEmail && f.status === 'Active'
      );
    }

    if (matchedFaculty && isDevPassword) {
      const facultyUser = {
        id: `usr-${matchedFaculty.id}`,
        name: matchedFaculty.name,
        email: matchedFaculty.email,
        role: ROLES.FACULTY,
        code: matchedFaculty.employeeId,
        dept: `${matchedFaculty.department} Department`,
        roleTitle: matchedFaculty.designation,
        initials: matchedFaculty.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2),
        entityId: matchedFaculty.id,
        entity: matchedFaculty,
      };
      this.setSession(facultyUser);
      return { success: true, user: facultyUser };
    }

    // 3. STUDENT Authentication
    const allStudents = studentService.getAll();
    let matchedStudent = null;

    if (cleanEmail === 'student@college.edu' && isDevPassword) {
      // Default student account links to Rahul Sharma (CS2024-042)
      matchedStudent = studentService.getByRoll('CS2024-042') || allStudents[0];
    } else {
      matchedStudent = allStudents.find(
        (s) => s.email.toLowerCase() === cleanEmail && s.status === 'Active'
      );
    }

    if (matchedStudent && isDevPassword) {
      const studentUser = {
        id: `usr-${matchedStudent.id}`,
        name: matchedStudent.name,
        email: matchedStudent.email,
        role: ROLES.STUDENT,
        code: matchedStudent.rollNumber,
        dept: `B.Tech ${matchedStudent.department} - Sem ${matchedStudent.semester} (${matchedStudent.section})`,
        roleTitle: 'Enrolled Student',
        initials: matchedStudent.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2),
        entityId: matchedStudent.id,
        entity: matchedStudent,
      };
      this.setSession(studentUser);
      return { success: true, user: studentUser };
    }

    // Invalid Credentials
    return {
      success: false,
      error: 'Invalid institutional email or password. Please verify credentials.',
    };
  },

  logout() {
    this.clearSession();
  },
};
