import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import ThemedBackground from '../../components/common/ThemedBackground';
import logo from '../../assets/images/logo.png';
import './AuthPage.css';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, isAuthenticated, user, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any previous errors
    clearError();
    
    // Redirect if already authenticated
    if (isAuthenticated && user) {
      // Redirect based on user role
      if (user.roles?.includes('ROLE_ADMIN')) {
        navigate('/admin/dashboard');
      } else if (user.roles?.includes('ROLE_DRIVER')) {
        navigate('/drivers/home');
      } else {
        navigate('/home');
      }
    }
  }, [isAuthenticated, user, navigate, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await register({ name, email, password });
      
      if (result.success && result.user) {
        // Navigate based on user role from the result
        const userRoles = result.user.roles || [];
        if (userRoles.includes('ROLE_ADMIN')) {
          navigate('/admin/dashboard');
        } else if (userRoles.includes('ROLE_DRIVER')) {
          navigate('/drivers/home');
        } else {
          navigate('/home');
        }
      } else {
        setError(result.error || 'Registration failed. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedBackground showHeader={false}>
      <div className="auth-container">
        <div className="auth-logo-container">
          <img src={logo} alt="GreenRide Logo" className="auth-logo" />
          <h2 className="auth-title">Join GreenRide</h2>
          <p className="auth-subtitle">Start your eco-friendly journey today</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isSubmitting}
            className="auth-input"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            className="auth-input"
          />
          <input
            type="password"
            placeholder="Password (min. 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
            minLength={6}
            className="auth-input"
          />
          <button type="submit" disabled={isSubmitting} className="auth-button">
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <div className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </ThemedBackground>
  );
};

export default RegisterPage;
