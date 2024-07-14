import React from 'react';
import './Book.css';

const Sidebar = ({ toggleSidebar, userId, handleLogout }) => {
  const confirmLogout = (e) => {
    e.preventDefault();
    if (window.confirm('로그아웃을 하시겠습니까?')) {
      handleLogout();
    }
  };


  const isAdmin = userId === 'admin';

  return (
    <div className="sidebar">
      <button className="close-btn" onClick={toggleSidebar}>×</button>
      <div className="sidebar-contents">
        <a href="/main">HOME</a>
        <a href="/book">BOOK</a>
        <a href='/UsedBookInfo'>USED</a>
        {userId ? (
          <>
          <a href="/board">BOARD</a>
          <a href="/meeting">MEETING</a>
          <a href="/concert">CONCERT</a>
          <a href="/playlists">BOOKPLI</a>
          <a href="/mypage">MY PAGE</a>
          {isAdmin && <a href="/admin">☆ADMIN PAGE☆</a>} {/* 관리자 페이지 링크 */}
          <a href="/login" onClick={confirmLogout}>LOGOUT</a>
          </>
        ) : (
          <a href="/login">LOGIN</a>
        )}
        <a href='/contact'>CONTACT</a>

        
      </div>
    </div>
  );
};

export default Sidebar;
