import React, { useState, useEffect } from 'react';
import './Book.css';
import Sidebar from './Sidebar';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; 
import { FaShoppingCart } from 'react-icons/fa';

const Header = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserId(decodedToken.id);
      } catch (error) {
        console.error('토큰 디코딩 중 에러 발생:', error);
      }
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserId('');
    window.location.href = '/main'; 
  };

  return (
      <div>
        <header>
          <div className='title'>
            <Link to="/main" style={{ textDecoration: 'none', color: 'inherit' }}>
              <p>고양이의 발자국🐾</p>
            </Link>
          </div>
          <div className='user-id'>
            {userId && <span>{userId}님</span>}
          </div>
          <div className='cart-icon'>
            <Link to="/cart">
              <FaShoppingCart size={24} color="#333" />
            </Link>
          </div>
          <button className='sidebar-toggle' onClick={toggleSidebar}>
            MENU😺
          </button>
        </header>
        {isSidebarOpen && <Sidebar toggleSidebar={toggleSidebar} userId={userId} handleLogout={handleLogout} />}
      </div>
  );
};

export default Header;
