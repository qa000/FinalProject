import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Meeting.css'; // CSS 파일 import
import Header from './Header';

const MeetingView = () => {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [isLeader, setIsLeader] = useState(false);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/meeting/${id}`);
        setMeeting(response.data);
        setIsLeader(response.data.leader === userId);
      } catch (error) {
        console.error('Error fetching meeting details:', error);
      }
    };

    fetchMeeting();
  }, [id, userId]);

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/meeting/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('모임이 삭제되었습니다.');
      navigate('/meeting');
    } catch (error) {
      console.error('Error deleting meeting:', error);
      alert('모임 삭제 중 오류가 발생했습니다.');
    }
  };

  if (!meeting) return <div>Meeting not found</div>;

  return (
    <div>
        <Header />
    <div id="meeting-view">
      <div className="meeting-view-header">
        <img src={`http://localhost:5000${meeting.imgSrc}`} alt={meeting.title} className="meeting-view-image" />
        <div className="meeting-view-info">
          <h1>{meeting.title}</h1>
          <p className="schedule">{meeting.schedule}</p>
          <p className="leader">리더: {meeting.leader}</p>
          <p className="first-book">{meeting.firstBook}</p>
         
        </div>
      </div>
      <div className="meeting-view-description">
        <p>{meeting.description}</p>
      </div>
      {isLeader && (
        <div>
          <button onClick={handleDelete} className="view-delete-button">모임 삭제</button>
          <Link to={`/meeting/modify/${meeting.id}`} className="view-edit-button"> 수정</Link>
        </div>
      )}

    </div>
    <footer className="main-footer">
      <p>&copy; 2024 Book Adventure. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MeetingView;
