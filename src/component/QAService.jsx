
import React, { useState } from 'react';

import './QAService.css';
import { FaComments } from 'react-icons/fa';  // 오류-> npm install reac-icon
import ChatPopup from './ChapPopup';

const QAService = () => {
  const [showChatPopup, setShowChatPopup] = useState(false);

  const handleButtonClick = () => {
    setShowChatPopup(true);
  };

  const handleClosePopup = () => {
    setShowChatPopup(false);
  };

  return (
    <div>
      <div className="customer-service-button" onClick={handleButtonClick}>
        <div className="icon">
          <FaComments color="white" />  {/* 메시지 아이콘 사용했는데.. 수정해주세요*/}
        </div>
        <div className="text">실시간 문의하기</div>
      </div>
      {showChatPopup && <ChatPopup onClose={handleClosePopup} />}
    </div>
  );
};

export default QAService;
