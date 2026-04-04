import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';

export default function Register() {
  // --- State ---
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate();

  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Front-end validations
    if (!name || !email || !password || !confirm) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // POST to /api/auth/register
      await API.post('/auth/register', { name, email, password });

      // Show success message, then redirect to login after 2 seconds
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Simple password strength: 0=empty 1=weak 2=medium 3=strong
  const getStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
    return score;
  };

  const strengthLabel = ['', 'Weak', 'Medium', 'Strong'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#10b981'];
  const strength = getStrength();

  // --- Render ---
  return (
    <div style={styles.page}>
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>🎓</div>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Join StudyMate and start learning smarter</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>

          {/* Success message */}
          {success && (
            <div style={styles.successBox}>
              ✅ {success}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div style={styles.errorBox}>
              ⚠️ {error}
            </div>
          )}

          {/* Full Name */}
          <div style={styles.field}>
            <label style={styles.label}>Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              style={styles.input}
              autoFocus
            />
          </div>

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
            />
          </div>

          {/* Password */}
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              style={styles.input}
              autoComplete="new-password"
            />
            {/* Password strength bar */}
            {password && (
              <div style={styles.strengthWrap}>
                <div style={styles.strengthBar}>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.strengthSegment,
                        background: strength >= i ? strengthColor[strength] : 'var(--sm-surface-10)',
                      }}
                    />
                  ))}
                </div>
                <span style={{ ...styles.strengthText, color: strengthColor[strength] }}>
                  {strengthLabel[strength]}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div style={styles.field}>
            <label style={styles.label}>Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              style={{
                ...styles.input,
                borderColor: confirm && confirm !== password
                  ? 'rgba(239,68,68,0.6)'
                  : 'var(--sm-surface-15)',
              }}
              autoComplete="new-password"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            style={loading ? styles.btnDisabled : styles.btn}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        {/* Back to login */}
        <p style={styles.loginText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ACCENT = '#6366f1';
const ACCENT2 = '#8b5cf6';

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
    left: '-100px',
    pointerEvents: 'none',
  },
  bgCircle2: {
    position: 'absolute',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${ACCENT2}22, transparent)`,
    bottom: '-80px',
    right: '-80px',
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
    fontSize: '26px',
    fontWeight: '700',
    margin: '0 0 4px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: 'var(--sm-surface-50)',
    fontSize: '14px',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  successBox: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: 'var(--sm-emerald)',
    fontSize: '14px',
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
    padding: '11px 14px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'border 0.2s',
  },
  strengthWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '2px',
  },
  strengthBar: {
    display: 'flex',
    gap: '4px',
    flex: 1,
  },
  strengthSegment: {
    flex: 1,
    height: '3px',
    borderRadius: '2px',
    transition: 'background 0.3s',
  },
  strengthText: {
    fontSize: '12px',
    fontWeight: '500',
    minWidth: '44px',
  },
  btn: {
    background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
    border: 'none',
    borderRadius: '12px',
    padding: '13px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '4px',
    boxShadow: `0 4px 20px ${ACCENT}55`,
  },
  btnDisabled: {
    background: 'var(--sm-surface-15)',
    border: 'none',
    borderRadius: '12px',
    padding: '13px',
    color: 'var(--sm-surface-50)',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'not-allowed',
    marginTop: '4px',
  },
  loginText: {
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
