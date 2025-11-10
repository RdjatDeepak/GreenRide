import React from 'react';
import Header from './Header';
import './ThemedBackground.css';

const ThemedBackground = ({ children, showHeader = true }) => {
  return (
    <div className="themed-background">
      {showHeader && <Header />}
      <div className={`content-wrapper ${!showHeader ? 'auth-wrapper' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default ThemedBackground;
