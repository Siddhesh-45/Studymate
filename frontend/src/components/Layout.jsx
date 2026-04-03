import { useNavigate, Link, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin   = user.role === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // ── Student navigation ────────────────────────────────────────────────────
  const studentLinks = [
    { to: '/dashboard',   label: '🏠 Dashboard'   },
    { to: '/all-courses', label: '📚 All Courses'  }, // browse all admin-imported courses
    { to: '/my-courses',  label: '🎯 My Courses'   }, // student's personal selected list
    { to: '/schedule',    label: '📅 Schedule'     }, // uses only My Courses
    { to: '/quiz',        label: '🧠 Quiz'         },
  ];

  // ── Admin navigation — includes Courses for playlist/content management ──
  const adminLinks = [
    { to: '/admin',         label: '📊 Dashboard' },
    { to: '/admin/courses', label: '📚 Courses'   },  // ← NEW
    { to: '/admin/users',   label: '👥 Users'     },
    { to: '/admin/content', label: '📋 Content'   },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  // isActive: mark link active if path starts with the link's `to`
  // (so /admin/courses stays active even when modal is open)
  const isActive = (to) => {
    if (to === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(to);
  };

  return (
    <div style={S.wrapper}>

      {/* ── Sidebar ── */}
      <aside style={S.sidebar}>

        {/* Brand */}
        <div style={S.brand}>
          <span style={{ fontSize: '22px' }}>📚</span>
          <span style={S.brandText}>StudyMate</span>
        </div>

        {/* Role badge */}
        <div style={{
          ...S.roleBadge,
          ...(isAdmin ? S.roleBadgeAdmin : S.roleBadgeStudent),
        }}>
          {isAdmin ? '🔐 Admin' : '🎓 Student'}
        </div>

        {/* Nav links */}
        <nav style={S.nav}>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                ...S.navLink,
                ...(isActive(link.to) ? S.navLinkActive : {}),
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User info + logout */}
        <div style={S.userSection}>
          <p style={S.userName}>{user.name || 'User'}</p>
          <p style={S.userEmail}>{user.email || ''}</p>
          <button onClick={handleLogout} style={S.logoutBtn}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={S.main}>
        {children}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const S = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0f172a',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  sidebar: {
    width: '220px',
    minHeight: '100vh',
    background: 'rgba(255,255,255,0.04)',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
    flexShrink: 0,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  brandText: {
    color: '#e2e8f0',
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
  },
  roleBadge: {
    borderRadius: '8px',
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: '500',
    marginBottom: '24px',
    textAlign: 'center',
  },
  roleBadgeAdmin: {
    background: 'rgba(99,102,241,0.2)',
    border: '1px solid rgba(99,102,241,0.3)',
    color: '#a5b4fc',
  },
  roleBadgeStudent: {
    background: 'rgba(34,197,94,0.15)',
    border: '1px solid rgba(34,197,94,0.25)',
    color: '#86efac',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  navLink: {
    padding: '10px 12px',
    borderRadius: '10px',
    color: 'rgba(255,255,255,0.55)',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.15s',
  },
  navLinkActive: {
    background: 'rgba(99,102,241,0.2)',
    color: '#a5b4fc',
  },
  userSection: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingTop: '16px',
    marginTop: '16px',
  },
  userName: {
    color: '#e2e8f0',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '2px',
  },
  userEmail: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: '11px',
    marginBottom: '12px',
    wordBreak: 'break-all',
  },
  logoutBtn: {
    width: '100%',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: '8px',
    padding: '8px',
    color: '#fca5a5',
    fontSize: '13px',
    cursor: 'pointer',
  },
  main: {
    flex: 1,
    padding: '32px',
    color: '#e2e8f0',
    overflowY: 'auto',
  },
};
