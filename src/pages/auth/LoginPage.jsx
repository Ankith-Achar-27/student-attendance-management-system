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
          <div className="brand-crest">NI</div>
          <div className="brand-text">
            <h1>National Institute of Engineering & Technology</h1>
            <p>Student Attendance Management System &bull; Academic Portal</p>
          </div>
        </div>
      </header>

      <main className="login-content-area">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-crest-icon">NI</div>
            <h2>Academic Portal Login</h2>
            <p>Sign in to access your attendance, course roster, and records</p>
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
                  placeholder="e.g. yourname@college.edu"
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
          </div>

          <div className="login-footer-text">
            For academic portal support or account access inquiries, contact the Registrar Office.
          </div>
        </div>
      </main>
    </div>
  );
};
