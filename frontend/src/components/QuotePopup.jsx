import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';

export default function QuotePopup() {
  const [showQuote, setShowQuote] = useState(false);
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    // We want to fetch the quote on mount
    const fetchQuote = async () => {
      try {
        const todayStr = new Date().toDateString();
        let stored = { date: '', ids: [] };
        try {
          const parsed = JSON.parse(localStorage.getItem('seenQuotes'));
          if (parsed && typeof parsed === 'object') stored = parsed;
        } catch (e) {}

        // Reset if it's a new day
        if (stored.date !== todayStr) {
          stored.date = todayStr;
          stored.ids = [];
        }

        let url = '/quotes/random';
        if (stored.ids.length > 0) {
          url += `?excludeIds=${stored.ids.join(',')}`;
        }

        const res = await API.get(url);
        if (res.data) {
          setQuote(res.data);
          setShowQuote(true);
          
          if (!stored.ids.includes(res.data._id)) {
            stored.ids.push(res.data._id);
            localStorage.setItem('seenQuotes', JSON.stringify(stored));
          }
          
          // Auto close after 5 seconds
          const timer = setTimeout(() => {
            setShowQuote(false);
          }, 5000);

          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.error('Failed to fetch quote:', err);
      }
    };

    fetchQuote();
  }, []);

  return (
    <AnimatePresence>
      {showQuote && quote && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={S.overlay}
          onClick={() => setShowQuote(false)}
        >
          <motion.div
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 350 }}
            style={S.popup}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              style={S.closeBtn} 
              onClick={() => setShowQuote(false)}
              onMouseEnter={(e) => e.target.style.background = 'var(--sm-surface-10)'}
              onMouseLeave={(e) => e.target.style.background = 'var(--sm-surface-5)'}
            >
              ✕
            </button>
            
            <div style={S.iconBox}>
              {quote.category === 'Funny' && '😂'}
              {quote.category === 'Motivation' && '🚀'}
              {quote.category === 'Discipline' && '🎯'}
              {quote.category === 'Savage' && '🔥'}
            </div>

            <p style={S.text}>"{quote.text}"</p>
            <p style={S.categoryLabel}>— {quote.category} Mode</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const S = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999, // Needs to be on top of everything
  },
  popup: {
    position: 'relative',
    padding: '40px 32px 32px',
    maxWidth: '420px',
    width: '90%',
    textAlign: 'center',
    background: 'linear-gradient(145deg, var(--sm-card-bg, #1e293b), var(--sm-surface-2, #0f172a))',
    border: '1px solid rgba(129, 140, 248, 0.25)',
    borderRadius: '24px',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'var(--sm-surface-5)',
    border: 'none',
    color: 'var(--sm-text-muted, #94a3b8)',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    transition: 'background 0.2s ease',
  },
  iconBox: {
    fontSize: '46px',
    marginBottom: '16px',
    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
  },
  text: {
    color: 'var(--sm-text, #f1f5f9)',
    fontSize: '22px',
    fontStyle: 'italic',
    fontWeight: '700',
    lineHeight: 1.4,
    margin: '0 0 16px 0',
  },
  categoryLabel: {
    color: 'var(--sm-indigo, #818cf8)',
    fontSize: '13px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    margin: 0,
    background: 'rgba(129, 140, 248, 0.15)',
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '20px',
  },
};
