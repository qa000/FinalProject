import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Concert.css';

const Seat = ({ concert, onClose, onComplete }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [seatStatus, setSeatStatus] = useState([]);

  useEffect(() => {
    const fetchSeatStatus = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/seats/${concert.id}`);
        setSeatStatus(response.data);
      } catch (error) {
        console.error('좌석 상태를 가져오는 중 오류가 발생했습니다:', error);
      }
    };

    fetchSeatStatus();
  }, [concert.id]);

  const handleSeatClick = (seat) => {
    if (seatStatus.find(s => s.seat_number === seat && s.is_reserved)) {
      alert('이미 예약된 좌석입니다.');
      return;
    }

    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seat));
      setTotalPrice(totalPrice - concert.price);
    } else {
      if (selectedSeats.length < 2) {
        setSelectedSeats([...selectedSeats, seat]);
        setTotalPrice(totalPrice + concert.price);
      } else {
        alert('좌석은 최대 2개까지 선택할 수 있습니다.');
      }
    }
  };

  const handleCompleteSelection = () => {
    onComplete({
      selectedSeats,
      totalPrice,
      concert_id: concert.id,
      title: concert.title,
      date: concert.date,
      location: concert.location
    });
    onClose(); // 모달 닫기
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="seat-selection-container">
          <div className="seat-selection-header">
            <h2>좌석 선택</h2>
            <button className="seat-close-button" onClick={onClose}>
              X
            </button>
          </div>
          <div className="seat-selection-body">
            <div className="seat-map">
              {['A', 'B', 'C', 'D', 'E'].map((row) => (
                <div key={row} className="seat-row">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((seat) => {
                    const seatNumber = `${row}${seat}`;
                    const isReserved = seatStatus.find(s => s.seat_number === seatNumber && s.is_reserved);
                    return (
                      <div
                        key={seat}
                        className={`seat ${selectedSeats.includes(seatNumber) ? 'selected' : ''} ${isReserved ? 'reserved' : ''}`}
                        onClick={() => handleSeatClick(seatNumber)}
                      >
                        {row}
                        {seat}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            
            <div className="seat-reservation-info">
            <hr />
              <h3>예매정보</h3>
              <p>일시: {new Date(concert.date).toLocaleDateString()}</p>
              <p>선택좌석: {selectedSeats.length}개</p>
              <p>티켓금액: ₩{totalPrice}</p>
              <button className='seat-select-button' onClick={handleCompleteSelection}>선택 완료</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Seat;
