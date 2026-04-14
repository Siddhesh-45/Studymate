import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import API from '../api';

function Spinner() {
  return (
    <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
  );
}

function VideoCard({ video, index }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', borderRadius: 10,
      background: 'rgba(99,102,241,0.06)',
      border: '1px solid rgba(99,102,241,0.15)',
      transition: 'background 0.15s',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: 'linear-gradient(135deg,#6366f1,#a855f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 11, fontWeight: 700,
      }}>{index + 1}</div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {video.title}
        </div>
      </div>
      <span style={{ fontSize: 18 }}>▶️</span>
    </div>
  );
}

export default function AdminAddCourse() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const navigate = useNavigate();

  const [url, setUrl]           = useState('');
  const [fetching, setFetching] = useState(false);
  const [preview, setPreview]   = useState(null);
  const [error, setError]       = useState('');
  const [importing, setImporting] = useState(false);
  const [success, setSuccess]   = useState(false);

  const cardBg  = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const border  = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0';
  const text    = isDark ? '#e2e8f0' : '#1e293b';
  const textSub = isDark ? '#94a3b8' : '#64748b';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc';

  const handleFetch = async () => {
    if (!url.trim()) { setError('Please enter a YouTube playlist URL.'); return; }
    setError(''); setFetching(true); setPreview(null);
    try {
      const { data } = await axios.post('http://localhost:5001/get-playlist', { playlistUrl: url });
      // Extract playlist id from URL for thumbnail
      const match = url.match(/[?&]list=([^#&?]+)/);
      const listId = match ? match[1] : '';
      setPreview({
        title:    data[0]?.title?.split('|')[0]?.trim() || 'YouTube Playlist',
        count:    data.length,
        videos:   data,
        thumbnail: listId ? `https://i.ytimg.com/vi/${data[0]?.videoUrl?.split('v=')[1]?.split('&')[0]}/hqdefault.jpg` : '',
      });
    } catch {
      setError('Could not fetch playlist. Check the URL or API key.');
    } finally { setFetching(false); }
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      await API.post('/course', {
        courseName: preview.title,
        description: 'Imported from YouTube Playlist',
        topics: preview.videos.map((v) => ({
          title: v.title,
          youtubeUrl: v.videoUrl,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          estimatedHours: 1,
        })),
      });
      setSuccess(true);
      setTimeout(() => navigate('/admin/courses'), 2000);
    } catch {
      setError('Import failed. Make sure the backend is running.');
    } finally { setImporting(false); }
  };

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 22, color: text, letterSpacing: '-0.4px' }}>Add Course</div>
        <div style={{ fontSize: 13, color: textSub, marginTop: 2 }}>Import a full course from a YouTube playlist</div>
      </div>

      {/* URL input card */}
      <div style={{ background: cardBg, border, borderRadius: 16, padding: '24px', marginBottom: 20, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.05)' }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 10 }}>
          🔗 YouTube Playlist URL
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={url}
            onChange={e => { setUrl(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleFetch()}
            placeholder="https://www.youtube.com/playlist?list=PLxxxxxx"
            style={{
              flex: 1, height: 44, padding: '0 14px', borderRadius: 10,
              background: inputBg, border: error ? '1.5px solid #ef4444' : border,
              color: text, fontSize: 13.5, outline: 'none',
              transition: 'border 0.15s',
            }}
          />
          <button onClick={handleFetch} disabled={fetching} style={{
            height: 44, padding: '0 22px', borderRadius: 10, border: 'none',
            background: fetching ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg,#6366f1,#a855f7)',
            color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: fetching ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
            transition: 'opacity 0.15s, transform 0.15s',
          }}>
            {fetching ? <><Spinner /> Fetching...</> : '🔍 Fetch Playlist'}
          </button>
        </div>
        {error && <div style={{ marginTop: 10, fontSize: 12.5, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>⚠️ {error}</div>}

        {/* Loading skeleton */}
        {fetching && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ height: 120, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9', animation: 'shimmer 1.4s infinite', backgroundSize: '400px 100%' }} />
            {[1,2,3].map(i => <div key={i} style={{ height: 44, borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9', animation: 'shimmer 1.4s infinite', width: `${85 - i * 10}%` }} />)}
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && !fetching && (
        <div style={{ animation: 'fadeUp 0.4s ease both' }}>
          {/* Playlist preview card */}
          <div style={{ background: cardBg, border, borderRadius: 16, overflow: 'hidden', marginBottom: 16, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.05)' }}>
            {preview.thumbnail && (
              <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                <img src={preview.thumbnail} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.currentTarget.parentElement.style.display = 'none'} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.7))' }} />
                <div style={{ position: 'absolute', bottom: 14, left: 18, right: 18 }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{preview.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 3 }}>{preview.count} videos in playlist</div>
                </div>
              </div>
            )}
            <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', fontSize: 12, fontWeight: 600 }}>
                📹 {preview.count} Videos
              </div>
              <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontSize: 12, fontWeight: 600 }}>
                ✅ Ready to Import
              </div>
            </div>
          </div>

          {/* Video list */}
          <div style={{ background: cardBg, border, borderRadius: 16, padding: '18px', marginBottom: 20, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: text, marginBottom: 12 }}>📋 Course Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 4, color: text }}>
              {preview.videos.map((v, i) => <VideoCard key={i} video={v} index={i} />)}
            </div>
          </div>

          {/* Import CTA */}
          {success ? (
            <div style={{ padding: '18px 24px', borderRadius: 12, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              ✅ Course imported successfully! Redirecting to Courses...
            </div>
          ) : (
            <button onClick={handleImport} disabled={importing} style={{
              width: '100%', height: 50, borderRadius: 12, border: 'none',
              background: importing ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg,#6366f1,#a855f7)',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: importing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
              transition: 'opacity 0.15s, transform 0.15s',
            }}
              onMouseEnter={e => { if (!importing) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(99,102,241,0.5)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)'; }}
            >
              {importing ? <><Spinner /> Importing Course...</> : '🚀 Import Course'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
