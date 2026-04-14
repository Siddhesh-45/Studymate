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

      <div style={styles.card} className="glass-card">
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoBox}>
            <span style={styles.logo}>🎓</span>
          </div>
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
              className="input-glass"
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
              className="input-glass"
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
              className="input-glass"
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
              className="input-glass"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              style={{
                ...styles.input,
                borderColor: confirm && confirm !== password
                  ? 'rgba(239,68,68,0.6)'
                  : 'rgba(255,255,255,0.08)',
              }}
              autoComplete="new-password"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="auth-btn-hover"
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

if (typeof document !== 'undefined' && !document.getElementById('auth-styles-reg')) {
  const style = document.createElement('style');
  style.id = 'auth-styles-reg';
  style.innerHTML = authAnimations;
  document.head.appendChild(style);
}

const ACCENT = '#6366f1';
const ACCENT2 = '#8b5cf6';
const ACCENT3 = '#ec4899';

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
    left: '-10%',
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
    right: '-10%',
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  successBox: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '12px',
    padding: '14px 16px',
    color: '#6ee7b7',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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
