
import React from 'react';
import Chat from './Chat';
import './ChatPopup.css';

const ChatPopup = ({ onClose }) => {
  return (
    <div className="chat-popup-container">
      <div className="chat-popup">
        <div className="chat-popup-header">
         
          <button className="close-button" onClick={onClose}>X</button>
        </div>
        <div className="chat-body"> 
          <Chat />
        </div>
      </div>
    </div>
  );
};

export default ChatPopup;
