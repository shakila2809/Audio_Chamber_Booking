import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleAuthCallback } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Authentication failed');
      navigate('/login');
      return;
    }

    if (token) {
      handleAuthCallback(token).then((result) => {
        if (result.success) {
          toast.success('Successfully logged in!');
          navigate('/');
        } else {
          navigate('/login');
        }
      });
    } else {
      navigate('/login');
    }
  }, [searchParams, handleAuthCallback, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <p>Completing authentication...</p>
      </div>
    </div>
  );
}