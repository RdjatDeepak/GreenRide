import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import './Header.css';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getWelcomeMessage = () => {
    if (!user) return '';
    if (user.roles?.includes('ROLE_ADMIN')) return 'Admin';
    if (user.roles?.includes('ROLE_DRIVER')) return 'Driver';
    return 'Passenger';
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-container">
          <img src={logo} alt="GreenRide Logo" className="logo" />
          <h1 className="app-title">GreenRide</h1>
        </div>
        {isAuthenticated && (
          <div className="header-actions">
            <span className="user-welcome">Welcome, {user?.name || user?.email}</span>
            <span className="user-role">({getWelcomeMessage()})</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

