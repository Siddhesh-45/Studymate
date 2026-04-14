import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'MAIN',
    items: [
      { to: '/admin',            icon: '⊞', label: 'Dashboard'        },
      { to: '/admin/analytics',  icon: '📈', label: 'Analytics'       },
    ],
  },
  {
    label: 'CONTENT',
    items: [
      { to: '/admin/courses',    icon: '📚', label: 'Courses'         },
      { to: '/admin/add-course', icon: '➕', label: 'Add Course', cta: true },
    ],
  },
  {
    label: 'PEOPLE',
    items: [
      { to: '/admin/users',      icon: '👥', label: 'Students'        },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/admin/settings',   icon: '⚙️', label: 'Settings'       },
    ],
  },
];

// ─── Page title map ───────────────────────────────────────────────────────────
const PAGE_TITLES = {
  '/admin':             'Dashboard',
  '/admin/analytics':   'Analytics',
  '/admin/courses':     'Courses',
  '/admin/add-course':  'Add Course',
  '/admin/users':       'Students',
  '/admin/settings':    'Settings',
};

export default function AdminLayout({ children }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { mode, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications] = useState(3);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const pageTitle = PAGE_TITLES[location.pathname] || 'Admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (to) =>
    to === '/admin' ? location.pathname === '/admin' : location.pathname === to;

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isDark = mode === 'dark';

  // ── Styles ─────────────────────────────────────────────────────────────────
  const vars = {
    sidebarW:    collapsed ? 68 : 240,
    sidebarBg:   isDark ? 'rgba(10,15,35,0.92)' : '#ffffff',
    topbarBg:    isDark ? 'rgba(10,15,35,0.85)' : 'rgba(255,255,255,0.9)',
    mainBg:      isDark
      ? 'linear-gradient(135deg,#0f172a 0%,#020617 50%,#0d0a1f 100%)'
      : '#f1f5f9',
    border:      isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e2e8f0',
    text:        isDark ? '#e2e8f0' : '#1e293b',
    textSub:     isDark ? '#94a3b8' : '#64748b',
    cardBg:      isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
  };

  const sidebarStyle = {
    position:        'fixed',
    top:             0,
    left:            mobileOpen ? 0 : -vars.sidebarW,
    width:           vars.sidebarW,
    height:          '100vh',
    background:      vars.sidebarBg,
    backdropFilter:  'blur(20px)',
    borderRight:     vars.border,
    display:         'flex',
    flexDirection:   'column',
    zIndex:          50,
    transition:      'width 0.25s ease, left 0.25s ease',
    overflowX:       'hidden',
    overflowY:       'auto',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: vars.mainBg, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>

      {/* ── Mobile overlay ─────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 40, backdropFilter: 'blur(2px)',
        }} />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="adm-sidebar" style={sidebarStyle}>

        {/* Brand */}
        <div style={{ padding: collapsed ? '20px 14px' : '20px 20px 12px', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'space-between', borderBottom: vars.border }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg,#6366f1,#a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, boxShadow: '0 0 16px rgba(99,102,241,0.4)',
            }}>📚</div>
            {!collapsed && (
              <div>
                <div style={{ color: vars.text, fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>StudyMate</div>
                <div style={{ fontSize: 10, color: vars.textSub, fontWeight: 500 }}>Admin Console</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} style={btnReset} title="Collapse sidebar">
              <span style={{ color: vars.textSub, fontSize: 18, cursor: 'pointer' }}>‹</span>
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{ ...btnReset, padding: '12px', display: 'flex', justifyContent: 'center', color: vars.textSub }}>›</button>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: collapsed ? '12px 8px' : '12px 12px', overflowY: 'auto' }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} style={{ marginBottom: 8 }}>
              {!collapsed && (
                <div style={{ fontSize: 10, fontWeight: 700, color: vars.textSub, letterSpacing: '0.08em', padding: '8px 8px 4px', opacity: 0.6 }}>
                  {section.label}
                </div>
              )}
              {section.items.map((item) => {
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : ''}
                    style={{
                      display:        'flex',
                      alignItems:     'center',
                      gap:            10,
                      padding:        collapsed ? '10px 0' : '9px 10px',
                      borderRadius:   10,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      textDecoration: 'none',
                      marginBottom:   2,
                      fontSize:       13.5,
                      fontWeight:     active ? 600 : 500,
                      transition:     'all 0.15s ease',
                      position:       'relative',
                      background:     item.cta
                        ? 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(168,85,247,0.15))'
                        : active
                          ? (isDark ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.1)')
                          : 'transparent',
                      color: item.cta
                        ? '#a78bfa'
                        : active
                          ? (isDark ? '#a5b4fc' : '#6366f1')
                          : vars.textSub,
                      border: item.cta
                        ? '1px solid rgba(99,102,241,0.25)'
                        : active
                          ? (isDark ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(99,102,241,0.2)')
                          : '1px solid transparent',
                    }}
                  >
                    {active && !item.cta && (
                      <div style={{
                        position: 'absolute', left: 0, top: '20%', bottom: '20%',
                        width: 3, background: '#6366f1', borderRadius: '0 3px 3px 0',
                      }} />
                    )}
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom: Theme + User */}
        <div style={{ padding: collapsed ? '12px 8px' : '12px 16px', borderTop: vars.border }}>
          {/* Theme toggle */}
          <button onClick={toggleTheme} style={{
            ...btnReset,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8,
            padding: '8px 10px',
            borderRadius: 8,
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            border: vars.border,
            color: vars.textSub,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: 10,
            transition: 'all 0.2s',
          }}>
            <span>{isDark ? '☀️' : '🌙'}</span>
            {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#6366f1,#a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 14,
              }}>
                {(user.name || 'A')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ color: vars.text, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name || 'Admin'}</div>
                <div style={{ color: vars.textSub, fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email || ''}</div>
              </div>
              <button onClick={handleLogout} title="Logout" style={{
                ...btnReset, padding: '6px 8px', borderRadius: 7,
                background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171', fontSize: 12, cursor: 'pointer',
              }}>✕</button>
            </div>
          )}
          {collapsed && (
            <button onClick={handleLogout} title="Logout" style={{
              ...btnReset, width: '100%', padding: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer',
            }}>✕</button>
          )}
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div className="adm-main" style={{ flex: 1, marginLeft: 0, transition: 'margin-left 0.25s ease', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Top navbar */}
        <header style={{
          position:       'sticky',
          top:            0,
          zIndex:         30,
          height:         60,
          background:     vars.topbarBg,
          backdropFilter: 'blur(16px)',
          borderBottom:   vars.border,
          display:        'flex',
          alignItems:     'center',
          padding:        '0 24px',
          gap:            16,
        }}>
          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ ...btnReset, display: 'none', '@media(maxWidth:768px)': { display: 'flex' } }} className="mobile-menu-btn">
            <span style={{ fontSize: 22, color: vars.textSub }}>☰</span>
          </button>

          {/* Page title */}
          <h1 style={{ color: vars.text, fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: '-0.3px', flex: 1 }}>
            {pageTitle}
          </h1>

          {/* Search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} className="search-wrapper">
            <span style={{ position: 'absolute', left: 10, color: vars.textSub, fontSize: 14, pointerEvents: 'none' }}>🔍</span>
            <input
              placeholder="Search..."
              style={{
                paddingLeft: 32, paddingRight: 12, height: 34,
                background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                border: vars.border,
                borderRadius: 8, color: vars.text, fontSize: 13,
                outline: 'none', width: 180,
                transition: 'width 0.2s, background 0.2s',
              }}
            />
          </div>

          {/* Notification bell */}
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
              border: vars.border,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>🔔</div>
            {notifications > 0 && (
              <div style={{
                position: 'absolute', top: -4, right: -4,
                width: 16, height: 16, borderRadius: '50%',
                background: '#ef4444', color: '#fff',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: isDark ? '2px solid #0f172a' : '2px solid #fff',
              }}>{notifications}</div>
            )}
          </div>

          {/* Avatar */}
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg,#6366f1,#a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            boxShadow: '0 0 0 2px rgba(99,102,241,0.3)',
          }}>
            {(user.name || 'A')[0].toUpperCase()}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px 28px', overflow: 'auto', color: vars.text }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .adm-sidebar { left: ${mobileOpen ? 0 : -vars.sidebarW}px !important; }
          .adm-main    { margin-left: 0 !important; }
          .mobile-menu-btn { display: flex !important; }
          .search-wrapper   { display: none; }
        }
        @media (min-width: 768px) {
          .adm-sidebar { left: 0 !important; }
          .adm-main    { margin-left: ${vars.sidebarW}px !important; }
          .mobile-menu-btn { display: none !important; }
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes countUp { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
        @keyframes chartGrow { from { stroke-dashoffset:1000; } to { stroke-dashoffset:0; } }
      `}</style>
    </div>
  );
}

const btnReset = { background: 'none', border: 'none', padding: 0, cursor: 'pointer' };
