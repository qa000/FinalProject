import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MyPage.css'

const UserInfo = ({ onEdit }) => {
  const [userInfo, setUserInfo] = useState(null);
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!userId) {
        console.error('userId가 설정되지 않았습니다.');
        return;
      }

      try {
        const response = await axios.get(`http://localhost:5000/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setUserInfo(response.data);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
  }, [userId]);

  const handleDelete = async () => {
    const confirmed = window.confirm('정말 탈퇴하시겠습니까?');
    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      // 로컬 스토리지에서 사용자 정보 삭제
      localStorage.removeItem('userId');
      localStorage.removeItem('token');
      alert('탈퇴되었습니다.');
      navigate('/login'); // 로그인 페이지로 리다이렉트
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('탈퇴에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (!userId) {
    return <p>로그인이 필요합니다.</p>;
  }

  if (!userInfo) {
    return <p>로딩 중...</p>;
  }

  const profileImageUrl = `http://localhost:5000/api/profile-image/${userInfo.profile_name}`;

  return (
    <div className='userInfo'>
      {userInfo.profile_name && (
        <div className='userInfo-img'>
          <img src={profileImageUrl} alt="Profile" />
        </div>
      )}
      <p>이름: {userInfo.name}</p>
      <p>생년월일: {userInfo.birth}</p>
      <p>이메일: {userInfo.email}</p>
      <p>전화번호: {userInfo.phone}</p>
      <p>주소: {userInfo.address}</p>
      
      <div>
        <button onClick={onEdit}>수정하기</button>
        <button onClick={handleDelete}>탈퇴하기</button>
      </div>
    </div>
  );
}

export default UserInfo;
