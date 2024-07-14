import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css'; // 스타일링을 위한 CSS 파일
import Header from './Header';

const Contact = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('');

        try {
            const response = await axios.post('http://localhost:5000/api/contact', {
                name,
                email,
                message
            });

            if (response.status === 200) {
                alert('문의가 성공적으로 전송되었습니다. 답변은 이메일로 전송드립니다.');
                setName('');
                setEmail('');
                setMessage('');
                navigate('/main'); // 알림 후 /main으로 이동
            } else {
                setStatus('메시지 전송에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('메시지 전송 중 오류 발생:', error);
            setStatus('메시지 전송 중 오류가 발생했습니다.');
        }
    };

    return (
        <div>
        <Header />
        <div className="contact-container">
            <h1>문의하기</h1>
            <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                    <label htmlFor="name">이름</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">이메일</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="message">메시지</label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                    ></textarea>
                </div>
                <button type="submit">전송</button>
            </form>
            {status && <p className="status-message">{status}</p>}
        </div>
        <footer className="main-footer">
        <p>&copy; 2024 Book Adventure. All rights reserved.</p>
      </footer>
        </div>
    );
};

export default Contact;
