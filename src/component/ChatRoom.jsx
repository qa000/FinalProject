import React, { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { FaPaw } from 'react-icons/fa';
import './ChatRoom.css';
import Header from './Header';
import { useNavigate } from 'react-router-dom';

var stompClient = null;

const ChatRoom = () => {
    const navigate = useNavigate();
    const [publicChats, setPublicChats] = useState(() => {
        const savedChats = localStorage.getItem(`publicChats_${localStorage.getItem('userId')}`);
        return savedChats ? JSON.parse(savedChats) : [];
    });
    const [notices, setNotices] = useState([]);
    const [latestNotice, setLatestNotice] = useState(null); // 최신 공지 상태
    const [showNotice, setShowNotice] = useState(false); // 공지 팝업 표시 여부
    const [clearTimes, setClearTimes] = useState(() => {
        const savedTimes = localStorage.getItem('clearTimes');
        return savedTimes ? JSON.parse(savedTimes) : {};
    });
    const [userData, setUserData] = useState({
        username: localStorage.getItem('userId') || '',
        receivername: 'admin',
        connected: false,
        message: ''
    });
    const [showOptions, setShowOptions] = useState(false);
    const [hideNotices, setHideNotices] = useState(() => {
        return JSON.parse(localStorage.getItem('hideNotices')) || false;
    });

    const messagesEndRef = useRef(null);

    useEffect(() => {
        // 페이지 로드 시 로그인 상태 확인
        const token = localStorage.getItem('token');
        if (!token) {
            alert('로그인 후 이용해주세요');
            navigate('/login');
            return;
        }

        if (userData.username && !userData.connected) {
            connect();
        }
    }, [userData.username]);

    useEffect(() => {
        localStorage.setItem(`publicChats_${userData.username}`, JSON.stringify(publicChats));
    }, [publicChats, userData.username]);

    useEffect(() => {
        scrollToBottom();
    }, [publicChats, showNotice]);

    useEffect(() => {
        localStorage.setItem('clearTimes', JSON.stringify(clearTimes));
    }, [clearTimes]);

    useEffect(() => {
        localStorage.setItem('hideNotices', JSON.stringify(hideNotices));
    }, [hideNotices]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const connect = () => {
        let Sock = new SockJS('http://localhost:9091/ws');
        stompClient = new Client({
            webSocketFactory: () => Sock,
            onConnect: onConnected,
            onStompError: onError
        });
        stompClient.activate();
    }

    const onConnected = () => {
        setUserData({ ...userData, connected: true });
        stompClient.subscribe('/chatroom/public', onMessageReceived);
        stompClient.subscribe('/user/' + userData.username + '/private', onPrivateMessage);
        stompClient.subscribe('/topic/notice', onNoticeReceived); // 공지사항 구독
        userJoin();
        fetchNotices();
        scrollToBottom(); // 채팅방 연결 후 스크롤 이동
    }

    const userJoin = () => {
        var chatMessage = {
            senderName: userData.username,
            status: "JOIN"
        };
        stompClient.publish({ destination: "/app/message", body: JSON.stringify(chatMessage) });

        const lastWelcomeTime = localStorage.getItem('lastWelcomeTime');
        const now = new Date().toISOString();

        if (!lastWelcomeTime || new Date(now) - new Date(lastWelcomeTime) > 24 * 60 * 60 * 1000) {
            var welcomeMessage = {
                senderName: '고양이의 발자국',
                receiverName: userData.username,
                message: `${userData.username} 님 환영합니다.`,
                status: "MESSAGE",
                time: new Date().toISOString()
            };
            stompClient.publish({ destination: "/app/private-message", body: JSON.stringify(welcomeMessage) });
            localStorage.setItem('lastWelcomeTime', now);
        }
    }

    const fetchNotices = async () => {
        try {
            const response = await fetch('http://localhost:9091/api/notices');
            const data = await response.json();
            setNotices(data);
            if (data.length > 0) {
                const dismissedNotice = JSON.parse(localStorage.getItem('dismissedNotice') || '{}');
                if (!dismissedNotice.id || dismissedNotice.id !== data[data.length - 1].id || new Date(dismissedNotice.time) < new Date(data[data.length - 1].time)) {
                    setLatestNotice(data[data.length - 1]); // 최신 공지 설정
                    setShowNotice(true); // 새 공지 표시
                }
            }
        } catch (error) {
            console.error('Failed to fetch notices:', error);
        }
    };

    const formatTime = (timeString, includeSeconds = false) => {
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        if (includeSeconds) {
            options.second = '2-digit';
        }
        return new Date(timeString).toLocaleString('ko-KR', options);
    };

    const onMessageReceived = (payload) => {
        var payloadData = JSON.parse(payload.body);
        payloadData.time = formatTime(new Date().toISOString(), true);
        if (clearTimes['publicChats'] && new Date(payloadData.time) < new Date(clearTimes['publicChats'])) {
            return; // Skip messages before the clear time
        }
        setPublicChats(prevChats => [...prevChats, payloadData]);
        scrollToBottom(); // 새로운 메시지 수신 시 스크롤 이동
    }

    const onNoticeReceived = (payload) => {
        var payloadData = JSON.parse(payload.body);
        payloadData.time = formatTime(new Date().toISOString(), true);
        const dismissedNotice = JSON.parse(localStorage.getItem('dismissedNotice') || '{}');
        if (!dismissedNotice.id || dismissedNotice.id !== payloadData.id || new Date(dismissedNotice.time) < new Date(payloadData.time)) {
            setNotices(prevNotices => [...prevNotices, payloadData]);
            setLatestNotice(payloadData); // 최신 공지 업데이트
            setShowNotice(true); // 새 공지 표시
        }
    }

    const onPrivateMessage = (payload) => {
        var payloadData = JSON.parse(payload.body);
        payloadData.time = formatTime(new Date().toISOString(), true);
        if (!clearTimes['publicChats'] || new Date(payloadData.time) > new Date(clearTimes['publicChats'])) {
            setPublicChats(prevChats => [...prevChats, payloadData]);
        }
        scrollToBottom(); // 새로운 메시지 수신 시 스크롤 이동
    }

    const onError = (err) => {
        console.log(err);
    }

    const handleMessage = (event) => {
        const { value } = event.target;
        setUserData({ ...userData, message: value });
    }

    const sendPrivateValue = () => {
        if (stompClient && stompClient.connected) {
            var chatMessage = {
                senderName: userData.username,
                receiverName: 'admin',
                message: userData.message,
                status: "MESSAGE",
                time: new Date().toISOString()
            };

            if (!clearTimes['publicChats'] || new Date(chatMessage.time) > new Date(clearTimes['publicChats'])) {
                setPublicChats(prevChats => [...prevChats, chatMessage]);
            }

            stompClient.publish({ destination: "/app/private-message", body: JSON.stringify(chatMessage) });
            setUserData({ ...userData, message: "" });
            scrollToBottom(); // 메시지 전송 후 스크롤 이동
        } else {
            console.log('WebSocket is not connected.');
        }
    }

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            sendPrivateValue();
        }
    };

    const clearChat = () => {
        const now = new Date().toISOString();
        setClearTimes(prevTimes => ({ ...prevTimes, ['publicChats']: now }));
        setPublicChats([]);
        localStorage.setItem('clearTimes', JSON.stringify({ ...clearTimes, ['publicChats']: now }));
        scrollToBottom(); // 채팅 지운 후 스크롤 이동
    };

    const endChat = () => {
        localStorage.setItem('lastLogout', new Date().toISOString());
        setUserData({ ...userData, connected: false });
        setPublicChats([]);
        localStorage.removeItem(`publicChats_${userData.username}`);
        if (stompClient) stompClient.deactivate();
        navigate('/main');
    };

    const toggleOptions = () => {
        setShowOptions(!showOptions);
        if (showNotice) {
            setShowNotice(false);
        } else {
            setShowNotice(true);
        }
    };

    const closeNotice = () => {
        if (latestNotice) {
            localStorage.setItem('dismissedNotice', JSON.stringify({ id: latestNotice.id, time: new Date().toISOString() }));
        }
        setShowNotice(false);
    };

    const toggleHideNotices = () => {
        setHideNotices(!hideNotices);
    };

    return (
        <div className="CRcontainer">
            <Header />
            {userData.connected ?
                <div className="CRchat-box">
                    <div className="CRchat-header">
                        <div className="CRchat-title">
                            <span>고양이의 발자국 고객 문의</span>
                            <span className="CRoperating-hours">(운영시간 오전 9:30 ~ 오후 6:00, 주말 휴무)</span>
                        </div>
                        <div className="CRoptions-container">
                            <FaPaw className="CRcat-paw-icon" onClick={toggleOptions} />
                            {showOptions && (
                                <div className="CRoptions-menu">
                                    <button onClick={clearChat} className="CRoptions-button">Clear Chat</button>
                                    <button onClick={endChat} className="CRoptions-button">나가기</button>
                                    <button onClick={toggleHideNotices} className="CRoptions-button">{hideNotices ? '공지' : '공지 숨기기'}</button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="CRreact-icon-background">
                        <FaPaw className="CRreact-icon" />
                    </div>
                    {showNotice && latestNotice && (
                        <div className="CRpopup">
                            <div className="CRpopup-header">
                                <div className="CRpopup-title">공지</div>
                                <button className="CRpopup-close" onClick={closeNotice}>✕</button>
                            </div>
                            <div className="CRpopup-separator"></div> 
                            <div className="CRpopup-content">
                                <div className="CRpopup-notice">
                                    <div className="CRmessage-text">{latestNotice.message}</div>
                                    <div className="CRmessage-time">{latestNotice.date}</div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="CRchat-content">
                        <ul className="CRchat-messages">
                            {!hideNotices && notices.map((notice, index) => (
                                <li className="CRnotice" key={index}>
                                    <span className="CRmessage-sender">공지</span>
                                    <div className="CRmessage-bubble">
                                        <div className="CRmessage-text">{notice.message}</div>
                                        <div className="CRmessage-time">{formatTime(notice.date, false)}</div>
                                    </div>
                                </li>
                            ))}
                            {publicChats.map((chat, index) => (
                                chat.status !== "JOIN" && (
                                    <li className={`CRmessage ${chat.senderName === userData.username ? "self" : "other"}`} key={index}>
                                        <span className="CRmessage-sender">{chat.senderName === 'admin' ? '고양이의 발자국' : chat.senderName}</span>
                                        <div className={`CRmessage-bubble ${chat.senderName === userData.username ? 'self' : 'other'}`}>
                                            <div className="CRmessage-text">{chat.message}</div>
                                            <div className="CRmessage-time">{formatTime(chat.time, false)}</div>
                                        </div>
                                    </li>
                                )
                            ))}
                            <div ref={messagesEndRef} />
                        </ul>
                        <div className="CRsend-message">
                            <input type="text" className="CRinput-message" placeholder="욕설, 비방글 입력금지" value={userData.message} onChange={handleMessage} onKeyPress={handleKeyPress} />
                            <button type="button" className="CRsend-button" onClick={sendPrivateValue}><FaPaw /></button>
                        </div>
                    </div>
                </div>
                :
                <div className="CRregister">
                    <p>Connecting as {userData.username}...</p>
                </div>}
        </div>
    )
}

export default ChatRoom;
