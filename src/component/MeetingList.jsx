import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Meeting.css'; // CSS 파일 import
import Header from './Header';

const MeetingList = () => {
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/meetings');
        setMeetings(response.data);
      } catch (error) {
        console.error('Error fetching meetings:', error);
      }
    };

    fetchMeetings();
  }, []);

  const handleCreateMeeting = () => {
    navigate('/create-meeting');
  };

  const handleGroupChat = () => {
    navigate('/gchat');
  };

  return (
    <div>
      <Header />
      <div className="meeting-list">
        <h1>독서 모임</h1>
        <p>책을 읽고 서로의 생각을 나누며 풍부한 대화를 이어가는 독서 모임</p>
        
        <div className="meetings">
          {meetings.map((meeting) => (
            <div className="meeting-card" key={meeting.id}>
              <img src={`http://localhost:5000${meeting.imgSrc}`} alt={meeting.title} />
              <div className="meeting-info">
                <h2>{meeting.title}</h2>
                <p>{meeting.schedule}</p>
                <p>{meeting.leader}</p>
                <p>{meeting.firstBook}</p>
                <Link to={`/meeting/${meeting.id}`}>자세히 보기</Link>
              </div>
            </div>
          ))}
        </div>
        <div className="button-container">
          <button onClick={handleCreateMeeting}>모임 생성</button>
          <button onClick={handleGroupChat}>모임 채팅</button>
        </div>
      </div>
      <footer className="main-footer">
        <p>&copy; 2024 Book Adventure. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MeetingList;
