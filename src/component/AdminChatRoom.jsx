
import React, { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './AdminChatRoom.css';
import Header from './Header';
import { FaPaw } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

var stompClient = null;

const AdminChatRoom = () => {
    const [privateChats, setPrivateChats] = useState(() => {
        const savedChats = localStorage.getItem('privateChats');
        return savedChats ? new Map(JSON.parse(savedChats)) : new Map();
    });
    const [publicChats, setPublicChats] = useState(() => {
        const savedChats = localStorage.getItem('publicChats');
        return savedChats ? JSON.parse(savedChats) : [];
    });
    const [memoChats, setMemoChats] = useState(() => {
        const savedChats = localStorage.getItem('memoChats');
        return savedChats ? JSON.parse(savedChats) : [];
    });
    const [tab, setTab] = useState("공지사항");
    const [notices, setNotices] = useState(() => {
        const savedNotices = localStorage.getItem('notices');
        return savedNotices ? JSON.parse(savedNotices) : [];
    });
    const [latestNotice, setLatestNotice] = useState(() => {
        const savedNotices = localStorage.getItem('notices');
        const parsedNotices = savedNotices ? JSON.parse(savedNotices) : [];
        return parsedNotices.length > 0 ? parsedNotices[parsedNotices.length - 1] : null;
    });
    const [userData, setUserData] = useState({
        username: localStorage.getItem('userId') || '', 
        receivername: '',
        connected: false,
        message: ''
    });
    const [showOptions, setShowOptions] = useState({});
    const [clearTimes, setClearTimes] = useState(() => {
        const savedTimes = localStorage.getItem('clearTimes');
        return savedTimes ? JSON.parse(savedTimes) : {};
    });
    const navigate = useNavigate();

    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (userData.username !== 'admin') {
            alert('접근권한이 없습니다.');
            navigate('/main');
            return;
        }
        connect();
        fetchNotices(); // 추가: 컴포넌트가 마운트될 때 공지사항을 가져옴
    }, [userData.username]);

    useEffect(() => {
        localStorage.setItem('privateChats', JSON.stringify(Array.from(privateChats.entries())));
    }, [privateChats]);

    useEffect(() => {
        localStorage.setItem('publicChats', JSON.stringify(publicChats));
    }, [publicChats]);

    useEffect(() => {
        localStorage.setItem('memoChats', JSON.stringify(memoChats));
    }, [memoChats]);

    useEffect(() => {
        localStorage.setItem('notices', JSON.stringify(notices));
    }, [notices]);

    useEffect(() => {
        localStorage.setItem('clearTimes', JSON.stringify(clearTimes));
    }, [clearTimes]);

    useEffect(() => {
        scrollToBottom();
    }, [publicChats, privateChats, notices, memoChats]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchNotices = async () => {
        try {
            const response = await fetch('http://localhost:9091/api/notices');
            const data = await response.json();
            setNotices(data);
            if (data.length > 0) {
                setLatestNotice(data[data.length - 1]); // 최신 공지 설정
            }
            localStorage.setItem('notices', JSON.stringify(data)); // 로컬 스토리지에 저장
        } catch (error) {
            console.error('Failed to fetch notices:', error);
        }
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
        stompClient.subscribe('/chatroom/notice', onNoticeReceived);
        userJoin();
    }

    const userJoin = () => {
        var chatMessage = {
            senderName: userData.username,
            status: "JOIN"
        };
        stompClient.publish({destination: "/app/message", body: JSON.stringify(chatMessage)});
    }

    const onMessageReceived = (payload) => {
        var payloadData = JSON.parse(payload.body);
        payloadData.time = new Date().toISOString();
        if (clearTimes['실시간 문의 공지'] && new Date(payloadData.time) < new Date(clearTimes['실시간 문의 공지'])) {
            return; 
        }
        if (payloadData.senderName !== userData.username) {
            setPublicChats(prevChats => [...prevChats, payloadData]);
        }
    }

    const onPrivateMessage = (payload) => {
        var payloadData = JSON.parse(payload.body);
        payloadData.time = new Date().toISOString();
        if (clearTimes[payloadData.senderName] && new Date(payloadData.time) < new Date(clearTimes[payloadData.senderName])) {
            return; 
        }
        if (privateChats.get(payloadData.senderName)) {
            privateChats.get(payloadData.senderName).push(payloadData);
            setPrivateChats(new Map(privateChats));
        } else {
            let list = [];
            list.push(payloadData);
            privateChats.set(payloadData.senderName, list);
            setPrivateChats(new Map(privateChats));
        }
    }

    const onNoticeReceived = (payload) => {
        var payloadData = JSON.parse(payload.body);
        payloadData.time = new Date().toISOString();
        setNotices((prevNotices) => {
            const updatedNotices = [...prevNotices, payloadData];
            localStorage.setItem('notices', JSON.stringify(updatedNotices));
            return updatedNotices;
        });
        setLatestNotice(payloadData); 
    }

    const onError = (err) => {
        console.log(err);
    }

    const handleMessage = (event) => {
        const { value } = event.target;
        setUserData({ ...userData, message: value });
    }

    const sendValue = () => {
        if (userData.message.trim() !== "") {
            const now = new Date().toISOString();
            if (tab === "공지사항") {
                var notice = {
                    senderName: userData.username,
                    message: userData.message,
                    date: now
                };
                stompClient.publish({destination: "/app/notice", body: JSON.stringify(notice)});
                setNotices(prevNotices => [...prevNotices, notice]);
                localStorage.setItem('notices', JSON.stringify([...notices, notice])); 
                setUserData({ ...userData, message: "" });
            } else if (tab === "실시간 문의 공지") {
                var chatMessage = {
                    senderName: userData.username,
                    message: userData.message,
                    status: "MESSAGE",
                    tab: "실시간 문의 공지",
                    time: now
                };
                if (!clearTimes['실시간 문의 공지'] || new Date(now) > new Date(clearTimes['실시간 문의 공지'])) {
                    setPublicChats(prevChats => [...prevChats, chatMessage]);
                }
                stompClient.publish({destination: "/app/message", body: JSON.stringify(chatMessage)});
                setUserData({ ...userData, message: "" });
            } else if (tab === '고양이의 발자국') {
                var memoMessage = {
                    senderName: userData.username,
                    message: userData.message,
                    time: now
                };
                setMemoChats(prevChats => [...prevChats, memoMessage]);
                setUserData({ ...userData, message: "" });
            } else {
                var privateMessage = {
                    senderName: userData.username,
                    receiverName: tab,
                    message: userData.message,
                    status: "MESSAGE",
                    time: now
                };
                if (!clearTimes[tab] || new Date(now) > new Date(clearTimes[tab])) {
                    privateChats.get(tab).push(privateMessage);
                    setPrivateChats(new Map(privateChats));
                }
                stompClient.publish({destination: "/app/private-message", body: JSON.stringify(privateMessage)});
                setUserData({ ...userData, message: "" });
            }
        }
    }

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            sendValue();
        }
    };

    const clearChat = (tabToClear) => {
        const now = new Date().toISOString();
        if (tabToClear === "공지사항") {
            setClearTimes(prevTimes => ({ ...prevTimes, [tabToClear]: now }));
            setNotices([]);
            localStorage.setItem('notices', JSON.stringify([]));
        } else if (tabToClear === "실시간 문의 공지") {
            setClearTimes(prevTimes => ({ ...prevTimes, [tabToClear]: now }));
            setPublicChats([]);
        } else if (tabToClear === "고양이의 발자국") {
            setClearTimes(prevTimes => ({ ...prevTimes, [tabToClear]: now }));
            setMemoChats([]);
        } else {
            setClearTimes(prevTimes => ({ ...prevTimes, [tabToClear]: now }));
            privateChats.set(tabToClear, []);
            setPrivateChats(new Map(privateChats));
        }
    };

    const deleteChat = (tabToDelete) => {
        if (tabToDelete === "공지사항" || tabToDelete === "실시간 문의 공지" || tabToDelete === "고양이의 발자국") {
            alert("이 탭은 삭제할 수 없습니다.");
            return;
        }
        setPrivateChats(prevChats => {
            const newChats = new Map(prevChats);
            newChats.delete(tabToDelete);
            return newChats;
        });
        setTab("공지사항");
    };

    const toggleOptions = (tabName) => {
        setShowOptions(prevState => ({ ...prevState, [tabName]: !prevState[tabName] }));
    };

    const getDisplayName = (senderName) => {
        return senderName === 'admin' ? '고양이의 발자국' : senderName;
    }

    const filterChats = (chats, tabName) => {
        const clearTime = clearTimes[tabName];
        if (!clearTime) return chats;
        return chats.filter(chat => new Date(chat.time) > new Date(clearTime));
    };

    return (
        <div className="ACcontainer">
            <Header />
            {userData.connected ?
                <div className="ACchat-box">
                    <div className="ACmember-list">
                        <ul>
                            <li onClick={() => { setTab("공지사항") }} className={`ACmember ${tab === "공지사항" && "active"}`}>
                                <FaPaw className="AClist-icon" /> 공지사항
                            </li>
                            <li onClick={() => { setTab("실시간 문의 공지") }} className={`ACmember ${tab === "실시간 문의 공지" && "active"}`}>
                                <FaPaw className="AClist-icon" /> 실시간 문의 공지
                            </li>
                            <li onClick={() => { setTab("고양이의 발자국") }} className={`ACmember ${tab === "고양이의 발자국" && "active"}`}>
                                <FaPaw className="AClist-icon" /> 고양이의 발자국
                            </li>
                            {[...privateChats.keys()].map((name, index) => (
                                <li onClick={() => { setTab(name) }} className={`ACmember ${tab === name && "active"}`} key={index}>
                                    <FaPaw className="AClist-icon" /> {name}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="ACchat-content">
                        {latestNotice && (
                            <div className="AClatest-notice">
                                <span className="ACmessage-sender">공지</span>
                                <div className="ACmessage-bubble other">
                                    <div className="ACmessage-text">{latestNotice.message}</div>
                                    <div className="ACmessage-time">{latestNotice.date}</div>
                                </div>
                            </div>
                        )}
                        <ul className="ACchat-messages">
                            {tab === "공지사항" ? filterChats(notices, "공지사항").map((notice, index) => (
                                <li className="ACnotice" key={index}>
                                    <span className="ACmessage-sender">공지</span>
                                    <div className="ACmessage-bubble other">
                                        <div className="ACmessage-text">{notice.message}</div>
                                        <div className="ACmessage-time">{notice.date}</div>
                                    </div>
                                </li>
                            )) : tab === "실시간 문의 공지" ? filterChats(publicChats, "실시간 문의 공지").map((chat, index) => (
                                <li className={`ACmessage ${chat.senderName === userData.username ? "self" : "other"}`} key={index}>
                                    <span className="ACmessage-sender">{getDisplayName(chat.senderName)}</span>
                                    <div className={`ACmessage-bubble ${chat.senderName === userData.username ? 'self' : 'other'}`}>
                                        <div className="ACmessage-text">{chat.message}</div>
                                        <div className="ACmessage-time">{chat.time}</div>
                                    </div>
                                </li>
                            )) : tab === '고양이의 발자국' ? (
                                <>
                                    <li className="ACmessage other">
                                        <span className="ACmessage-sender">알림</span>
                                        <div className="ACmessage-bubble other">
                                            <div className="ACmessage-text">메모 공간입니다.</div>
                                        </div>
                                    </li>
                                    {memoChats.map((chat, index) => (
                                        <li className={`ACmessage self`} key={index}>
                                            <span className="ACmessage-sender">고양이의 발자국</span>
                                            <div className="ACmessage-bubble self">
                                                <div className="ACmessage-text">{chat.message}</div>
                                                <div className="ACmessage-time">{chat.time}</div>
                                            </div>
                                        </li>
                                    ))}
                                </>
                            ) : filterChats(privateChats.get(tab) || [], tab).map((chat, index) => (
                                <li className={`ACmessage ${chat.senderName === userData.username ? "self" : "other"}`} key={index}>
                                    <span className="ACmessage-sender">{getDisplayName(chat.senderName)}</span>
                                    <div className={`ACmessage-bubble ${chat.senderName === userData.username ? 'self' : 'other'}`}>
                                        <div className="ACmessage-text">{chat.message}</div>
                                        <div className="ACmessage-time">{chat.time}</div>
                                    </div>
                                </li>
                            ))}
                            <div ref={messagesEndRef} />
                        </ul>
                        <div className="ACsend-message">
                            <input type="text" className="ACinput-message" placeholder="욕설,비방글 입력 금지" value={userData.message} onChange={handleMessage} onKeyPress={handleKeyPress} />
                            <button type="button" className="ACsend-button" onClick={sendValue}>
                                <FaPaw />
                            </button>
                        </div>
                    </div>
                    <div className="ACoptions-container">
                        <FaPaw className="ACcat-paw-icon" onClick={() => toggleOptions(tab)} />
                        {showOptions[tab] && (
                            <div className="ACoptions-menu">
                                <button onClick={() => clearChat(tab)} className="ACoptions-button">Clear Chat</button>
                                {tab !== "공지사항" && tab !== "실시간 문의 공지" && tab !== "고양이의 발자국" && (
                                    <button onClick={() => deleteChat(tab)} className="ACoptions-button">Delete</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                : null}
        </div>
    )
}

export default AdminChatRoom;
