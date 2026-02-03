import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

import UserLoginPage from './components/auth/UserLoginPage';
import AdminLoginPage from './components/auth/AdminLoginPage';
import ProtectedRoute from './components/ProtectedRoute';

import BookingPage from './components/BookingPage';
import AdminDashboard from './components/AdminDashboard';
import Navbar from './components/Navbar';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<UserLoginPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navbar />
            <BookingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin', 'owner']}>
            <Navbar />
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Add other routes as needed */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
