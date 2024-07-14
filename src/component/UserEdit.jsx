import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MyPage.css';

const UserEdit = ({ onEditComplete }) => {
  const [userInfo, setUserInfo] = useState({
    name: '',
    birth: '',
    email: '',
    phone: '',
    address: '',
    profile_name: '',
    profile: null
  });

  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
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

    if (userId) {
      fetchUserInfo();
    }
  }, [userId]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profile') {
      setUserInfo((prevState) => ({
        ...prevState,
        profile: files[0]
      }));
    } else {
      setUserInfo((prevState) => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', userInfo.name);
    formData.append('birth', userInfo.birth);
    formData.append('email', userInfo.email);
    formData.append('phone', userInfo.phone);
    formData.append('address', userInfo.address);
    if (userInfo.profile) {
      formData.append('profile', userInfo.profile);
    }

    try {
      const response = await axios.put(`http://localhost:5000/api/users/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      alert('수정되었습니다');
      onEditComplete();
    } catch (error) {
      console.error('Error updating user info:', error);
    }
  };

  return (
    <div className="user-edit-form">
      <form onSubmit={handleSubmit}>
        <div>
          <label>이름:</label>
          <input type="text" name="name" value={userInfo.name} onChange={handleChange} />
        </div>
        <div>
          <label>생년월일:</label>
          <input type="text" name="birth" value={userInfo.birth} onChange={handleChange} />
        </div>
        <div>
          <label>이메일:</label>
          <input type="email" name="email" value={userInfo.email} onChange={handleChange} />
        </div>
        <div>
          <label>전화번호:</label>
          <input type="text" name="phone" value={userInfo.phone} onChange={handleChange} />
        </div>
        <div>
          <label>주소:</label>
          <input type="text" name="address" value={userInfo.address} onChange={handleChange} />
        </div>
        <div>
          <label>프로필 사진:</label>
          {userInfo.profile_name && (
            <div>
              <img 
                src={`http://localhost:5000/uploads/${userInfo.profile_name}`} 
                alt="Profile" 
                style={{ width: '150px', height: 'auto' }} 
              />
            </div>
          )}
          <input type="file" name="profile" onChange={handleChange} />
        </div>
        <div>
          <button className='edit-button' type="submit">저장</button>
        </div>
      </form>
    </div>
  );
};

export default UserEdit;
