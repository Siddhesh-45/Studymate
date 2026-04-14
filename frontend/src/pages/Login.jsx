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

      <div style={styles.card} className="glass-card">
        {/* Logo / Title */}
          <div style={styles.logoBox}>
            <span style={styles.logo}>📚</span>
          </div>
          <h1 style={styles.title}>StudyMate</h1>
          <p style={styles.subtitle}>Welcome back, future Achiever</p>
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
              className="input-glass"
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
              className="input-glass"
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
            className="auth-btn-hover"
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

// ─── Animations inside a style tag ─────────────────────────────────────────────
const authAnimations = `
  @keyframes blob {
    0% { transform: scale(1) translate(0px, 0px); }
    33% { transform: scale(1.1) translate(30px, -50px); }
    66% { transform: scale(0.9) translate(-20px, 20px); }
    100% { transform: scale(1) translate(0px, 0px); }
  }
  @keyframes fadeUpIn {
    0% { opacity: 0; transform: translateY(20px) scale(0.98); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  .glass-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
    animation: fadeUpIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }
  .input-glass:focus {
    border-color: #8b5cf6 !important;
    background: rgba(255, 255, 255, 0.08) !important;
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
  }
  .auth-btn-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(99,102,241,0.5) !important;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('auth-styles')) {
  const style = document.createElement('style');
  style.id = 'auth-styles';
  style.innerHTML = authAnimations;
  document.head.appendChild(style);
}

const ACCENT = '#6366f1';   // indigo
const ACCENT2 = '#8b5cf6';  // purple
const ACCENT3 = '#ec4899';  // pink

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at top right, #1a153a, #09090b 60%)',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${ACCENT}33, transparent 60%)`,
    top: '-20%',
    right: '-10%',
    animation: 'blob 15s infinite alternate ease-in-out',
    pointerEvents: 'none',
    filter: 'blur(60px)',
  },
  bgCircle2: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${ACCENT3}25, transparent 60%)`,
    bottom: '-15%',
    left: '-10%',
    animation: 'blob 20s infinite alternate-reverse ease-in-out',
    pointerEvents: 'none',
    filter: 'blur(70px)',
  },
  card: {
    borderRadius: '28px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '440px',
    position: 'relative',
    zIndex: 1,
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoBox: {
    width: '56px',
    height: '56px',
    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
    border: '1px solid rgba(139,92,246,0.3)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    boxShadow: '0 8px 24px rgba(99,102,241,0.2)',
  },
  logo: {
    fontSize: '28px',
  },
  title: {
    color: '#ffffff',
    fontSize: '32px',
    fontWeight: '800',
    margin: '0 0 6px 0',
    letterSpacing: '-1px',
    background: 'linear-gradient(to right, #fff, #a5b4fc)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '15px',
    fontWeight: '400',
    margin: 0,
  },
  roleToggle: {
    display: 'flex',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '14px',
    padding: '6px',
    marginBottom: '32px',
    gap: '4px',
  },
  roleActive: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  roleInactive: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '10px',
    background: 'transparent',
    color: '#64748b',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
    padding: '14px 16px',
    color: '#fca5a5',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '14px 16px',
    color: '#e2e8f0',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  btn: {
    background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
    border: 'none',
    borderRadius: '12px',
    padding: '16px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.3s ease',
    boxShadow: `0 4px 15px ${ACCENT}44`,
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
