import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css'; // CSS 파일 경로 수정
import Header from './Header';

const Admin = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [payments, setPayments] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [contacts, setContacts] = useState([]); // 문의 목록 상태 추가
  const [showUsers, setShowUsers] = useState(true);
  const [showPosts, setShowPosts] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showReservations, setShowReservations] = useState(false);
  const [showContacts, setShowContacts] = useState(false); // 문의 목록 표시 상태 추가
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  // 페이지네이션 상태 변수
  const [currentUsersPage, setCurrentUsersPage] = useState(1);
  const [currentPostsPage, setCurrentPostsPage] = useState(1);
  const [currentPaymentsPage, setCurrentPaymentsPage] = useState(1);
  const [currentReservationsPage, setCurrentReservationsPage] = useState(1);
  const [currentContactsPage, setCurrentContactsPage] = useState(1);

  const usersPerPage = 7;
  const postsPerPage = 5;
  const paymentsPerPage = 10;
  const reservationsPerPage = 10;
  const contactsPerPage = 10;

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
  });

  axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  useEffect(() => {
    fetchUsers();
    fetchPosts();
    fetchPayments();
    fetchReservations();
    fetchContacts(); // 문의 목록 가져오기
  }, [currentUsersPage, currentPostsPage, currentPaymentsPage, currentReservationsPage, currentContactsPage]); // 페이지가 변경될 때마다 데이터를 다시 가져옴

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/users', {
        params: {
          page: currentUsersPage,
          limit: usersPerPage
        }
      });
      setUsers(response.data.users);
      setTotalUsers(response.data.total);
    } catch (error) {
      console.error('사용자 목록을 가져오는 중 오류 발생:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axiosInstance.get('/posts', {
        params: {
          page: currentPostsPage,
          limit: postsPerPage
        }
      });
      setPosts(response.data.posts);
      setTotalPosts(response.data.total);
    } catch (error) {
      console.error('게시글 목록을 가져오는 중 오류 발생:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await axiosInstance.get('/payments', {
        params: {
          page: currentPaymentsPage,
          limit: paymentsPerPage
        }
      });
      setPayments(response.data);
    } catch (error) {
      console.error('결제 목록을 가져오는 중 오류 발생:', error);
    }
  };

  const fetchReservations = async () => {
    try {
      const response = await axiosInstance.get('/reservations', {
        params: {
          page: currentReservationsPage,
          limit: reservationsPerPage
        }
      });
      setReservations(response.data);
    } catch (error) {
      console.error('예약 목록을 가져오는 중 오류 발생:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await axiosInstance.get('/contacts', {
        params: {
          page: currentContactsPage,
          limit: contactsPerPage
        }
      });
      setContacts(response.data);
    } catch (error) {
      console.error('문의 목록을 가져오는 중 오류 발생:', error);
    }
  };

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const toggleBlockUser = async (userId, isBlocked) => {
    try {
      await axiosInstance.post('/toggleBlockUser', { id: userId, isBlocked });
      alert(isBlocked ? '사용자 차단 해제되었습니다.' : '사용자가 차단되었습니다.');
      setUsers(users.map(user => user.id === userId ? { ...user, isBlocked: !isBlocked } : user));
    } catch (error) {
      console.error('사용자 차단/차단 해제 중 오류 발생:', error);
      alert('사용자 차단/차단 해제 중 오류가 발생했습니다.');
    }
  };

  const deleteUser = async (userId) => {
    try {
      await axiosInstance.post('/deleteUser', { id: userId });
      alert('사용자와 해당 사용자가 작성한 게시글이 삭제되었습니다.');
      setUsers(users.filter(user => user.id !== userId));
      setPosts(posts.filter(post => post.writer !== userId));
    } catch (error) {
      console.error('사용자를 삭제하는 중 오류 발생:', error);
      alert('사용자 삭제 중 오류가 발생했습니다.');
    }
  };

  const deletePost = async (postId) => {
    try {
      await axiosInstance.post('/deletePost', { id: postId });
      alert('게시글이 삭제되었습니다.');
      setPosts(posts.filter(post => post.bnum !== postId));
    } catch (error) {
      console.error('게시글을 삭제하는 중 오류 발생:', error);
      alert('게시글 삭제 중 오류가 발생했습니다.');
    }
  };

  const viewUserDetails = async (userId) => {
    try {
      const response = await axiosInstance.get(`/user/${userId}`);
      setSelectedUser(response.data);
    } catch (error) {
      console.error('사용자 정보를 가져오는 중 오류 발생:', error);
      alert('사용자 정보를 가져오는 중 오류가 발생했습니다.');
    }
  };

  const viewPostDetails = async (postId) => {
    try {
      const response = await axiosInstance.get(`/posts/${postId}`);
      setSelectedPost(response.data);
    } catch (error) {
      console.error('게시글 정보를 가져오는 중 오류 발생:', error);
      alert('게시글 정보를 가져오는 중 오류가 발생했습니다.');
    }
  };

  const cancelPayment = async (merchantUid) => {
    try {
      await axiosInstance.post('/cancelPayment', { merchant_uid: merchantUid });
      alert('결제가 취소되었습니다.');
      setPayments(payments.map(payment => payment.merchant_uid === merchantUid ? { ...payment, status: '결제 취소' } : payment));
    } catch (error) {
      console.error('결제를 취소하는 중 오류 발생:', error);
      alert('결제 취소 중 오류가 발생했습니다.');
    }
  };

  const cancelReservation = async (reservationId) => {
    try {
      await axiosInstance.post('/cancel-reservation', { reservation_id: reservationId });
      alert('예약이 취소되었습니다.');
      setReservations(reservations.map(reservation => reservation.id === reservationId ? { ...reservation, status: '예약 취소' } : reservation));
    } catch (error) {
      console.error('예약을 취소하는 중 오류 발생:', error);
      alert('예약 취소 중 오류가 발생했습니다.');
    }
  };

  const handlePageChange = (pageSetter, currentPage, totalPages, direction) => {
    const newPage = currentPage + direction;
    if (newPage > 0 && newPage <= totalPages) {
      pageSetter(newPage);
    }
  };

  return (
    <div>
      <Header />
      <div className="admin">
        <h1>관리자 페이지</h1>
        <div className="admin-button-container">
          <button className="admin-button users-button" onClick={() => {
            setShowUsers(true);
            setShowPosts(false);
            setShowPayments(false);
            setShowReservations(false);
            setShowContacts(false);
          }}>회원 목록</button>

          <button className="admin-button posts-button" onClick={() => {
            setShowUsers(false);
            setShowPosts(true);
            setShowPayments(false);
            setShowReservations(false);
            setShowContacts(false);
          }}>게시글 목록</button>

          <button className="admin-button payments-button" onClick={() => {
            setShowUsers(false);
            setShowPosts(false);
            setShowPayments(true);
            setShowReservations(false);
            setShowContacts(false);
          }}>결제 목록</button>

          <button className="admin-button reservations-button" onClick={() => {
            setShowUsers(false);
            setShowPosts(false);
            setShowPayments(false);
            setShowReservations(true);
            setShowContacts(false);
          }}>예약 목록</button>

          <button className="admin-button contacts-button" onClick={() => {
            setShowUsers(false);
            setShowPosts(false);
            setShowPayments(false);
            setShowReservations(false);
            setShowContacts(true);
          }}>문의 목록</button>

          <button className="admin-button chatroom-button" onClick={() => navigate('/admin/chatroom')}>관리자 채팅</button>
        </div>

        {showUsers && (
          <div className="admin-list-container">
            <h2>회원 목록</h2>
            {users.length > 0 ? (
              <div>
                <table className="admin-member-table">
                  <thead>
                    <tr>
                      <th>아이디 (이름)</th>
                      <th>이메일</th>
                      <th>상세보기</th>
                      <th>차단/차단 해제</th>
                      <th>삭제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.id} ({user.name})</td>
                        <td>{user.email}</td>
                        <td>
                          <button className="admin-details-button" onClick={() => viewUserDetails(user.id)}>상세보기</button>
                        </td>
                        <td>
                          <button 
                            className="admin-block-button" 
                            onClick={() => toggleBlockUser(user.id, user.isBlocked)}
                          >
                            {user.isBlocked ? '차단 해제' : '차단'}
                          </button>
                        </td>
                        <td>
                          <button className="admin-delete-button" onClick={() => deleteUser(user.id)}>삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="admin-pagination">
                  <button
                    onClick={() => handlePageChange(setCurrentUsersPage, currentUsersPage, Math.ceil(totalUsers / usersPerPage), -1)}
                    disabled={currentUsersPage === 1}
                  >
                    &lt; 이전
                  </button>
                  <span>{currentUsersPage}</span>
                  <button
                    onClick={() => handlePageChange(setCurrentUsersPage, currentUsersPage, Math.ceil(totalUsers / usersPerPage), 1)}
                    disabled={currentUsersPage === Math.ceil(totalUsers / usersPerPage)}
                  >
                    다음 &gt;
                  </button>
                </div>
              </div>
            ) : (
              <p>회원 목록이 없습니다.</p>
            )}
            <hr />
          </div>
        )}

        {showPosts && (
          <div className="admin-list-container">
            <h2>게시글 목록</h2>
            {posts.length > 0 ? (
              <div>
                <table className="admin-board-table">
                  <thead>
                    <tr>
                      <th>제목</th>
                      <th>내용</th>
                      <th>작성자</th>
                      <th>신고 수</th>
                      <th>게시일</th>
                      <th>삭제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map(post => (
                      <tr key={post.bnum}>
                        <td onClick={() => viewPostDetails(post.bnum)}>{post.title}</td>
                        <td>{truncateText(post.contents, 50)}</td>
                        <td>{post.writer}</td>
                        <td>{post.report_count}</td>
                        <td>{new Date(post.regdate).toLocaleDateString()}</td>
                        <td>
                          <button className="admin-delete-button" onClick={() => deletePost(post.bnum)}>삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="admin-pagination">
                  <button
                    onClick={() => handlePageChange(setCurrentPostsPage, currentPostsPage, Math.ceil(totalPosts / postsPerPage), -1)}
                    disabled={currentPostsPage === 1}
                  >
                    &lt; 이전
                  </button>
                  <span>{currentPostsPage}</span>
                  <button
                    onClick={() => handlePageChange(setCurrentPostsPage, currentPostsPage, Math.ceil(totalPosts / postsPerPage), 1)}
                    disabled={currentPostsPage === Math.ceil(totalPosts / postsPerPage)}
                  >
                    다음 &gt;
                  </button>
                </div>
              </div>
            ) : (
              <p>게시글 목록이 없습니다.</p>
            )}
            <hr />
          </div>
        )}

        {showPayments && (
          <div className="admin-list-container">
            <h2>결제 내역</h2>
            {payments.length > 0 ? (
              <div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>이름 <br /> (아이디)</th>
                      <th>도서</th>
                      <th>연락처</th>
                      <th>배송지</th>
                      <th>금액</th>
                      <th>상태</th>
                      <th>구매 날짜</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr key={payment.merchant_uid}>
                        <td>{payment.buyer_name} ({payment.user_id})</td>
                        <td>{payment.title}</td>
                        <td>{payment.buyer_tel}</td>
                        <td>{payment.buyer_addr}</td>
                        <td>{payment.amount}</td>
                        <td>
                          {payment.status === '결제 취소' ? (
                            <span>취소 완료</span>
                          ) : (
                            <button className="admin-cancel-button" onClick={() => cancelPayment(payment.merchant_uid)}>결제 취소</button>
                          )}
                        </td>
                        <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="admin-pagination">
                  <button
                    onClick={() => handlePageChange(setCurrentPaymentsPage, currentPaymentsPage, Math.ceil(payments.length / paymentsPerPage), -1)}
                    disabled={currentPaymentsPage === 1}
                  >
                    &lt; 이전
                  </button>
                  <span>{currentPaymentsPage}</span>
                  <button
                    onClick={() => handlePageChange(setCurrentPaymentsPage, currentPaymentsPage, Math.ceil(payments.length / paymentsPerPage), 1)}
                    disabled={currentPaymentsPage === Math.ceil(payments.length / paymentsPerPage)}
                  >
                    다음 &gt;
                  </button>
                </div>
              </div>
            ) : (
              <p>결제 내역이 없습니다.</p>
            )}
            <hr />
          </div>
        )}

        {showReservations && (
          <div className="admin-list-container">
            <h2>예약 내역</h2>
            {reservations.length > 0 ? (
              <div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>이름 (아이디)</th>
                      <th>강연 제목</th>
                      <th>좌석</th>
                      <th>총 가격</th>
                      <th>예약 날짜</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map(reservation => (
                      <tr key={reservation.id}>
                        <td>{reservation.buyer_name} ({reservation.user_id})</td>
                        <td>{reservation.concert_title}</td>
                        <td>{reservation.seats}</td>
                        <td>{reservation.total_price}</td>
                        <td>{new Date(reservation.reserved_at).toLocaleDateString()}</td>
                        <td>
                          {reservation.status === '예약 취소' ? (
                            <span>취소 완료</span>
                          ) : (
                            <button className="admin-cancel-button" onClick={() => cancelReservation(reservation.id)}>취소</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="admin-pagination">
                  <button
                    onClick={() => handlePageChange(setCurrentReservationsPage, currentReservationsPage, Math.ceil(reservations.length / reservationsPerPage), -1)}
                    disabled={currentReservationsPage === 1}
                  >
                    &lt; 이전
                  </button>
                  <span>{currentReservationsPage}</span>
                  <button
                    onClick={() => handlePageChange(setCurrentReservationsPage, currentReservationsPage, Math.ceil(reservations.length / reservationsPerPage), 1)}
                    disabled={currentReservationsPage === Math.ceil(reservations.length / reservationsPerPage)}
                  >
                    다음 &gt;
                  </button>
                </div>
              </div>
            ) : (
              <p>예약 내역이 없습니다.</p>
            )}
            <hr />
          </div>
        )}

        {showContacts && (
          <div className="admin-list-container">
            <h2>문의 목록</h2>
            {contacts.length > 0 ? (
              <div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>이름</th>
                      <th>이메일</th>
                      <th>메시지</th>
                      <th>보낸 날짜</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map(contact => (
                      <tr key={contact.id}>
                        <td>{contact.name}</td>
                        <td>{contact.email}</td>
                        <td>{contact.message}</td>
                        <td>{new Date(contact.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="admin-pagination">
                  <button
                    onClick={() => handlePageChange(setCurrentContactsPage, currentContactsPage, Math.ceil(contacts.length / contactsPerPage), -1)}
                    disabled={currentContactsPage === 1}
                  >
                    &lt; 이전
                  </button>
                  <span>{currentContactsPage}</span>
                  <button
                    onClick={() => handlePageChange(setCurrentContactsPage, currentContactsPage, Math.ceil(contacts.length / contactsPerPage), 1)}
                    disabled={currentContactsPage === Math.ceil(contacts.length / contactsPerPage)}
                  >
                    다음 &gt;
                  </button>
                </div>
              </div>
            ) : (
              <p>문의 목록이 없습니다.</p>
            )}
            <hr />
          </div>
        )}

        {selectedUser && (
          <div className="admin-user-details">
            <button className="admin-close-button" onClick={() => setSelectedUser(null)}>닫기</button>
            <h2>회원 상세 정보</h2>
            <p>ID: {selectedUser.id}</p>
            <p>이름: {selectedUser.name}</p>
            <p>이메일: {selectedUser.email}</p>
            <p>전화번호: {selectedUser.phone}</p>
            <p>주소: {selectedUser.address}</p>
          </div>
        )}

        {selectedPost && (
          <div className="admin-post-details">
            <button className="admin-close-button" onClick={() => setSelectedPost(null)}>닫기</button>
            <h2>게시글 상세 정보</h2>
            <h3>{selectedPost.title}</h3>
            <p>{selectedPost.contents}</p>
            <p>작성자: {selectedPost.writer}</p>
            <p>신고 수: {selectedPost.report_count}</p>
          </div>
        )}
      </div>
      <footer className="main-footer">
        <p>&copy; 2024 Book Adventure. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Admin;
