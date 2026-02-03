import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';
export default function RegisterPage() {
const { register, loginWithMicrosoft } = useAuth();
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
} else {
  toast.error(result.error);
}
};
return (
<div className="auth-page">
  <div className="auth-container">
    <h1>🎙️ Audio Chamber</h1>
    <p>Create your account</p>

    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />
      </div>

      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@meta.com"
          required
        />
      </div>

      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 6 characters"
          required
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Creating...' : 'Create Account'}
      </button>
    </form>

    <div className="divider"><span>or</span></div>

    <button className="btn btn-microsoft" onClick={loginWithMicrosoft}>
      Sign up with Microsoft
    </button>

    <p className="auth-footer">
      Already have an account? <Link to="/login">Sign in</Link>
    </p>
  </div>
</div>
);
}
