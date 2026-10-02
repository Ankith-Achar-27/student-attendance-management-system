import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../services/authService';
import { Button } from '../../components/common/UIComponents';

export const LoginPage = () => {
  const { user, isAuthenticated, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const redirectUser = React.useCallback(
    (role) => {
      // Check if there was an intended route before redirect
      const fromPath = location.state?.from?.pathname;
      if (fromPath && fromPath !== '/login') {
        if (role === ROLES.ADMIN && fromPath.startsWith('/admin')) {
          navigate(fromPath, { replace: true });
          return;
        }
        if (role === ROLES.FACULTY && fromPath.startsWith('/faculty')) {
          navigate(fromPath, { replace: true });
          return;
        }
        if (role === ROLES.STUDENT && fromPath.startsWith('/student')) {
          navigate(fromPath, { replace: true });
          return;
        }
      }

      if (role === ROLES.ADMIN) {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === ROLES.FACULTY) {
        navigate('/faculty/dashboard', { replace: true });
      } else if (role === ROLES.STUDENT) {
        navigate('/student/dashboard', { replace: true });
      }
    },
    [location.state, navigate]
  );

  // If already logged in, redirect to their role's dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      redirectUser(user.role);
    }
  }, [isAuthenticated, user, redirectUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your institutional email address.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    const result = await login(email, password);

    if (!result.success) {
      setErrorMessage(result.error);
    } else {
      redirectUser(result.user.role);
    }
  };

  return (
    <div className="login-page-wrapper">
      <header className="login-top-banner">
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
      </header>

      <main className="login-content-area">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-crest-container">
              <img
                src="/assets/mce-logo.png"
                alt="Malnad College of Engineering logo"
                className="login-crest-img"
              />
            </div>
            <h2>Academic Portal Login</h2>
            <p className="login-card-inst">Malnad College of Engineering</p>
            <p className="login-card-dept">Department of Computer Science and Engineering</p>
            <p className="login-card-app">Student Attendance Management System</p>
          </div>

          <div className="login-card-body">
            {errorMessage && (
              <div className="alert-box alert-danger" style={{ marginBottom: '16px' }}>
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email-input">
                  Institutional Email ID <span className="required">*</span>
                </label>
                <input
                  id="email-input"
                  type="email"
                  className="form-control"
                  style={{ width: '100%' }}
                  placeholder="e.g. yourname@mce-sams.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password-input">
                  Password <span className="required">*</span>
                </label>
                <input
                  id="password-input"
                  type="password"
                  className="form-control"
                  style={{ width: '100%' }}
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              <div style={{ marginTop: '20px' }}>
                <Button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', height: '38px', fontSize: '14px' }}
                >
                  {loading ? 'Verifying Credentials...' : 'Sign In to Portal'}
                </Button>
              </div>
            </form>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Demo Accounts (Click to autofill)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '5px 4px', textAlign: 'center' }}
                  onClick={() => {
                    setEmail('admin@mce-sams.local');
                    setPassword('password123');
                    setErrorMessage('');
                  }}
                >
                  👤 Admin
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '5px 4px', textAlign: 'center' }}
                  onClick={() => {
                    setEmail('faculty@mce-sams.local');
                    setPassword('password123');
                    setErrorMessage('');
                  }}
                >
                  👨‍🏫 Faculty
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '5px 4px', textAlign: 'center' }}
                  onClick={() => {
                    setEmail('student@mce-sams.local');
                    setPassword('password123');
                    setErrorMessage('');
                  }}
                >
                  🎓 Student
                </button>
              </div>
            </div>
          </div>

          <div className="login-footer-text">
            Malnad College of Engineering, Hassan &bull; Department of Computer Science and Engineering
          </div>
        </div>
      </main>
    </div>
  );
};
