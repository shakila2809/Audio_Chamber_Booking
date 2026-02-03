import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as api from '../services/api';

export default function ApprovalPage() {
  const { token } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBookingByToken(token)
      .then(setBooking)
      .catch(() => toast.error('Booking not found'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleApprove = async () => {
    try {
      const result = await api.approveBooking(booking.id, 'Email Approver');
      setBooking(result.booking);
      toast.success('Approved!');
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Reason:');
    if (reason === null) return;
    try {
      const result = await api.rejectBooking(booking.id, 'Email Approver', reason);
      setBooking(result.booking);
      toast.success('Rejected');
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  if (!booking) return <div style={{ textAlign: 'center', padding: '40px' }}>Booking not found</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
      <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h2>Booking Approval</h2>
        
        <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
          <p><strong>Requester:</strong> {booking.requester_name}</p>
          <p><strong>Email:</strong> {booking.requester_email}</p>
          <p><strong>Date:</strong> {booking.booking_date}</p>
          <p><strong>Time:</strong> {booking.time_slot_display}</p>
          <p><strong>Purpose:</strong> {booking.purpose}</p>
        </div>

        {booking.status === 'pending' ? (
          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={handleApprove} style={{ flex: 1, padding: '16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>
              ✓ Approve
            </button>
            <button onClick={handleReject} style={{ flex: 1, padding: '16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>
              ✗ Reject
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px' }}>{booking.status === 'approved' ? '✅' : '❌'}</div>
            <p>This booking has been {booking.status}</p>
            <Link to="/">Go to Booking Page</Link>
          </div>
        )}
      </div>
    </div>
  );
}