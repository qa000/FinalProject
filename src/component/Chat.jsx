
import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useNavigate } from 'react-router-dom';
import './Chat.css'; 

function Chat({ selectedUser, initialMessages }) {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState(initialMessages || []);
  const [showOptions, setShowOptions] = useState(false);
  const stompClient = useRef(null);
  const isAdmin = username === 'admin';
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUsername(storedUserId);
      setIsConnected(true);
    }

    if (!isAdmin) {
      const storedMessages = JSON.parse(localStorage.getItem(`messages_${storedUserId}`)) || [];
      setMessages(storedMessages);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isConnected) {
      const socket = new SockJS('http://localhost:9091/ws');
      stompClient.current = new Client({
        webSocketFactory: () => socket,
        debug: (str) => {
          console.log(str);
        },
        onConnect: (frame) => {
          if (isAdmin) {
            stompClient.current.subscribe('/topic/public', (messageOutput) => {
              const message = JSON.parse(messageOutput.body);
              if (message.sender === selectedUser || message.receiver === selectedUser) {
                setMessages((prevMessages) => {
                  const updatedMessages = [...prevMessages, message];
                  localStorage.setItem(`messages_${selectedUser}`, JSON.stringify(updatedMessages));
                  return updatedMessages;
                });
              }
            });
          } else {
            stompClient.current.subscribe(`/user/${username}/queue/messages`, (messageOutput) => {
              const message = JSON.parse(messageOutput.body);
              setMessages((prevMessages) => {
                const updatedMessages = [...prevMessages, message];
                localStorage.setItem(`messages_${username}`, JSON.stringify(updatedMessages));
                return updatedMessages;
              });
            });
          }

          stompClient.current.publish({
            destination: '/app/chat.addUser',
            body: JSON.stringify({ sender: username, type: 'JOIN' }),
          });
          setShowOptions(true);
        },
        onDisconnect: () => {
          console.log('Disconnected');
        },
      });

      stompClient.current.activate();

      return () => {
        stompClient.current.deactivate();
      };
    }
  }, [isConnected, username, isAdmin, selectedUser]);

  // 자동 스크롤 
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (selectedUser && isAdmin) {
      const storedMessages = JSON.parse(localStorage.getItem(`messages_${selectedUser}`)) || [];
      setMessages(storedMessages);
    }
  }, [selectedUser, isAdmin]);

  useEffect(() => {
    // 채팅이 시작 환영~
    if (messages.length === 0) {
      const welcomeMessage = {
        sender: '고양이의 발자국',
        content: '무엇을 도와드릴까요?',
        type: 'CHAT',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const handleOptionSelect = (option) => {
    let responseMessage;
    switch (option) {
      case 1:
        responseMessage = '비밀번호를 찾기 위한 절차는 다음과 같습니다...';
        break;
      case 2:
        responseMessage = '환불 절차에 대해 안내드리겠습니다...';
        break;
      case 3:
        responseMessage = '배송 관련 문의에 대한 답변은 다음과 같습니다...';
        break;
      case 4:
        navigate('/chatroom'); // 관리자와의 채팅으로 이동
        return;
      default:
        responseMessage = '';
    }

    const chatMessage = {
      sender: '고양이의 발자국',
      content: responseMessage,
      type: 'CHAT',
      timestamp: new Date().toLocaleTimeString()
    };

    const optionMessage = {
      sender: username,
      content: optionMessageContent(option),
      type: 'CHAT',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, optionMessage, chatMessage];
      localStorage.setItem(`messages_${username}`, JSON.stringify(updatedMessages));
      return updatedMessages;
    });

    setShowOptions(false);
  };

  const optionMessageContent = (option) => {
    switch (option) {
      case 1:
        return '비밀번호를 잊어버렸어요';
      case 2:
        return '환불하고 싶어요';
      case 3:
        return '배송관련 문의입니다';
      case 4:
        return '실시간 문의';
      default:
        return '';
    }
  };

  const clearMessages = () => {
    if (isAdmin && selectedUser) {
      localStorage.removeItem(`messages_${selectedUser}`);
    } else {
      localStorage.removeItem(`messages_${username}`);
    }
    const welcomeMessage = {
      sender: '고양이의 발자국',
      content: '무엇을 도와드릴까요?',
      type: 'CHAT',
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages([welcomeMessage]);
    setShowOptions(true); 
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-avatar"></div>
        <div className="chat-title">😺고양이의 발자국😸</div>
      </div>
      <div className="chat-body">
        <div className="messages-container">
          {messages.filter(msg => isAdmin ? (msg.sender === selectedUser || msg.receiver === selectedUser) : true).map((msg, index) => (
            <div key={index} className={`message-box ${msg.sender === username ? 'right' : 'left'}`}>
              <p>{msg.sender}: {msg.content}</p>
              <span className="timestamp">
                {msg.timestamp || new Date().toLocaleTimeString()}
              </span>
            </div>
          ))}
          {showOptions && !isAdmin && (
            <div className="options-container">
              <button className="option-button" onClick={() => handleOptionSelect(1)}>1. 비밀번호를 잊어버렸어요</button>
              <button className="option-button" onClick={() => handleOptionSelect(2)}>2. 환불하고 싶어요</button>
              <button className="option-button" onClick={() => handleOptionSelect(3)}>3. 배송관련 문의입니다</button>
              <button className="option-button" onClick={() => handleOptionSelect(4)}>4. 실시간 문의</button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="chat-footer">
        <button onClick={clearMessages} className="chat-clear-button">문의 끝내기</button>
        <div className="footer-info">월요일 오전 9:30부터 운영한다냥~</div>
      </div>
    </div>
  );
}

export default Chat;




