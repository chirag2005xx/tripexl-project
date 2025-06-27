import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav style={{ background: '#333', padding: '1rem' }}>
      <ul style={{ display: 'flex', gap: '1rem', listStyle: 'none', margin: 0 }}>
        <li><Link to="/login" style={{ color: '#fff' }}>Login</Link></li>
        <li><Link to="/register" style={{ color: '#fff' }}>Register</Link></li>
        <li><Link to="/dashboard" style={{ color: '#fff' }}>Dashboard</Link></li>
        <li><Link to="/booking" style={{ color: '#fff' }}>Booking</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
