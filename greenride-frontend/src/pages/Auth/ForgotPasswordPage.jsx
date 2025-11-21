import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemedBackground from '../../components/common/ThemedBackground';
import logo from '../../assets/images/logo.png';
import { forgotPassword } from '../../services/authService';
import './AuthPage.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    try {
      const result = await forgotPassword({ email });

      if (result.success) {
        setMessage('If an account with that email exists, a password reset link has been sent.');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedBackground showHeader={false}>
      <div className="auth-container">
        <div className="auth-logo-container">
          <img src={logo} alt="GreenRide Logo" className="auth-logo" />
          <h2 className="auth-title">Forgot Password</h2>
          <p className="auth-subtitle">Enter your email to reset your password</p>
        </div>

        {message && <div className="auth-success">{message}</div>}
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            className="auth-input"
          />
          <button type="submit" disabled={isSubmitting} className="auth-button">
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-link">
          Remember your password? <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </ThemedBackground>
  );
};

export default ForgotPasswordPage;
