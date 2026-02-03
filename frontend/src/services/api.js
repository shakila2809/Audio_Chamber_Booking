import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Bookings API
export const getBookings = async (date = null) => {
  const params = date ? { date } : {};
  const response = await api.get('/bookings', { params });
  return response.data;
};

export const getAvailability = async (date) => {
  const response = await api.get(`/bookings/availability/${date}`);
  return response.data;
};

export const createBooking = async (data) => {
  const response = await api.post('/bookings', data);
  return response.data;
};

export const approveBooking = async (id, approvedBy) => {
  const response = await api.post(`/bookings/${id}/approve`, { approved_by: approvedBy });
  return response.data;
};

export const rejectBooking = async (id, rejectedBy, reason) => {
  const response = await api.post(`/bookings/${id}/reject`, { rejected_by: rejectedBy, reason });
  return response.data;
};

export const getBookingByToken = async (token) => {
  const response = await api.get(`/bookings/token/${token}`);
  return response.data;
};

// Auth API
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const getMicrosoftAuthUrl = async () => {
  const response = await api.get('/auth/microsoft');
  return response.data;
};

export const deleteBooking = async (id) => {
  const response = await api.delete(`/bookings/${id}`);
  return response.data;
};


export default api;
