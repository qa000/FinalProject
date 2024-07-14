import React from 'react';
import './MyPage.css'; 

function Tab({ label, onClick, isActive }) {
  return (
    <button 
      onClick={onClick} 
      className={`tab ${isActive ? 'active' : ''}`}
    >
      {label}
    </button>
  );
}

export default Tab;
