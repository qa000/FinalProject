import React, { useState, useEffect, lazy, Suspense } from 'react';
import axios from 'axios';
import './Concert.css';
import Header from './Header';
import { useNavigate } from 'react-router-dom';

const Seat = lazy(() => import('./Seat'));
const Reservation = lazy(() => import('./Reservation'));

const Concert = () => {
  const [concerts, setConcerts] = useState([]);
  const [selectedConcert, setSelectedConcert] = useState(null);
  const [isSeatSelectionOpen, setIsSeatSelectionOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [reservationDetails, setReservationDetails] = useState({});
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConcerts();
    fetchUserInfo();
  }, []);

  const fetchConcerts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/concerts');
      setConcerts(response.data);
    } catch (error) {
      console.error('콘서트를 가져오는 중 오류가 발생했습니다:', error);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await axios.get('http://localhost:5000/user-info', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUserInfo(response.data);
    } catch (error) {
      console.error('사용자 정보를 가져오는 중 오류가 발생했습니다:', error);
    }
  };

  const handleConcertClick = (concert) => {
    setSelectedConcert(concert);
  };

  const handleReservation = (details) => {
    setReservationDetails({
      ...details,
      title: selectedConcert.title,
      date: selectedConcert.date,
      location: selectedConcert.location
    });
    setIsReservationOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedConcert(null);
  };

  const handleCloseSeatSelection = () => {
    setIsSeatSelectionOpen(false);
  };

  const handleCloseReservation = () => {
    setIsReservationOpen(false);
  };

  const handleCreateConcert = () => {
    navigate('/create-concert'); // useNavigate 훅을 사용하여 경로 변경
  };

  const handleDeleteConcert = async (concertId) => {
    const confirmDelete = window.confirm('정말로 이 강연을 삭제하시겠습니까?');
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      await axios.delete(`http://localhost:5000/api/concerts/${concertId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      alert('강연이 성공적으로 삭제되었습니다.');
      fetchConcerts(); // 강연 목록 갱신
    } catch (error) {
      console.error('Error deleting concert:', error);
      alert('강연 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEditConcert = (concertId) => {
    navigate(`/edit-concert/${concertId}`);
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`;
  };

  return (
    <div>
      <Header />
      <div className="concert-container">
        <h1>독서 강연</h1>
        <div className="concert-list">
          {concerts.map((concert) => (
            <div key={concert.id} className="concert-item" onClick={() => handleConcertClick(concert)}>
              <img src={concert.imageUrl} alt={concert.title} />
              <h2>{concert.title}</h2>
              <p>{formatDateTime(concert.date)}</p>
              <p>강연자: {concert.speaker}</p>
              <p>가격: {concert.price}</p>
              {userInfo && userInfo.id === 'admin' && (
                <>
                  <button className="edit-concert-button" onClick={() => handleEditConcert(concert.id)}>
                    수정
                  </button>
                  <button className="delete-concert-button" onClick={() => handleDeleteConcert(concert.id)}>
                    삭제
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="create-concert-button-container">
          {userInfo && userInfo.id === 'admin' && (
            <button className="create-concert-button" onClick={handleCreateConcert}>
              강연 생성
            </button>
          )}
        </div>

        {selectedConcert && !isSeatSelectionOpen && !isReservationOpen && (
          <div className="concert-details">
            <button className="close-button" onClick={handleCloseDetails}>
              X
            </button>
            <img
              src={selectedConcert.imageUrl || '/uploads/default.jpg'}
              alt={selectedConcert.title}
              className="concert-details-image"
            />
            <div className="concert-details-info">
              <h2>{selectedConcert.title}</h2>
              <p>{formatDateTime(selectedConcert.date)}</p>
              <p>{selectedConcert.location}</p>
              <p>{selectedConcert.description}</p>
              <button className='seat-select-button' onClick={() => setIsSeatSelectionOpen(true)}>좌석 선택</button>
            </div>
          </div>
        )}
        {isSeatSelectionOpen && (
          <Suspense fallback={<div>Loading...</div>}>
            <div className="modal">
              <div className="modal-content">
                <Seat
                  concert={selectedConcert}
                  onClose={handleCloseSeatSelection}
                  onComplete={(details) => {
                    handleReservation(details);
                    setIsSeatSelectionOpen(false);
                  }}
                />
              </div>
            </div>
          </Suspense>
        )}
        {isReservationOpen && userInfo && (
          <Suspense fallback={<div>Loading...</div>}>
            <Reservation
              details={reservationDetails}
              userInfo={userInfo}
              onClose={handleCloseReservation}
            />
          </Suspense>
        )}
      </div>
      <footer className="main-footer">
        <p>&copy; 2024 Book Adventure. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Concert;
