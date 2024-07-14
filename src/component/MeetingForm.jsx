import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Meeting.css'; // Import the CSS file
import Header from './Header';

const MeetingForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    schedule: '',
    firstBook: '',
    description: ''
  });

  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // 이미지 미리보기 URL 상태 추가

  const navigate = useNavigate();
  const userId = localStorage.getItem('userId'); // 로그인된 사용자 아이디 가져오기
  const token = localStorage.getItem('token'); // 로그인된 사용자의 토큰 가져오기

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);

    // 이미지 미리보기 URL 생성 및 설정
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    if (file) {
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = '';
      if (image) {
        const imageFormData = new FormData();
        imageFormData.append('image', image);

        const imageResponse = await axios.post('http://localhost:5000/api/upload', imageFormData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}` // 인증 헤더 추가
          }
        });

        imageUrl = imageResponse.data.imageUrl;
      }

      const meetingData = {
        ...formData,
        imgSrc: imageUrl,
        leader: userId // 리더를 로그인된 사용자 아이디로 설정
      };

      await axios.post('http://localhost:5000/api/meetings', meetingData, {
        headers: {
          Authorization: `Bearer ${token}` // 인증 헤더 추가
        }
      });

      alert('모임이 성공적으로 생성되었습니다.');
      navigate('/meeting');
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('모임 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <Header />
    <div className="meeting-form">
      <h2>모임 생성</h2>
      <form onSubmit={handleSubmit}>
        <label>
          모임 이름
          <input type="text" name="title" value={formData.title} onChange={handleChange} required />
        </label>
        <label>
          모임 시간
          <input type="text" name="schedule" value={formData.schedule} onChange={handleChange} required />
        </label>
        <label>
          모임 소개
          <input type="text" name="firstBook" value={formData.firstBook} onChange={handleChange} required />
        </label>
        <label>
          설명
        </label>
        <textarea name="description" value={formData.description} onChange={handleChange} required />
        <label>
          이미지 업로드
        </label>
        <input type="file" onChange={handleImageChange} />
        {previewUrl && (
          <div className="image-preview">
            <img src={previewUrl} alt="이미지 미리보기" />
          </div>
        )}
        <button type="submit">모임 생성</button>
      </form>
    </div>
    <footer className="main-footer">
      <p>&copy; 2024 Book Adventure. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MeetingForm;
