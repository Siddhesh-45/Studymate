import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// Inject Inter font once
if (typeof document !== 'undefined' && !document.getElementById('inter-font')) {
  const l = document.createElement('link');
  l.id   = 'inter-font';
  l.rel  = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(l);
}

export default function Layout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin   = user.role === 'admin';
  const { mode, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const studentLinks = [
    { to: '/dashboard',   label: '🏠 Dashboard'  },
    { to: '/all-courses', label: '📚 All Courses' },
    { to: '/my-courses',  label: '🎯 My Courses'  },
    { to: '/schedule',    label: '📅 Schedule'    },
    { to: '/quiz',        label: '🧠 Quiz'        },
  ];

  const adminLinks = [
    { to: '/admin',         label: '📊 Dashboard' },
    { to: '/admin/courses', label: '📚 Courses'   },
    { to: '/admin/users',   label: '👥 Users'     },
    { to: '/admin/content', label: '📋 Content'   },
  ];

  const links    = isAdmin ? adminLinks : studentLinks;
  const isActive = (to) =>
    to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(to);

  return (
    <div style={S.wrapper}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside style={S.sidebar}>

        {/* Brand */}
        <div style={S.brand}>
          <span style={{ fontSize: 22 }}>📚</span>
          <span style={S.brandText}>StudyMate</span>
        </div>

        {/* Role badge */}
        <div style={{ ...S.roleBadge, ...(isAdmin ? S.badgeAdmin : S.badgeStudent) }}>
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

        {/* Theme toggle */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={toggleTheme}
          style={S.toggleBtn}
          title="Toggle light / dark mode"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={mode}
              initial={{ opacity: 0, scale: 0.7, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7, rotate: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{ display: 'inline-block' }}
            >
              {mode === 'dark' ? '☀️' : '🌙'}
            </motion.span>
          </AnimatePresence>
          {mode === 'dark' ? ' Light mode' : ' Dark mode'}
        </motion.button>

        {/* User + Logout */}
        <div style={S.userSection}>
          <p style={S.userName}>{user.name || 'User'}</p>
          <p style={S.userEmail}>{user.email || ''}</p>
          <button onClick={handleLogout} style={S.logoutBtn}>🚪 Logout</button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={S.main}
      >
        {children}
      </motion.main>
    </div>
  );
}

// ── Styles using CSS custom properties ────────────────────────────────────────
// Values fall back to dark-theme defaults so first paint is correct.
const S = {
  wrapper: {
    display:    'flex',
    minHeight:  '100vh',
    background: 'var(--sm-bg, linear-gradient(135deg,#0d1117,#0f172a))',
    fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
    transition: 'background 0.4s ease',
  },
  sidebar: {
    width:         220,
    minHeight:     '100vh',
    background:    'var(--sm-sidebar-bg, var(--sm-surface-4))',
    borderRight:   'var(--sm-sidebar-border, 1px solid var(--sm-surface-8))',
    display:       'flex',
    flexDirection: 'column',
    padding:       '24px 14px',
    position:      'sticky',
    top:           0,
    height:        '100vh',
    overflowY:     'auto',
    flexShrink:    0,
    backdropFilter:'blur(12px)',
    transition:    'background 0.4s ease, border-color 0.4s ease',
  },
  brand: {
    display:       'flex',
    alignItems:    'center',
    gap:           10,
    marginBottom:  12,
  },
  brandText: {
    color:        'var(--sm-text, #e2e8f0)',
    fontSize:     18,
    fontWeight:   700,
    letterSpacing:'-0.3px',
    transition:   'color 0.3s ease',
  },
  roleBadge: {
    borderRadius:  8,
    padding:       '5px 10px',
    fontSize:      12,
    fontWeight:    500,
    marginBottom:  24,
    textAlign:     'center',
    transition:    'all 0.3s ease',
  },
  badgeAdmin: {
    background: 'rgba(99,102,241,0.2)',
    border:     '1px solid rgba(99,102,241,0.3)',
    color:      'var(--sm-indigo-muted)',
  },
  badgeStudent: {
    background: 'rgba(34,197,94,0.15)',
    border:     '1px solid rgba(34,197,94,0.25)',
    color:      '#86efac',
  },
  nav: {
    display:       'flex',
    flexDirection: 'column',
    gap:           4,
    flex:          1,
  },
  navLink: {
    padding:        '10px 12px',
    borderRadius:   10,
    color:          'var(--sm-link, var(--sm-surface-55))',
    textDecoration: 'none',
    fontSize:       14,
    fontWeight:     500,
    transition:     'all 0.18s ease',
  },
  navLinkActive: {
    background: 'var(--sm-link-active-bg, rgba(99,102,241,0.2))',
    color:      'var(--sm-link-active, var(--sm-indigo-muted))',
  },

  // Theme toggle button
  toggleBtn: {
    display:       'flex',
    alignItems:    'center',
    gap:           6,
    background:    'var(--sm-card-bg, var(--sm-surface-4))',
    border:        'var(--sm-card-border, 1px solid var(--sm-surface-8))',
    borderRadius:  10,
    padding:       '8px 12px',
    color:         'var(--sm-text-sub, #94a3b8)',
    fontSize:      13,
    fontWeight:    600,
    cursor:        'pointer',
    marginBottom:  12,
    width:         '100%',
    justifyContent:'center',
    transition:    'all 0.25s ease',
  },

  userSection: {
    borderTop:  'var(--sm-divider, 1px solid var(--sm-surface-8))',
    paddingTop: 14,
    marginTop:  8,
    transition: 'border-color 0.3s ease',
  },
  userName: {
    color:        'var(--sm-text, #e2e8f0)',
    fontSize:     13,
    fontWeight:   600,
    marginBottom: 2,
    transition:   'color 0.3s ease',
  },
  userEmail: {
    color:        'var(--sm-text-muted, var(--sm-surface-35))',
    fontSize:     11,
    marginBottom: 12,
    wordBreak:    'break-all',
    transition:   'color 0.3s ease',
  },
  logoutBtn: {
    width:      '100%',
    background: 'var(--sm-logout-bg, rgba(239,68,68,0.1))',
    border:     '1px solid var(--sm-logout-border, rgba(239,68,68,0.25))',
    borderRadius:8,
    padding:    '8px',
    color:      'var(--sm-logout-color, var(--sm-red))',
    fontSize:   13,
    cursor:     'pointer',
    transition: 'all 0.25s ease',
  },
  main: {
    flex:      1,
    padding:   32,
    color:     'var(--sm-text, #e2e8f0)',
    overflowY: 'auto',
    transition:'color 0.3s ease',
  },
};
