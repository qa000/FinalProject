import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import './Pay.css';

const Payment = () => {
    const [userInfo, setUserInfo] = useState({});
    const [cartItems, setCartItems] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('No token found');
                    return;
                }

                const userId = JSON.parse(atob(token.split('.')[1])).id;

                const response = await axios.get('http://localhost:5000/member-info', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { userId }
                });
                setUserInfo(response.data);
            } catch (error) {
                console.error('Failed to fetch user info:', error);
            }
        };

        const fetchCartItems = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('No token found');
                    return;
                }

                const response = await axios.get('http://localhost:5000/cart-items', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCartItems(response.data);
            } catch (error) {
                console.error('Failed to fetch cart items:', error);
            }
        };

        const loadScript = (src, callback) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = src;
            script.onload = callback;
            document.head.appendChild(script);
        };

        loadScript('https://code.jquery.com/jquery-1.12.4.min.js', () => {
            loadScript('https://cdn.iamport.kr/js/iamport.payment-1.2.0.js', () => {
                if (window.IMP) {
                    window.IMP.init("imp78753568");
                } else {
                    console.error('Failed to load Iamport script.');
                }
            });
        });

        fetchUserInfo();
        fetchCartItems();
    }, []);

    const requestPay = () => {
        if (!userInfo.id) {
            console.error('userInfo.id is missing');
            return;
        }

        const newMerchantUid = "merchant_" + new Date().getTime();
        const itemsTitle = cartItems.map(item => item.title).join(', ');
        const amount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

        if (!window.IMP) {
            console.error('IMP is not defined');
            return;
        }

        window.IMP.request_pay({
            pg: "html5_inicis",
            pay_method: "card",
            merchant_uid: newMerchantUid,
            name: itemsTitle,
            amount: amount,
            buyer_email: userInfo.email,
            buyer_name: userInfo.name,
            buyer_tel: userInfo.phone,
            buyer_addr: userInfo.address,
            buyer_postcode: "01181",
            m_redirect_url: "http://localhost:3000/book"
        }, async (rsp) => {
            if (rsp.success || rsp.error_code) {
                console.log('Payment succeeded or bypassing error', rsp);
                try {
                    const token = localStorage.getItem('token');
                    const response = await axios.post('http://localhost:5000/api/save-payment', {
                        merchant_uid: newMerchantUid,
                        user_id: userInfo.id,
                        title: itemsTitle,
                        amount: amount,
                        buyer_email: userInfo.email,
                        buyer_name: userInfo.name,
                        buyer_tel: userInfo.phone,
                        buyer_addr: userInfo.address,
                        buyer_postcode: "01181",
                        status: '결제 완료'
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    alert('결제가 완료되었습니다.');
                    navigate('/book');
                } catch (error) {
                    console.error('Failed to save payment info:', error);
                }
            } else {
                console.log('Payment failed', rsp.error_msg);
                alert('결제에 실패했습니다. 다시 시도해주세요.');
            }
        });
    };

    return (
        <div>
            <Header />
            <div className="payment-container">
                <h2>주문/결제</h2>
                <hr />
                <div className="shipping-info">
                    <h3>배송지 정보</h3>
                    <p>주문자: {userInfo.name} </p>
                    <p>연락처: {userInfo.phone}</p>
                    <p>주소지: {userInfo.address}</p>
                </div>
                <hr />
                <div className="cart-items">
                    <h3>주문상품</h3>
                    
                    {cartItems.map((item) => (
                        <div className="pay-cart-item" key={item.id}>
                            <img src={item.coverimage} alt={item.title} />
                            <div className="pay-cart-item-details">
                                <h4>{item.title}</h4>
                                <p>수량: {item.quantity}</p>
                                <p>₩{item.price.toLocaleString('ko-KR')}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="pay-order-summary">
                    <p>최종 결제 금액: ₩{cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toLocaleString('ko-KR')}</p>
                </div>

                <div className='secure-checkout'>
                <button className='pay-checkout' onClick={requestPay}>결제하기</button>
                </div>
            </div>
            <footer className="main-footer">
             <p>&copy; 2024 Book Adventure. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Payment;
