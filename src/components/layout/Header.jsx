import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../services/authService';
import { Button, Badge } from '../common/UIComponents';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getRoleBadgeVariant = (role) => {
    if (role === ROLES.ADMIN) return 'neutral';
    if (role === ROLES.FACULTY) return 'present';
    if (role === ROLES.STUDENT) return 'warning';
    return 'neutral';
  };

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="header-crest-container">
          <img
            src="/assets/mce-logo.png"
            alt="Malnad College of Engineering logo"
            className="header-crest-img"
          />
        </div>
        <div className="brand-text-container">
          <div className="brand-institution">
            <h1 className="inst-title">Malnad College of Engineering</h1>
            <div className="inst-meta">
              <span className="inst-autonomous">An Autonomous Institution</span>
              <span className="meta-separator" aria-hidden="true">&bull;</span>
              <span className="inst-loc">HASSAN - 573202, KARNATAKA</span>
            </div>
          </div>
          <div className="brand-divider" aria-hidden="true" />
          <div className="brand-application">
            <div className="app-title">Student Attendance Management System</div>
            <div className="dept-title">Department of Computer Science and Engineering</div>
          </div>
        </div>
      </div>

      <div className="header-actions">
        {user ? (
          <>
            <div className="user-badge" style={{ borderLeft: 'none', paddingLeft: 0 }}>
              <div className="user-avatar">{user.initials || 'U'}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', lineHeight: 1.2 }}>
                    {user.name}
                  </span>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role}
                  </Badge>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.2, marginTop: '2px' }}>
                  {user.dept} &bull; {user.code}
                </div>
              </div>
            </div>

            <button
              id="logout-button"
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleLogout}
              style={{
                backgroundColor: '#1e293b',
                color: '#e2e8f0',
                borderColor: '#334155',
                fontSize: '12px',
                padding: '5px 12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Sign Out 🚪
            </button>
          </>
        ) : (
          <Button size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
};
