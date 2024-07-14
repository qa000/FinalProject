import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './MyPage.css'; // CSS 파일을 불러옵니다

const MyPay = () => {
    const [paymentInfo, setPaymentInfo] = useState([]);
    const [reservationInfo, setReservationInfo] = useState([]);
    const [currentPaymentPage, setCurrentPaymentPage] = useState(1);
    const [currentReservationPage, setCurrentReservationPage] = useState(1);
    const itemsPerPage = 3; // 페이지당 항목 수

    useEffect(() => {
        fetchPaymentInfo();
        fetchReservationInfo();
    }, []);

    const fetchPaymentInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('로그인이 필요합니다.');
                return;
            }

            const response = await axios.get('http://localhost:5000/api/payment-info', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPaymentInfo(response.data);
        } catch (error) {
            console.error('결제 정보를 가져오는 중 오류가 발생했습니다:', error);
        }
    };

    const fetchReservationInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('로그인이 필요합니다.');
                return;
            }

            const response = await axios.get('http://localhost:5000/api/reservation-info', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReservationInfo(response.data);
        } catch (error) {
            console.error('예약 정보를 가져오는 중 오류가 발생했습니다:', error);
        }
    };

    const handleCancelPayment = async (merchant_uid) => {
        const reason = prompt('결제 취소 사유를 입력하세요:');
        if (!reason) {
            alert('결제 취소 사유를 입력해야 합니다.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('로그인이 필요합니다.');
                return;
            }

            await axios.post(
                'http://localhost:5000/api/cancel-payment',
                { merchant_uid, reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('결제가 취소되었습니다.');
            fetchPaymentInfo(); // 결제 취소 후 결제 정보 갱신
        } catch (error) {
            console.error('결제 취소 중 오류가 발생했습니다:', error);
            alert(error.response ? error.response.data : '결제 취소에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const handleCancelReservation = async (reservation_id, merchant_uid) => {
        const reason = prompt('예약 취소 사유를 입력하세요:');
        if (!reason) {
            alert('예약 취소 사유를 입력해야 합니다.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('로그인이 필요합니다.');
                return;
            }

            await axios.post(
                'http://localhost:5000/api/cancel-reservation',
                { reservation_id, reason, merchant_uid },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('예약이 취소되었습니다.');
            fetchReservationInfo(); // 예약 취소 후 예약 정보 갱신
        } catch (error) {
            console.error('예약 취소 중 오류가 발생했습니다:', error);
            alert(error.response ? error.response.data : '예약 취소에 실패했습니다. 다시 시도해주세요.');
        }
    };

    // 페이지네이션을 위한 변수
    const indexOfLastPayment = currentPaymentPage * itemsPerPage;
    const indexOfFirstPayment = indexOfLastPayment - itemsPerPage;
    const currentPayments = paymentInfo.slice(indexOfFirstPayment, indexOfLastPayment);

    const indexOfLastReservation = currentReservationPage * itemsPerPage;
    const indexOfFirstReservation = indexOfLastReservation - itemsPerPage;
    const currentReservations = reservationInfo.slice(indexOfFirstReservation, indexOfLastReservation);

    const totalPaymentPages = Math.ceil(paymentInfo.length / itemsPerPage);
    const totalReservationPages = Math.ceil(reservationInfo.length / itemsPerPage);

    return (
        <div className="my-pay-container">
            <div className="payment-section">
                <h1>내 책 결제 정보</h1>
                {paymentInfo.length > 0 ? (
                    <>
                        <ul>
                            {currentPayments.map((payment) => (
                                <li key={payment.id}>
                                    <p>제목: {payment.title}</p>
                                    <p>금액: ₩{payment.amount}</p>
                                    <p>상태: {payment.status}</p>
                                    <p>날짜: {new Date(payment.created_at).toLocaleDateString()}</p>
                                    {payment.status !== '결제 취소' && (
                                        <button onClick={() => handleCancelPayment(payment.merchant_uid)}>
                                            결제 취소
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                        <div className="mypage-pagination">
                            <button
                                onClick={() => setCurrentPaymentPage(currentPaymentPage - 1)}
                                disabled={currentPaymentPage === 1}
                            >
                                &lt; 이전
                            </button>
                            <span>{currentPaymentPage}</span>
                            <button
                                onClick={() => setCurrentPaymentPage(currentPaymentPage + 1)}
                                disabled={currentPaymentPage === totalPaymentPages}
                            >
                                다음 &gt;
                            </button>
                        </div>
                    </>
                ) : (
                    <p>결제 정보가 없습니다.</p>
                )}
            </div>

            <div className="reservation-section">
                <h1>내 공연 예약 정보</h1>
                {reservationInfo.length > 0 ? (
                    <>
                        <ul>
                            {currentReservations.map((reservation) => (
                                <li key={reservation.id}>
                                    <p>공연 제목: {reservation.concert_title}</p>
                                    <p>좌석: {reservation.seats}</p>
                                    <p>총 금액: ₩{reservation.total_price}</p>
                                    <p>상태: {reservation.status}</p>
                                    <p>예약 날짜: {new Date(reservation.reserved_at).toLocaleDateString()}</p>
                                    {reservation.status !== '예약 취소' && (
                                        <button onClick={() => handleCancelReservation(reservation.id, reservation.merchant_uid)}>
                                            예약 취소
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                        <div className="mypage-pagination">
                            <button
                                onClick={() => setCurrentReservationPage(currentReservationPage - 1)}
                                disabled={currentReservationPage === 1}
                            >
                                &lt; 이전
                            </button>
                            <span>{currentReservationPage}</span>
                            <button
                                onClick={() => setCurrentReservationPage(currentReservationPage + 1)}
                                disabled={currentReservationPage === totalReservationPages}
                            >
                                다음 &gt;
                            </button>
                        </div>
                    </>
                ) : (
                    <p>예약 정보가 없습니다.</p>
                )}
            </div>
        </div>
    );
};

export default MyPay;
