import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    setLoading(true);
    const data = await api.getBookings();
    setBookings(data);
    setLoading(false);
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this booking?')) return;
    try {
      await api.approveBooking(id, 'Admin');
      toast.success('Booking approved!');
      loadBookings();
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejection:');
    if (reason === null) return;
    try {
      await api.rejectBooking(id, 'Admin', reason);
      toast.success('Booking rejected');
      loadBookings();
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  const filtered = bookings.filter(b => filter === 'all' || b.status === filter);
  const stats = {
    pending: bookings.filter(b => b.status === 'pending').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    rejected: bookings.filter(b => b.status === 'rejected').length,
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
      <h1>🔧 Admin Dashboard</h1>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.pending}</div>
          <div>Pending</div>
        </div>
        <div style={{ background: '#d1fae5', padding: '20px', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.approved}</div>
          <div>Approved</div>
        </div>
        <div style={{ background: '#fee2e2', padding: '20px', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.rejected}</div>
          <div>Rejected</div>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              marginRight: '8px',
              background: filter === f ? '#667eea' : '#f3f4f6',
              color: filter === f ? 'white' : 'black',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Time</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Requester</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Purpose</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(booking => (
              <tr key={booking.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{booking.booking_date}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{booking.time_slot_display}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                  {booking.requester_name}<br />
                  <small style={{ color: '#666' }}>{booking.requester_email}</small>
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{booking.purpose}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    background: booking.status === 'pending' ? '#fef3c7' : booking.status === 'approved' ? '#d1fae5' : '#fee2e2',
                  }}>
                    {booking.status}
                  </span>
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                  {booking.status === 'pending' && (
                    <>
                    // ...inside your booking table row...
<td>
  {/* Existing approve/reject buttons */}
  <button
    onClick={() => handleDelete(booking.id)}
    style={{
      padding: '6px 12px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginLeft: '8px'
    }}
  >
    Delete
  </button>
</td>
                      <button onClick={() => handleApprove(booking.id)} style={{ marginRight: '8px', padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
                      <button onClick={() => handleReject(booking.id)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✗</button>
                      {userBookings.map(booking => (<div key={booking.id}>
    <button onClick={() => handleDelete(booking.id)}style={{padding: '8px 16px',background: '#ef4444',color: 'white',border: 'none',borderRadius: '8px',cursor: 'pointer',marginLeft: '8px'}}>Delete</button>
  </div>
        ))}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
