import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Concert.css';

const Reservation = ({ details, userInfo, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadIamport = () => {
      const script = document.createElement('script');
      script.src = 'https://cdn.iamport.kr/js/iamport.payment-1.2.0.js';
      script.async = true;
      document.body.appendChild(script);
    };

    loadIamport();
  }, []);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await axios.post('http://localhost:5000/api/pay', {
        ...details,
        amount: details.totalPrice,
        buyer_name: userInfo.name,
        buyer_email: userInfo.email,
        buyer_tel: userInfo.phone,
        buyer_addr: userInfo.address,
        buyer_postcode: "01181"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const { paymentData } = response.data;
        requestPay(paymentData);
      } else {
        alert('결제 준비에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('결제 처리 중 오류가 발생했습니다:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const requestPay = (paymentData) => {
    const { IMP } = window;
    IMP.init('imp78753568'); // 가맹점 식별코드

    IMP.request_pay(paymentData, async (rsp) => {
      if (rsp.success) {
        try {
          const token = localStorage.getItem('token');
          await saveReservation(rsp.merchant_uid);
          alert('결제가 완료되었습니다.');
          onClose();
        } catch (error) {
          console.error('예약 저장 중 오류가 발생했습니다:', error);
        }
      } else {
        console.log('결제 실패:', rsp.error_msg);
        alert(`결제에 실패했습니다. 다시 시도해주세요. 에러: ${rsp.error_msg}`);
      }
    });
  };

  const saveReservation = async (merchant_uid) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/save-reservation', {
        concert_id: details.concert_id,
        seats: details.selectedSeats,
        total_price: details.totalPrice,
        merchant_uid
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('예약 저장 중 오류가 발생했습니다:', error);
    }
  };

  return (
    <div className="reservation-container">
      <div className="reservation-details">
        <h2>예약 정보</h2>
        <p>콘서트: {details.title}</p>
        <p>일시: {new Date(details.date).toLocaleDateString()}</p>
        <p>장소: {details.location}</p>
        <p>선택 좌석: {details.selectedSeats.join(', ')}</p>
        <p>총 금액: ₩{details.totalPrice.toLocaleString('ko-KR')}</p>
      </div>
      <div className="user-info">
        <hr />
        <h2>사용자 정보</h2>
        <p>이름: {userInfo.name}</p>
        <p>이메일: {userInfo.email}</p>
        <p>전화번호: {userInfo.phone}</p>
      </div>
      <div className="button-container">
    <button className="payment-button" onClick={handlePayment} disabled={isProcessing}>
      {isProcessing ? '처리 중...' : '결제하기'}
    </button>
    <button className="cancel-button" onClick={onClose}>취소</button>
    </div>
    </div>
  );
};

export default Reservation;
