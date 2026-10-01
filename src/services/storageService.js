/**
 * Storage Service - Local Persistence Layer Wrapper
 * Manages localStorage operations, initialization, and CSV export.
 */

import {
  INITIAL_STUDENTS,
  INITIAL_FACULTY,
  INITIAL_SUBJECTS,
  INITIAL_ATTENDANCE_SESSIONS,
} from '../data/seedData';

export const STORAGE_KEYS = {
  STUDENTS: 'sams_students',
  FACULTY: 'sams_faculty',
  SUBJECTS: 'sams_subjects',
  SESSIONS: 'sams_attendance_sessions',
};

export const storageService = {
  // Generic safe get
  getItem(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading from localStorage for key: ${key}`, error);
      return null;
    }
  },

  // Generic safe set
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error saving to localStorage for key: ${key}`, error);
      return false;
    }
  },

  // Initializes local storage only if items do not exist
  initialize() {
    if (!this.getItem(STORAGE_KEYS.STUDENTS)) {
      this.setItem(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    }
    if (!this.getItem(STORAGE_KEYS.FACULTY)) {
      this.setItem(STORAGE_KEYS.FACULTY, INITIAL_FACULTY);
    }
    if (!this.getItem(STORAGE_KEYS.SUBJECTS)) {
      this.setItem(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    }
    if (!this.getItem(STORAGE_KEYS.SESSIONS)) {
      this.setItem(STORAGE_KEYS.SESSIONS, INITIAL_ATTENDANCE_SESSIONS);
    }
  },

  // Resets storage to original mock data if explicitly needed
  reset() {
    this.setItem(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    this.setItem(STORAGE_KEYS.FACULTY, INITIAL_FACULTY);
    this.setItem(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    this.setItem(STORAGE_KEYS.SESSIONS, INITIAL_ATTENDANCE_SESSIONS);
  },

  // Universal clean CSV Export utility without external libraries
  exportToCSV(filename, headers, rows) {
    if (!rows || !rows.length) {
      return false;
    }

    const escapeField = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const headerLine = headers.map(escapeField).join(',');
    const dataLines = rows.map((row) => row.map(escapeField).join(','));
    const csvContent = [headerLine, ...dataLines].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename.replace(/\.csv$/, '')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  },
};
