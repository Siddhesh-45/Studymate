import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';

export default function Login() {
  // --- State ---
  const [role, setRole]         = useState('student'); // 'student' or 'admin'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate();

  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic front-end validation
    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      // POST to /api/auth/login with email, password, and role
      const res = await API.post('/auth/login', { email, password, role });

      // Save token and user info to localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Redirect based on role
      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      // Show the error message from the backend
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  return (
    <div style={styles.page}>
      {/* Background decoration */}
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />

      <div style={styles.card}>
        {/* Logo / Title */}
        <div style={styles.header}>
          <div style={styles.logo}>📚</div>
          <h1 style={styles.title}>StudyMate</h1>
          <p style={styles.subtitle}>Your smart study companion</p>
        </div>

        {/* Role Toggle — Student / Admin */}
        <div style={styles.roleToggle}>
          <button
            type="button"
            style={role === 'student' ? styles.roleActive : styles.roleInactive}
            onClick={() => { setRole('student'); setError(''); }}
          >
            Student
          </button>
          <button
            type="button"
            style={role === 'admin' ? styles.roleActive : styles.roleInactive}
            onClick={() => { setRole('admin'); setError(''); }}
          >
            Admin
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Error box */}
          {error && (
            <div style={styles.errorBox}>
              ⚠️ {error}
            </div>
          )}

          {/* Email */}
          <div style={styles.field}>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={styles.input}
              autoComplete="email"
              autoFocus
            />
          </div>

          {/* Password */}
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={styles.input}
              autoComplete="current-password"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            style={loading ? styles.btnDisabled : styles.btn}
            disabled={loading}
          >
            {loading ? 'Signing in...' : `Sign in as ${role === 'admin' ? 'Admin' : 'Student'}`}
          </button>
        </form>

        {/* Link to Register — only for students */}
        {role === 'student' && (
          <p style={styles.registerText}>
            Don't have an account?{' '}
            <Link to="/register" style={styles.link}>
              Create one free
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ACCENT = '#6366f1';   // indigo
const ACCENT2 = '#8b5cf6';  // purple

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${ACCENT}22, transparent)`,
    top: '-100px',
    right: '-100px',
    pointerEvents: 'none',
  },
  bgCircle2: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${ACCENT2}22, transparent)`,
    bottom: '-80px',
    left: '-80px',
    pointerEvents: 'none',
  },
  card: {
    background: 'var(--sm-surface-5)',
    backdropFilter: 'blur(20px)',
    border: '1px solid var(--sm-surface-12)',
    borderRadius: '24px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
    position: 'relative',
    zIndex: 1,
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logo: {
    fontSize: '40px',
    marginBottom: '8px',
  },
  title: {
    color: '#fff',
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 4px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: 'var(--sm-surface-50)',
    fontSize: '14px',
    margin: 0,
  },
  roleToggle: {
    display: 'flex',
    background: 'var(--sm-surface-7)',
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '24px',
    gap: '4px',
  },
  roleActive: {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '9px',
    background: ACCENT,
    color: '#fff',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  roleInactive: {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '9px',
    background: 'transparent',
    color: 'var(--sm-surface-50)',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: 'var(--sm-red)',
    fontSize: '14px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    color: 'var(--sm-surface-70)',
    fontSize: '13px',
    fontWeight: '500',
  },
  input: {
    background: 'var(--sm-surface-8)',
    border: '1px solid var(--sm-surface-15)',
    borderRadius: '10px',
    padding: '12px 14px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'border 0.2s',
  },
  btn: {
    background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
    border: 'none',
    borderRadius: '12px',
    padding: '14px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'opacity 0.2s, transform 0.1s',
    boxShadow: `0 4px 20px ${ACCENT}55`,
  },
  btnDisabled: {
    background: 'var(--sm-surface-15)',
    border: 'none',
    borderRadius: '12px',
    padding: '14px',
    color: 'var(--sm-surface-50)',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'not-allowed',
    marginTop: '4px',
  },
  registerText: {
    textAlign: 'center',
    color: 'var(--sm-surface-45)',
    fontSize: '14px',
    marginTop: '20px',
    marginBottom: 0,
  },
  link: {
    color: 'var(--sm-indigo-muted)',
    textDecoration: 'none',
    fontWeight: '500',
  },
};
