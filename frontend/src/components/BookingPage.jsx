import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';

const TIME_SLOTS = [
  { id: 'slot1', name: 'Morning', display: '9:00 AM - 1:00 PM' },
  { id: 'slot2', name: 'Afternoon', display: '1:00 PM - 5:00 PM' },
  { id: 'slot3', name: 'Evening', display: '5:00 PM - 9:00 PM' },
];

export default function BookingPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availability, setAvailability] = useState({});
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate next 14 days
  const dates = Array.from({ length: 1 }, (_, i) => {
    const date = addDays(new Date(), i);
    return format(date, 'yyyy-MM-dd');
  });

  useEffect(() => {
    if (selectedDate) {
      api.getAvailability(selectedDate).then(setAvailability);
    }
  }, [selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot || !purpose) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.createBooking({
        requester_name: user.name,
        requester_email: user.email,
        booking_date: selectedDate,
        time_slot: selectedSlot,
        purpose,
        additional_notes: notes,
      });
      toast.success('Booking request submitted!');
      setPurpose('');
      setNotes('');
      setSelectedSlot('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit booking');
    }
    setLoading(false);

  const handleDelete = async (id) => {
  if (!window.confirm('Are you sure you want to delete this booking?')) return;
  try {
    await api.deleteBooking(id);
    toast.success('Booking deleted');
    // Reload bookings or update state as needed
  } catch (error) {
    toast.error(error.response?.data?.error || 'Failed to delete booking');
  }
};

  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <h1>📅 Book Audio Chamber</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '24px' }}>
          <label><strong>Select Date:</strong></label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            {dates.map((date) => (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDate(date)}
                style={{
                  padding: '8px 16px',
                  border: selectedDate === date ? '2px solid #667eea' : '1px solid #ddd',
                  borderRadius: '8px',
                  background: selectedDate === date ? '#667eea' : 'white',
                  color: selectedDate === date ? 'white' : 'black',
                  cursor: 'pointer',
                }}
              >
                {format(new Date(date), 'MMM d')}
              </button>
            ))}
          </div>
        </div>

        {selectedDate && (
          <div style={{ marginBottom: '24px' }}>
            <label><strong>Select Time Slot:</strong></label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
              {TIME_SLOTS.map((slot) => {
                const slotAvail = availability[slot.id];
                const isAvailable = !slotAvail || slotAvail.available;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => isAvailable && setSelectedSlot(slot.id)}
                    disabled={!isAvailable}
                    style={{
                      padding: '16px 24px',
                      border: selectedSlot === slot.id ? '2px solid #667eea' : '1px solid #ddd',
                      borderRadius: '8px',
                      background: !isAvailable ? '#f3f4f6' : selectedSlot === slot.id ? '#667eea' : 'white',
                      color: !isAvailable ? '#9ca3af' : selectedSlot === slot.id ? 'white' : 'black',
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      opacity: isAvailable ? 1 : 0.6,
                    }}
                  >
                    <div><strong>{slot.name}</strong></div>
                    <div style={{ fontSize: '14px' }}>{slot.display}</div>
                    {!isAvailable && <div style={{ fontSize: '12px', color: '#dc2626' }}>Booked</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label><strong>Purpose:</strong></label>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Describe the purpose of your booking..."
            style={{ width: '100%', padding: '12px', marginTop: '8px', minHeight: '80px', borderRadius: '8px', border: '1px solid #ddd' }}
            required
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label><strong>Additional Notes (optional):</strong></label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requirements..."
            style={{ width: '100%', padding: '12px', marginTop: '8px', minHeight: '60px', borderRadius: '8px', border: '1px solid #ddd' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !selectedDate || !selectedSlot || !purpose}
          style={{
            width: '100%',
            padding: '16px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Submitting...' : 'Submit Booking Request'}
        </button>
  <button onClick={() => handleDelete(booking.id)} style={{ ...}}>
  Delete
  </button>

      </form>
    </div>
  );
}
