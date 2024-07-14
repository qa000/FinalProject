import React, { useState } from 'react';
import Tab from './Tab'; // 경로 확인
import './MyPage.css'; // 경로 확인

import UserInfo from './UserInfo'; // 경로 확인
import MyBook from './MyBook'; // 경로 확인

import Header from './Header'; // 경로 확인
import TabContent from './TabContent ';
import MyPay from './MyPay';
import MyBoard from './MyBoard';
import MyList from './MyList';
import UserEdit from './UserEdit';


function MyPage() {
  const [activeTab, setActiveTab] = useState('내 정보');
  const [isEditMode, setIsEditMode] = useState(false);

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleEditComplete = () => {
    setIsEditMode(false);
  };
  const tabs = [
    { label: '내 정보', content: isEditMode ? <UserEdit onEditComplete={handleEditComplete} /> : <UserInfo onEdit={handleEditClick} /> },
    { label: '내 책 정보', content: <MyBook /> },
    { label: '내 결제 정보', content: <MyPay /> },
    { label: '내 글 정보', content: <MyBoard /> },
    { label: '내 리스트 정보', content: <MyList /> },
  ];

  return (
    <>
    <div>
      <Header />
      <div className="myPage">
        <div className="tabs">
          {tabs.map((tab) => (
            <Tab 
              key={tab.label} 
              label={tab.label} 
              onClick={() => { setActiveTab(tab.label); setIsEditMode(false); }} 
              isActive={activeTab === tab.label}
            />
          ))}
        </div>
        <div className="content">
        {tabs.map((tab) => (
            activeTab === tab.label && <TabContent key={tab.label} content={tab.content} />
          ))}
        </div>
      </div>
        <footer className="main-footer">
        <p>&copy; 2024 Book Adventure. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}

export default MyPage;
