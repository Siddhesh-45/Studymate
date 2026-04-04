// PLACEHOLDER — will be fully built in the Admin features step
export default function AdminDashboard() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: '12px',
      color: 'var(--sm-text-sub, #94a3b8)', fontFamily: 'Segoe UI, sans-serif'
    }}>
      <div style={{ fontSize: '48px' }}>🔐</div>
      <h2 style={{ color: 'var(--sm-text, #e2e8f0)', fontSize: '22px', fontWeight: 600 }}>AdminDashboard</h2>
      <p style={{ fontSize: '14px' }}>Admin panel — coming soon.</p>
    </div>
  );
}
