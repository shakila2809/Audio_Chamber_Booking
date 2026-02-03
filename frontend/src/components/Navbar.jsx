import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const isOwner = ['owner', 'admin'].includes(user?.role);

  return (
    <nav style={{ background: 'white', padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ fontWeight: 'bold', fontSize: '18px', textDecoration: 'none', color: '#667eea' }}>
          🎙️ Audio Chamber
        </Link>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {isOwner && <Link to="/admin">Admin</Link>}
          <span>{user?.name}</span>
          <button onClick={logout} style={{ padding: '8px 16px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>
    </nav>
  );
}