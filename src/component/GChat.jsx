
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './GChat.css';
import Header from './Header';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { FaPaw } from 'react-icons/fa';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const GChat = () => {
  const [chatRooms, setChatRooms] = useState([]); // 모든 채팅방 목록
  const [selectedRoom, setSelectedRoom] = useState(null); // 선택된 채팅방
  const [roomData, setRoomData] = useState({
    roomName: '',
    roomDescription: ''
  }); // 새 채팅방 생성 데이터
  const [user, setUser] = useState(null); // 현재 사용자
  const [messages, setMessages] = useState({}); // 채팅 메시지
  const [newMessage, setNewMessage] = useState(''); // 새 메시지 입력
  const [stompClients, setStompClients] = useState({}); // WebSocket 클라이언트
  const [isCreatingRoom, setIsCreatingRoom] = useState(false); // 채팅방 생성 폼 표시 여부
  const [showOptions, setShowOptions] = useState(false); // 채팅방 옵션 메뉴 표시 여부
  const [showModal, setShowModal] = useState(false); // 채팅방 입장 확인 모달 표시 여부
  const [roomToJoin, setRoomToJoin] = useState(null); // 입장할 채팅방
  const [joinedRooms, setJoinedRooms] = useState([]); // 사용자가 입장한 채팅방 목록
  const [unreadMessages, setUnreadMessages] = useState({}); // 읽지 않은 메시지 수
  const [showMembersModal, setShowMembersModal] = useState(false); // 채팅방 멤버 목록 모달 표시 여부
  const [currentMembers, setCurrentMembers] = useState([]); // 현재 채팅방 멤버 목록
  const [activeTabs, setActiveTabs] = useState([]); // 활성화된 채팅방 탭
  const [showRoomDeletedModal, setShowRoomDeletedModal] = useState(false); // 채팅방 삭제 모달 표시 여부
  const [showDescriptionModal, setShowDescriptionModal] = useState(false); // 채팅방 설명 모달 표시 여부
  const [currentDescription, setCurrentDescription] = useState(''); // 현재 채팅방 설명

  const chatBoxRef = useRef(null); // 채팅 박스 참조
  const navigate = useNavigate(); // 네비게이트 객체

  // 초기 로드 시 사용자 정보와 채팅방 정보 불러오기
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const savedJoinedRooms = JSON.parse(localStorage.getItem(`joinedRooms_${userId}`)) || [];
    const savedActiveTabs = JSON.parse(localStorage.getItem(`activeTabs_${userId}`)) || [];
    const savedUnreadMessages = JSON.parse(localStorage.getItem(`unreadMessages_${userId}`)) || {};
    const savedMessages = JSON.parse(localStorage.getItem(`messages_${userId}`)) || {};
    const savedSelectedRoom = JSON.parse(localStorage.getItem(`selectedRoom_${userId}`)) || null;

    if (token && userId) {
      setUser({ id: userId });
      fetchChatRooms().then(() => {
        setJoinedRooms(savedJoinedRooms);
        setActiveTabs(savedActiveTabs);
        setUnreadMessages(savedUnreadMessages);
        setMessages(savedMessages);
        if (savedSelectedRoom) {
          const room = chatRooms.find(room => room.roomId === savedSelectedRoom);
          if (room) setSelectedRoom(room);
        }
      });
    }
  }, []);

  // 사용자가 입장한 채팅방마다 WebSocket 연결
  useEffect(() => {
    if (joinedRooms.length > 0) {
      joinedRooms.forEach((roomId) => connectToWebSocket(roomId));
    }
  }, [joinedRooms]);

  // 로컬 스토리지에 사용자가 입장한 채팅방 목록 저장
  useEffect(() => {
    if (user) {
      localStorage.setItem(`joinedRooms_${user.id}`, JSON.stringify(joinedRooms));
    }
  }, [joinedRooms, user]);

  // 로컬 스토리지에 활성화된 탭 목록 저장
  useEffect(() => {
    if (user) {
      localStorage.setItem(`activeTabs_${user.id}`, JSON.stringify(activeTabs));
    }
  }, [activeTabs, user]);

  // 로컬 스토리지에 읽지 않은 메시지 수 저장
  useEffect(() => {
    if (user) {
      localStorage.setItem(`unreadMessages_${user.id}`, JSON.stringify(unreadMessages));
    }
  }, [unreadMessages, user]);

  // 로컬 스토리지에 메시지 저장
  useEffect(() => {
    if (user) {
      localStorage.setItem(`messages_${user.id}`, JSON.stringify(messages));
    }
  }, [messages, user]);

  // 로컬 스토리지에 선택된 채팅방 저장 및 채팅 박스 스크롤
  useEffect(() => {
    if (user) {
      localStorage.setItem(`selectedRoom_${user.id}`, JSON.stringify(selectedRoom ? selectedRoom.roomId : null));
    }
    scrollToBottom();
  }, [selectedRoom, messages, user]);

  // 모든 채팅방 목록 가져오기
  const fetchChatRooms = async () => {
    try {
      const response = await axios.get('http://localhost:9091/api/chatrooms');
      setChatRooms(response.data);
    } catch (error) {
      console.error("채팅방 목록 가져오기에서 오류가 발생했습니다!", error);
    }
  };

  // 채팅방 메시지 가져오기
  const fetchMessagesByRoomId = async (roomId) => {
    try {
      const clearTime = localStorage.getItem(`clearChatTime_${roomId}_${user.id}`);
      const response = await axios.get(`http://localhost:9091/api/chatrooms/messages/${roomId}`);
      if (clearTime) {
        return response.data.filter(message => new Date(message.date) > new Date(clearTime));
      }
      return response.data;
    } catch (error) {
      console.error("메시지를 가져오는 동안 오류가 발생했습니다!", error);
      return [];
    }
  };

  // 새 채팅방 생성
  const createChatRoom = async () => {
    if (!roomData.roomName) {
      alert("채팅방 이름을 입력해주세요.");
      return;
    }
    if (!roomData.roomDescription) {
      alert("채팅방 소개를 입력해주세요.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:9091/api/chatrooms/create', {
        roomName: roomData.roomName,
        roomDescription: roomData.roomDescription,
        createdBy: user.id
      });
      setChatRooms([...chatRooms, response.data]);
      setRoomData({ roomName: '', roomDescription: '' });
      setIsCreatingRoom(false); // 방 생성 후 입력 폼 숨기기
    } catch (error) {
      console.error("채팅방 생성에 오류가 발생했습니다!", error);
    }
  };

  // 채팅방 삭제
  const deleteChatRoom = async (roomId) => {
    try {
      await axios.delete(`http://localhost:9091/api/chatrooms/delete/${roomId}`);
      setChatRooms(chatRooms.filter(room => room.roomId !== roomId));
      if (selectedRoom && selectedRoom.roomId === roomId) {
        setSelectedRoom(null);
      }
      // 채팅방 멤버들에게 알림 전송
      if (stompClients[roomId]) {
        const deleteMessage = {
          senderName: "고양이의 발자국",
          receiverName: roomId,
          roomId: roomId,
          message: `채팅방이 종료되었습니다.`,
          status: 'DELETE'
        };
        stompClients[roomId].send(`/app/chat/${roomId}`, {}, JSON.stringify(deleteMessage));
        stompClients[roomId].disconnect();
        const updatedStompClients = { ...stompClients };
        delete updatedStompClients[roomId];
        setStompClients(updatedStompClients);
      }
      navigate('/gchat');
    } catch (error) {
      console.error("채팅방을 삭제하는 동안 오류가 발생했습니다!", error);
    }
  };

  // 채팅방 입장 확인 모달 표시
  const confirmJoinRoom = (roomId) => {
    const room = chatRooms.find(room => room.roomId === roomId);
    setRoomToJoin(room);
    setShowModal(true);
  };

  // 채팅방 입장
  const joinChatRoom = async (room) => {
    const roomId = room.roomId;
    const isAlreadyInRoom = room && joinedRooms.includes(roomId);

    if (!isAlreadyInRoom) {
      try {
        await axios.post(`http://localhost:9091/api/chatrooms/join/${roomId}`, null, { params: { username: user.id } });
      } catch (error) {
        console.error("채팅방 입장에 오류가 발생했습니다!", error);
        return;
      }

      setJoinedRooms([...joinedRooms, roomId]); // 입장한 채팅방을 기록
    }

    setSelectedRoom(room);
    setShowModal(false); // 모달 닫기
    markMessagesAsRead(roomId); // 채팅방 입장 시 메시지 읽음 처리

    // 탭에 추가
    if (!activeTabs.includes(roomId)) {
      setActiveTabs([...activeTabs, roomId]);
    }

    const roomMessages = await fetchMessagesByRoomId(roomId);
    setMessages(prevMessages => ({
      ...prevMessages,
      [roomId]: roomMessages
    }));
    scrollToBottom();
  };

  // 채팅방 나가기
  const leaveChatRoom = async (roomId) => {
    try {
      await axios.post(`http://localhost:9091/api/chatrooms/leave/${roomId}`, null, { params: { username: user.id } });
      setSelectedRoom(null);
      setJoinedRooms(joinedRooms.filter(id => id !== roomId)); // 나간 채팅방에서 제거
      setActiveTabs(activeTabs.filter(id => id !== roomId)); // 탭에서 제거
      setUnreadMessages(prevUnreadMessages => {
        const { [roomId]: _, ...rest } = prevUnreadMessages;
        return rest;
      });
      if (stompClients[roomId]) {
        stompClients[roomId].disconnect();
        const updatedStompClients = { ...stompClients };
        delete updatedStompClients[roomId];
        setStompClients(updatedStompClients);
      }
    } catch (error) {
      console.error("채팅방 떠나기에서 오류가 발생했습니다!", error);
    }
  };

  // 입력 폼 상태 업데이트
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setRoomData({ ...roomData, [name]: value });
  };

  // 새 메시지 입력 상태 업데이트
  const handleMessageChange = (event) => {
    setNewMessage(event.target.value);
  };

  // 엔터 키로 메시지 전송
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  // 메시지 전송
  const sendMessage = async () => {
    if (selectedRoom && stompClients[selectedRoom.roomId] && stompClients[selectedRoom.roomId].connected) {
      const message = {
        senderName: user.id,
        receiverName: selectedRoom.roomId,
        roomId: selectedRoom.roomId,
        message: newMessage,
        date: new Date().toISOString(),
        status: 'MESSAGE'
      };
      console.log("Sending message: ", message);
      try {
        stompClients[selectedRoom.roomId].send(`/app/chat/${selectedRoom.roomId}`, {}, JSON.stringify(message));
        setNewMessage('');
        scrollToBottom();
      } catch (error) {
        alert("채팅방이 종료되었습니다.");
        navigate('/gchat');
      }
    } else {
      alert("채팅방이 종료되었습니다.");
      navigate('/gchat');
    }
  };

  // WebSocket 연결
  const connectToWebSocket = (roomId) => {
    const socket = new SockJS('http://localhost:9091/ws');
    const client = Stomp.over(socket);
    client.connect({}, () => {
      client.subscribe(`/topic/${roomId}`, (message) => {
        const receivedMessage = JSON.parse(message.body);
        console.log("Received message: ", receivedMessage);
        if (receivedMessage.status === 'DELETE') {
          handleRoomDeleted(roomId);
        } else {
          setMessages(prevMessages => ({
            ...prevMessages,
            [roomId]: [...(prevMessages[roomId] || []), receivedMessage]
          }));
          if (selectedRoom && selectedRoom.roomId === roomId) {
            scrollToBottom();
          } else if (receivedMessage.senderName !== user.id && receivedMessage.status !== 'JOIN' && receivedMessage.status !== 'LEAVE') {
            setUnreadMessages(prevUnreadMessages => ({
              ...prevUnreadMessages,
              [roomId]: (prevUnreadMessages[roomId] || 0) + 1
            }));
          }
        }
      });

      if (!joinedRooms.includes(roomId)) {
        const joinMessage = {
          senderName: "고양이의 발자국",
          receiverName: roomId,
          roomId: roomId,
          message: `${user.id} 님이 입장하셨습니다.`,
          status: 'JOIN'
        };
        client.send(`/app/chat/${roomId}`, {}, JSON.stringify(joinMessage));
      }
    });
    setStompClients(prevStompClients => ({
      ...prevStompClients,
      [roomId]: client
    }));
  };

  // 채팅방 삭제 시 처리
  const handleRoomDeleted = (roomId) => {
    setShowRoomDeletedModal(true);
    setTimeout(() => {
      setShowRoomDeletedModal(false);
      setSelectedRoom(null);
      navigate('/gchat');
    }, 3000);
  };

  // 채팅 박스 스크롤 하단으로 이동
  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  };

  // 채팅 메시지 지우기
  const clearMessages = () => {
    const clearTime = new Date().toISOString();
    localStorage.setItem(`clearChatTime_${selectedRoom.roomId}_${user.id}`, clearTime);
    setMessages(prevMessages => ({
      ...prevMessages,
      [selectedRoom.roomId]: prevMessages[selectedRoom.roomId].filter(message => new Date(message.date) > new Date(clearTime))
    }));
  };

  // 읽지 않은 메시지 처리
  const markMessagesAsRead = (roomId) => {
    setUnreadMessages(prevUnreadMessages => {
      const { [roomId]: _, ...rest } = prevUnreadMessages;
      return rest;
    });
  };

  // 멤버 목록 모달 표시
  const showMembers = (members) => {
    setCurrentMembers(members);
    setShowMembersModal(true);
  };

  // 설명 모달 표시
  const showDescription = (description) => {
    setCurrentDescription(description);
    setShowDescriptionModal(true);
  };

  // 시간 포맷 변환
  const formatTime = (dateString) => {
    return dateString ? moment(dateString).format('YYYY-MM-DD HH:mm') : '';
  };

  // 탭 닫기
  const closeTab = (roomId) => {
    setActiveTabs(activeTabs.filter(id => id !== roomId));
    if (selectedRoom && selectedRoom.roomId === roomId) {
      setSelectedRoom(null);
    }
  };

  // 탭 선택
  const selectTab = (roomId) => {
    const room = chatRooms.find(room => room.roomId === roomId);
    setSelectedRoom(room);
    markMessagesAsRead(roomId); // 탭 선택 시 메시지 읽음 처리

    // 채팅방 메시지 불러오기
    fetchMessagesByRoomId(roomId).then(roomMessages => {
      setMessages(prevMessages => ({
        ...prevMessages,
        [roomId]: roomMessages
      }));
      scrollToBottom();
    });
  };

  if (!user) {
    return <p>Please log in to create or join chat rooms.</p>;
  }

  return (
    <div className="gchat-container">
      <div className="gchat-header-container">
        <Header />
      </div>
      <div className="gchat-chat-room-container">
        <div className="gchat-sidebar">
          <button className="gchat-button" onClick={() => setIsCreatingRoom(!isCreatingRoom)}>Create Chat Room</button>
          {isCreatingRoom && (
            <div className="gchat-create-room-form">
              <input
                type="text"
                name="roomName"
                placeholder="Room Name"
                value={roomData.roomName}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="roomDescription"
                placeholder="Room Description"
                value={roomData.roomDescription}
                onChange={handleInputChange}
              />
              <button className="gchat-button" onClick={createChatRoom}>Create Room</button>
            </div>
          )}

          <h2>Chat Rooms</h2>
          <ul className="gchat-room-list">
            {chatRooms && chatRooms.length > 0 ? (
              chatRooms.map((room) => (
                <li key={room.roomId} className="gchat-room-item" onClick={() => confirmJoinRoom(room.roomId)}>
                  <span className="gchat-room-name"><strong>{room.roomName}</strong></span>
                  <span className="gchat-room-description" title={room.roomDescription} onClick={(e) => { e.stopPropagation(); showDescription(room.roomDescription); }}>
                    {room.roomDescription && room.roomDescription.length > 5 ? `${room.roomDescription.slice(0, 5)}...` : room.roomDescription}
                  </span>
                  <span className="gchat-room-creator">{room.createdBy}</span>
                  <span className="gchat-room-members" onClick={(e) => { e.stopPropagation(); showMembers(room.members); }}>
                    {room.members && room.members.length}
                  </span>
                  {unreadMessages[room.roomId] > 0 && (
                    <span className="gchat-room-unread">+{unreadMessages[room.roomId]}</span>
                  )}
                </li>
              ))
            ) : (
              <p>입장 가능한 채팅방이 없습니다.</p>
            )}
          </ul>
        </div>
        <div className="gchat-main-content">
          <div className="gchat-tabs">
            {activeTabs && activeTabs.length > 0 && activeTabs.map((roomId) => {
              const room = chatRooms.find(room => room.roomId === roomId);
              if (!room) return null;
              return (
                <div
                  key={roomId}
                  className={`gchat-tab ${selectedRoom && selectedRoom.roomId === roomId ? 'active' : ''}`}
                  onClick={() => selectTab(roomId)}
                >
                  {room.roomName}
                  <button className="gchat-tab-close" onClick={(e) => { e.stopPropagation(); closeTab(roomId); }}>x</button>
                  {unreadMessages[roomId] > 0 && (
                    <span className="gchat-room-unread-tab">+{unreadMessages[roomId]}</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="gchat-room">
            {selectedRoom ? (
              <>
                <div className="gchat-room-header" style={{ border: '1px solid #38ada9', marginBottom: '10px' }}>
                  <h2>현재 채팅방: {selectedRoom.roomName} </h2>
                  <div className="gchat-room-options">
                    <button onClick={() => setShowOptions(!showOptions)} className="gchat-options-button">
                      <FaPaw /> 
                    </button>
                    {showOptions && (
                      <div className="gchat-options-menu">
                        {selectedRoom.createdBy === user.id && (
                          <button onClick={() => deleteChatRoom(selectedRoom.roomId)}>Delete Room</button>
                        )}
                        <button onClick={clearMessages}>Clear Chat</button>
                        <button onClick={() => leaveChatRoom(selectedRoom.roomId)}>나가기</button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="gchat-chat-box" ref={chatBoxRef}>
                  <div style={{ width: '100%' }}>
                    {messages[selectedRoom.roomId] && messages[selectedRoom.roomId].length > 0 ? (
                      messages[selectedRoom.roomId].map((message, index) => (
                        <div key={index} className={`gchat-message ${message.senderName === user.id ? 'own' : ''}`}>
                          <div className="gchat-message-content">
                            <strong>{message.senderName === 'admin' ? '고양이의 발자국' : message.senderName}:</strong> {message.message}
                            {message.status !== 'JOIN' && message.status !== 'LEAVE' && message.date && (
                              <div className="gchat-message-time">{formatTime(message.date)}</div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="gchat-empty-room">
                        <FaPaw className="gchat-empty-icon" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="gchat-input-container">
                  <input
                    type="text"
                    className="gchat-input-text"
                    placeholder="욕설, 비방글 입력 금지"
                    value={newMessage}
                    onChange={handleMessageChange}
                    onKeyPress={handleKeyPress}
                  />
                  <button className="gchat-button" onClick={sendMessage}><FaPaw /></button>
                </div>
              </>
            ) : (
              <div className="gchat-empty-room">
                <FaPaw className="gchat-empty-icon" />
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="gchat-modal">
          <div className="gchat-modal-content">
            <h3>{roomToJoin?.roomName}</h3>
            <p>입장하시겠습니까?</p>
            <button className="gchat-button" onClick={() => joinChatRoom(roomToJoin)}>확인</button>
            <button className="gchat-button" onClick={() => setShowModal(false)}>취소</button>
          </div>
        </div>
      )}

      {showMembersModal && (
        <div className="gchat-modal">
          <div className="gchat-modal-content">
            <h3>참가자 목록</h3>
            <ul>
              {currentMembers && currentMembers.length > 0 && currentMembers.map((member, index) => (
                <li key={index}>{member}</li>
              ))}
            </ul>
            <button className="gchat-button" onClick={() => setShowMembersModal(false)}>닫기</button>
          </div>
        </div>
      )}

      {showDescriptionModal && (
        <div className="gchat-modal">
          <div className="gchat-modal-content">
            <h3>소개</h3>
            <p>{currentDescription}</p>
            <button className="gchat-button" onClick={() => setShowDescriptionModal(false)}>닫기</button>
          </div>
        </div>
      )}

      {showRoomDeletedModal && (
        <div className="gchat-modal">
          <div className="gchat-modal-content">
            <h3>채팅방이 종료되었습니다.</h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default GChat;
