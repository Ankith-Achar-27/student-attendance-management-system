import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../services/authService';

export const Sidebar = () => {
  const { user } = useAuth();
  const currentRole = user?.role;

  const adminNav = [
    { to: '/admin/dashboard', label: 'Admin Dashboard', icon: '📊' },
    { to: '/admin/students', label: 'Manage Students', icon: '🎓' },
    { to: '/admin/faculty', label: 'Manage Faculty', icon: '👨‍🏫' },
    { to: '/admin/subjects', label: 'Subjects & Allotment', icon: '📚' },
    { to: '/admin/reports', label: 'Institutional Reports', icon: '📑' },
  ];

  const facultyNav = [
    { to: '/faculty/dashboard', label: 'Faculty Dashboard', icon: '📊' },
    { to: '/faculty/mark', label: 'Mark Attendance', icon: '📝' },
    { to: '/faculty/edit', label: 'Edit Attendance', icon: '✏️' },
    { to: '/faculty/reports', label: 'Course Registers & Reports', icon: '📋' },
  ];

  const studentNav = [
    { to: '/student/dashboard', label: 'Attendance Summary', icon: '📊' },
    { to: '/student/subjects', label: 'Subject-wise Attendance', icon: '📖' },
    { to: '/student/log', label: 'Detailed Attendance Log', icon: '🗓️' },
  ];

  let currentNav = [];
  let sectionLabel = 'Portal Navigation';

  if (currentRole === ROLES.ADMIN) {
    currentNav = adminNav;
    sectionLabel = 'Academic Administration';
  } else if (currentRole === ROLES.FACULTY) {
    currentNav = facultyNav;
    sectionLabel = 'Faculty Operations';
  } else if (currentRole === ROLES.STUDENT) {
    currentNav = studentNav;
    sectionLabel = 'Student Self-Service';
  }

  return (
    <aside className="app-sidebar">
      <div className="sidebar-section-title">{sectionLabel}</div>
      <nav>
        <ul className="sidebar-nav">
          {currentNav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
          Academic ERP System
        </div>
        <div>Current Session: 2026–27</div>
        <div style={{ color: '#166534', fontSize: '11px', marginTop: '4px', fontWeight: 500 }}>
          ● Authenticated ({currentRole || 'Guest'})
        </div>
      </div>
    </aside>
  );
};
