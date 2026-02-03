import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { format, addDays } from 'date-fns';
import axios from 'axios';

// ============ API Configuration ============
const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============ Auth Context ============
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

// ============ Styles ============
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  authPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  authBox: {
    background: 'white',
    padding: '40px',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '14px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  navbar: {
    background: 'white',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  slotButton: {
    padding: '16px 24px',
    margin: '8px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    textAlign: 'center',
  },
  dateButton: {
    padding: '10px 16px',
    margin: '4px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
  },
};

// ============ Components ============

// Login Page
function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      toast.success('Welcome!');
      navigate('/');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div style={styles.authPage}>
      <div style={styles.authBox}>
        <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>🎙️ Audio Chamber</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px' }}>Sign in to continue</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

// Register Page
function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);
    if (result.success) {
      toast.success('Account created!');
      navigate('/');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div style={styles.authPage}>
      <div style={styles.authBox}>
        <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>🎙️ Audio Chamber</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px' }}>Create your account</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

// Navbar
function Navbar() {
  const { user, logout } = useAuth();
  const isOwner = user?.role === 'owner' || user?.role === 'admin';

  return (
    <div style={styles.navbar}>
      <Link to="/" style={{ fontWeight: 'bold', fontSize: '18px', textDecoration: 'none', color: '#667eea' }}>
        🎙️ Audio Chamber
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isOwner && <Link to="/admin">Admin</Link>}
        <span>{user?.name}</span>
        <button onClick={logout} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ddd' }}>
          Logout
        </button>
      </div>
    </div>
  );
}

// Time Slots
const TIME_SLOTS = [
  { id: 'slot1', name: 'Morning', display: '9:00 AM - 1:00 PM' },
  { id: 'slot2', name: 'Afternoon', display: '1:00 PM - 5:00 PM' },
  { id: 'slot3', name: 'Evening', display: '5:00 PM - 9:00 PM' },
];

