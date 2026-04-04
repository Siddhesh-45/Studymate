// User's requested Tailwind-based theme system
export const themes = {
  dark: {
    bg: "bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#000000]",
    card: "bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl",
    text: "text-white",
    subtext: "text-gray-400",
    accent: "from-indigo-500 via-purple-500 to-pink-500"
  },
  light: {
    bg: "bg-[#f8fafc]",
    card: "bg-white border border-gray-200 shadow-sm",
    text: "text-gray-900",
    subtext: "text-gray-600",
    accent: "from-blue-500 via-indigo-500 to-purple-500"
  }
};

// Original CSS mappings for backward compatibility (updated to map to the new premium aesthetic)
export const THEMES = {
  dark: {
    '--sm-bg':             'linear-gradient(to bottom right, #0f172a, #020617, #000000)',
    '--sm-sidebar-bg':     'rgba(255,255,255,0.05)',
    '--sm-sidebar-border': '1px solid rgba(255,255,255,0.1)',
    '--sm-card-bg':        'rgba(255,255,255,0.05)',
    '--sm-card-border':    '1px solid rgba(255,255,255,0.1)',
    '--sm-card-shadow':    '0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.3)',
    '--sm-text':           '#ffffff',
    '--sm-text-sub':       '#9ca3af',
    '--sm-text-muted':     '#6b7280',
    '--sm-accent':         '#a855f7',
    '--sm-accent-grad':    'linear-gradient(to right, #6366f1, #a855f7, #ec4899)',
    '--sm-link':           'rgba(255,255,255,0.6)',
    '--sm-link-active-bg': 'rgba(99,102,241,0.2)',
    '--sm-link-active':    '#c084fc',
    '--sm-divider':        'rgba(255,255,255,0.1)',
    '--sm-logout-bg':      'rgba(239,68,68,0.15)',
    '--sm-logout-border':  'rgba(239,68,68,0.3)',
    '--sm-logout-color':   '#fca5a5',
    '--sm-track':          'var(--sm-surface-5)',
    '--sm-pill-fill':      'linear-gradient(to right, #6366f1, #a855f7, #ec4899)',
    '--sm-input-bg':       'var(--sm-surface-5)',
    '--sm-input-border':   'var(--sm-surface-10)',

    /* Semantic UI Foreground Colors */
    '--sm-emerald':        '#6ee7b7',
    '--sm-emerald-muted':  '#34d399',
    '--sm-indigo':         '#818cf8',
    '--sm-indigo-muted':   '#a5b4fc',
    '--sm-red':            '#fca5a5',
    '--sm-red-muted':      '#f87171',
    '--sm-yellow':         '#fcd34d',
    '--sm-orange':         '#fb923c',
    '--sm-cyan':           '#7dd3fc',
    '--sm-cyan-muted':     '#38bdf8',

    /* Alpha System for structural transparency */
    '--sm-surface-2':      'rgba(255,255,255,0.02)',
    '--sm-surface-3':      'rgba(255,255,255,0.03)',
    '--sm-surface-4':      'rgba(255,255,255,0.04)',
    '--sm-surface-5':      'rgba(255,255,255,0.05)',
    '--sm-surface-7':      'rgba(255,255,255,0.07)',
    '--sm-surface-8':      'rgba(255,255,255,0.08)',
    '--sm-surface-10':     'rgba(255,255,255,0.1)',
    '--sm-surface-12':     'rgba(255,255,255,0.12)',
    '--sm-surface-15':     'rgba(255,255,255,0.15)',
    '--sm-surface-18':     'rgba(255,255,255,0.18)',
    '--sm-surface-20':     'rgba(255,255,255,0.2)',
    '--sm-surface-25':     'rgba(255,255,255,0.25)',
    '--sm-surface-30':     'rgba(255,255,255,0.3)',
    '--sm-surface-35':     'rgba(255,255,255,0.35)',
    '--sm-surface-40':     'rgba(255,255,255,0.4)',
    '--sm-surface-50':     'rgba(255,255,255,0.5)',
    '--sm-surface-55':     'rgba(255,255,255,0.55)',
    '--sm-surface-60':     'var(--sm-surface-60)',
  },
  light: {
    '--sm-bg':             '#fff0e5', // Patilwada-inspired peach cream
    '--sm-sidebar-bg':     '#ffffff', // Pure white for structural contrast
    '--sm-sidebar-border': '1px solid #e8e4db', // Warm, soft borders
    '--sm-card-bg':        '#ffffff', // White cards pop beautifully against cream
    '--sm-card-border':    '1px solid #e8e4db',
    '--sm-card-shadow':    '0 8px 30px rgba(120, 110, 100, 0.06), 0 4px 10px rgba(120, 110, 100, 0.03)', // Premium soft, warm shadows
    '--sm-text':           '#1c1917', // High-contrast Stone-900 (deep warm grey) for maximum legibility
    '--sm-text-sub':       '#57534e', // Stone-600
    '--sm-text-muted':     '#78716c', // Stone-500
    '--sm-accent':         '#4f46e5', // Deep Indigo
    '--sm-accent-grad':    'linear-gradient(to right, #4f46e5, #7c3aed)',
    '--sm-link':           '#57534e',
    '--sm-link-active-bg': 'rgba(79, 70, 229, 0.08)',
    '--sm-link-active':    '#4f46e5',
    '--sm-divider':        '#e8e4db',
    '--sm-logout-bg':      'rgba(220, 38, 38, 0.05)',
    '--sm-logout-border':  'rgba(220, 38, 38, 0.15)',
    '--sm-logout-color':   '#b91c1c', 
    '--sm-track':          '#f0ede6',
    '--sm-pill-fill':      'linear-gradient(to right, #4f46e5, #7c3aed)',
    '--sm-input-bg':       '#ffffff',
    '--sm-input-border':   '#d6d2c9',

    /* Semantic UI Foreground Colors (Darkened for readability on light BG) */
    '--sm-emerald':        '#059669', // Emerald 600
    '--sm-emerald-muted':  '#10b981', // Emerald 500
    '--sm-indigo':         '#4f46e5', // Indigo 600
    '--sm-indigo-muted':   '#6366f1', // Indigo 500
    '--sm-red':            '#dc2626', // Red 600
    '--sm-red-muted':      '#ef4444', // Red 500
    '--sm-yellow':         '#d97706', // Amber 600
    '--sm-orange':         '#ea580c', // Orange 600
    '--sm-cyan':           '#0284c7', // Sky 600
    '--sm-cyan-muted':     '#0ea5e9', // Sky 500

    /* Alpha System maps to black for light mode structure */
    '--sm-surface-2':      'rgba(0,0,0,0.02)',
    '--sm-surface-3':      'rgba(0,0,0,0.03)',
    '--sm-surface-4':      'rgba(0,0,0,0.04)',
    '--sm-surface-5':      'rgba(0,0,0,0.05)',
    '--sm-surface-7':      'rgba(0,0,0,0.07)',
    '--sm-surface-8':      'rgba(0,0,0,0.08)',
    '--sm-surface-10':     'rgba(0,0,0,0.1)',
    '--sm-surface-12':     'rgba(0,0,0,0.12)',
    '--sm-surface-15':     'rgba(0,0,0,0.15)',
    '--sm-surface-18':     'rgba(0,0,0,0.18)',
    '--sm-surface-20':     'rgba(0,0,0,0.2)',
    '--sm-surface-25':     'rgba(0,0,0,0.25)',
    '--sm-surface-30':     'rgba(0,0,0,0.3)',
    '--sm-surface-35':     'rgba(0,0,0,0.35)',
    '--sm-surface-40':     'rgba(0,0,0,0.4)',
    '--sm-surface-50':     'rgba(0,0,0,0.5)',
    '--sm-surface-55':     'rgba(0,0,0,0.55)',
    '--sm-surface-60':     'rgba(0,0,0,0.6)',
  }
};
