import React, { useEffect, useState } from 'react';
import API from '../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users list.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      setProcessingId(userId);
      await API.patch(`/admin/users/${userId}`, { role: newRole });
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error('Error updating role:', err);
      alert('Failed to update user role');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      setProcessingId(userId);
      await API.patch(`/admin/users/${userId}`, { status: newStatus });
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u._id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update user status');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you certain you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      setProcessingId(userId);
      await API.delete(`/admin/users/${userId}`);
      setUsers((prevUsers) => prevUsers.filter((u) => u._id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    } finally {
      setProcessingId(null);
    }
  };

  const containerStyle = {
    padding: '24px',
    color: 'var(--sm-text, #e2e8f0)',
    fontFamily: 'var(--sm-font, "Inter", sans-serif)',
  };

  const headerStyle = {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '8px',
    background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };

  const subtitleStyle = {
    color: 'var(--sm-text-sub, #94a3b8)',
    marginBottom: '32px',
    fontSize: '16px',
  };

  const tableContainerStyle = {
    background: 'var(--sm-surface, rgba(30, 41, 59, 0.7))',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--sm-border, rgba(255,255,255,0.05))',
    borderRadius: '16px',
    padding: '24px',
    overflowX: 'auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  };

  const thStyle = {
    padding: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--sm-text-sub, #94a3b8)',
    fontWeight: 600,
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const tdStyle = {
    padding: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    color: 'var(--sm-text, #f8fafc)',
    fontSize: '15px',
  };

  const buttonStyle = (colorType) => {
    let bg, color, border;
    if (colorType === 'danger') {
      bg = 'rgba(239, 68, 68, 0.1)'; color = '#f87171'; border = 'rgba(239, 68, 68, 0.2)';
    } else if (colorType === 'primary') {
      bg = 'rgba(96, 165, 250, 0.1)'; color = '#60a5fa'; border = 'rgba(96, 165, 250, 0.2)';
    } else {
      bg = 'rgba(148, 163, 184, 0.1)'; color = '#94a3b8'; border = 'rgba(148, 163, 184, 0.2)';
    }
    
    return {
      padding: '6px 12px',
      borderRadius: '6px',
      background: bg,
      color: color,
      border: `1px solid ${border}`,
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      transition: 'all 0.2s',
      marginRight: '8px',
    };
  };

  if (loading) {
    return (
      <div style={{ ...containerStyle, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ fontSize: '20px', color: '#60a5fa', animation: 'pulse 1.5s infinite' }}>Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', borderRadius: '8px', color: '#ef4444' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>User Management</h1>
      <p style={subtitleStyle}>View and manage all registered users on the platform.</p>

      <div style={tableContainerStyle} className="users-table-container">
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Joined</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isProcessing = processingId === user._id;
                
                return (
                  <tr key={user._id} className="user-row" style={{ opacity: isProcessing ? 0.5 : 1 }}>
                    <td style={{ ...tdStyle, fontWeight: '500' }}>{user.name}</td>
                    <td style={{ ...tdStyle, color: '#cbd5e1' }}>{user.email}</td>
                    <td style={tdStyle}>
                      <select 
                        value={user.role} 
                        onChange={(e) => handleUpdateRole(user._id, e.target.value)}
                        disabled={isProcessing}
                        style={{
                          background: 'rgba(15, 23, 42, 0.5)',
                          color: '#e2e8f0',
                          border: '1px solid rgba(255,255,255,0.1)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        background: user.status === 'active' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: user.status === 'active' ? '#34d399' : '#ef4444',
                        border: `1px solid ${user.status === 'active' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                      }}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: '#94a3b8', fontSize: '14px' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td style={tdStyle}>
                      <button 
                        disabled={isProcessing}
                        onClick={() => handleUpdateStatus(user._id, user.status || 'active')}
                        style={buttonStyle('primary')}
                        className="btn-hover"
                      >
                        {user.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button 
                        disabled={isProcessing}
                        onClick={() => handleDeleteUser(user._id)}
                        style={buttonStyle('danger')}
                        className="btn-hover"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .user-row {
          transition: background-color 0.2s;
        }
        .user-row:hover {
          background-color: rgba(255, 255, 255, 0.02);
        }
        .btn-hover:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.2);
        }
        .btn-hover:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
