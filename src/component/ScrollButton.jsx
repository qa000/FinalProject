import React from 'react';
import './scrollButton.css';

const ScrollButton = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="scroll-buttons">
      <button className="scroll-button up" onClick={scrollToTop}>
        ▲
      </button>
      <button className="scroll-button down" onClick={scrollToBottom}>
        ▼
      </button>
    </div>
  );
};

export default ScrollButton;