// Booking Page
function BookingPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availability, setAvailability] = useState({});
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const dates = Array.from({ length: 14 }, (_, i) => format(addDays(new Date(), i), 'yyyy-MM-dd'));

  useEffect(() => {
    if (selectedDate) {
      api.get(`/bookings/availability/${selectedDate}`)
        .then(res => setAvailability(res.data))
        .catch(console.error);
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
      await api.post('/bookings', {
        requester_name: user.name,
        requester_email: user.email,
        booking_date: selectedDate,
        time_slot: selectedSlot,
        purpose,
        additional_notes: notes,
      });
      toast.success('Booking submitted!');
      setPurpose('');
      setNotes('');
      setSelectedSlot('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h1>📅 Book Audio Chamber</h1>
      
      <div style={styles.card}>
        <h3>Select Date</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {dates.map(date => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              style={{
                ...styles.dateButton,
                background: selectedDate === date ? '#667eea' : 'white',
                color: selectedDate === date ? 'white' : 'black',
                borderColor: selectedDate === date ? '#667eea' : '#e5e7eb',
              }}
            >
              {format(new Date(date), 'MMM d')}
            </button>
          ))}
        </div>
      </div>

      {selectedDate && (
        <div style={styles.card}>
          <h3>Select Time Slot</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {TIME_SLOTS.map(slot => {
              const isAvailable = !availability[slot.id] || availability[slot.id].available;
              return (
                <button
                  key={slot.id}
                  onClick={() => isAvailable && setSelectedSlot(slot.id)}
                  disabled={!isAvailable}
                  style={{
                    ...styles.slotButton,
                    background: selectedSlot === slot.id ? '#667eea' : isAvailable ? 'white' : '#f3f4f6',
                    color: selectedSlot === slot.id ? 'white' : isAvailable ? 'black' : '#999',
                    borderColor: selectedSlot === slot.id ? '#667eea' : '#e5e7eb',
                    cursor: isAvailable ? 'pointer' : 'not-allowed',
                  }}
                >
                  <strong>{slot.name}</strong>
                  <div style={{ fontSize: '14px' }}>{slot.display}</div>
                  {!isAvailable && <div style={{ color: '#ef4444', fontSize: '12px' }}>Booked</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={styles.card}>
        <form onSubmit={handleSubmit}>
          <h3>Booking Details</h3>
          <p style={{ marginBottom: '16px', color: '#666' }}>
            Date: {selectedDate || 'Not selected'} | Slot: {TIME_SLOTS.find(s => s.id === selectedSlot)?.display || 'Not selected'}
          </p>
          
          <textarea
            placeholder="Purpose of booking *"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
            required
          />
          
          <textarea
            placeholder="Additional notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }}
          />
          
          <button
            type="submit"
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            disabled={loading || !selectedDate || !selectedSlot || !purpose}
          >
            {loading ? 'Submitting...' : 'Submit Booking Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Admin Dashboard
function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const loadBookings = () => {
    setLoading(true);
    api.get('/bookings')
      .then(res => setBookings(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBookings(); }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve?')) return;
    try {
      await api.post(`/bookings/${id}/approve`, { approved_by: 'Admin' });
      toast.success('Approved!');
      loadBookings();
    } catch (err) {
      toast.error('Failed');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason:');
    if (reason === null) return;
    try {
      await api.post(`/bookings/${id}/reject`, { rejected_by: 'Admin', reason });
      toast.success('Rejected');
      loadBookings();
    } catch (err) {
      toast.error('Failed');
    }
  };

  const filtered = bookings.filter(b => filter === 'all' || b.status === filter);
  const counts = {
    pending: bookings.filter(b => b.status === 'pending').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    rejected: bookings.filter(b => b.status === 'rejected').length,
  };

  return (
    <div style={styles.container}>
      <h1>🔧 Admin Dashboard</h1>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {[
          { key: 'pending', color: '#fef3c7' },
          { key: 'approved', color: '#d1fae5' },
          { key: 'rejected', color: '#fee2e2' },
        ].map(({ key, color }) => (
          <div key={key} style={{ ...styles.card, background: color, flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{counts[key]}</div>
            <div>{key.charAt(0).toUpperCase() + key.slice(1)}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '16px' }}>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              marginRight: '8px',
              border: 'none',
              borderRadius: '8px',
              background: filter === f ? '#667eea' : '#f3f4f6',
              color: filter === f ? 'white' : 'black',
              cursor: 'pointer',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        {loading ? (
          <p>Loading...</p>
        ) : filtered.length === 0 ? (
          <p>No bookings found</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Time</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Requester</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{b.booking_date}</td>
                  <td style={{ padding: '12px' }}>{b.time_slot_display}</td>
                  <td style={{ padding: '12px' }}>{b.requester_name}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      background: b.status === 'pending' ? '#fef3c7' : b.status === 'approved' ? '#d1fae5' : '#fee2e2',
                    }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {b.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(b.id)} style={{ marginRight: '8px', padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
                        <button onClick={() => handleReject(b.id)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✗</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Approval Page (for email links)
function ApprovalPage() {
  const { token } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/bookings/token/${token}`)
      .then(res => setBooking(res.data))
      .catch(() => toast.error('Not found'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleApprove = async () => {
    try {
      const res = await api.post(`/bookings/${booking.id}/approve`, { approved_by: 'Email' });
      setBooking(res.data.booking);
      toast.success('Approved!');
    } catch (err) {
      toast.error('Failed');
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Reason:');
    if (reason === null) return;
    try {
      const res = await api.post(`/bookings/${booking.id}/reject`, { rejected_by: 'Email', reason });
      setBooking(res.data.booking);
      toast.success('Rejected');
    } catch (err) {
      toast.error('Failed');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  if (!booking) return <div style={{ padding: '40px', textAlign: 'center' }}>Booking not found</div>;

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px' }}>
      <div style={styles.card}>
        <h2>Booking Approval</h2>
        <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
          <p><strong>Requester:</strong> {booking.requester_name}</p>
          <p><strong>Date:</strong> {booking.booking_date}</p>
          <p><strong>Time:</strong> {booking.time_slot_display}</p>
          <p><strong>Purpose:</strong> {booking.purpose}</p>
        </div>
        
        {booking.status === 'pending' ? (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleApprove} style={{ ...styles.button, background: '#10b981' }}>✓ Approve</button>
            <button onClick={handleReject} style={{ ...styles.button, background: '#ef4444' }}>✗ Reject</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '48px' }}>{booking.status === 'approved' ? '✅' : '❌'}</p>
            <p>This booking has been {booking.status}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Protected Route
function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles.length > 0 && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  
  return children;
}

// Main App
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/approve/:token" element={<ApprovalPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Navbar />
              <BookingPage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute roles={['owner', 'admin']}>
              <Navbar />
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;