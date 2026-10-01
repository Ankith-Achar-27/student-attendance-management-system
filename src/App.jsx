import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROLES } from './services/authService';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManageStudents } from './pages/admin/ManageStudents';
import { ManageFaculty } from './pages/admin/ManageFaculty';
import { ManageSubjects } from './pages/admin/ManageSubjects';
import { AdminReports } from './pages/admin/AdminReports';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { MarkAttendance } from './pages/faculty/MarkAttendance';
import { EditAttendance } from './pages/faculty/EditAttendance';
import { FacultyReports } from './pages/faculty/FacultyReports';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { SubjectAttendance } from './pages/student/SubjectAttendance';
import { AttendanceLog } from './pages/student/AttendanceLog';

import './App.css';

// Directs authenticated user to their role's dashboard or unauthenticated to /login
const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === ROLES.ADMIN) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (user.role === ROLES.FACULTY) {
    return <Navigate to="/faculty/dashboard" replace />;
  }
  if (user.role === ROLES.STUDENT) {
    return <Navigate to="/student/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Application Layout */}
          <Route element={<AppLayout />}>
            {/* 1. ADMIN ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
              <Route path="admin">
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="students" element={<ManageStudents />} />
                <Route path="faculty" element={<ManageFaculty />} />
                <Route path="subjects" element={<ManageSubjects />} />
                <Route path="reports" element={<AdminReports />} />
              </Route>
            </Route>

            {/* 2. FACULTY ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={[ROLES.FACULTY]} />}>
              <Route path="faculty">
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<FacultyDashboard />} />
                <Route path="mark" element={<MarkAttendance />} />
                <Route path="edit" element={<EditAttendance />} />
                <Route path="reports" element={<FacultyReports />} />
              </Route>
            </Route>

            {/* 3. STUDENT ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]} />}>
              <Route path="student">
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="subjects" element={<SubjectAttendance />} />
                <Route path="log" element={<AttendanceLog />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
