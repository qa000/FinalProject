import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Concert.css'; // Import the CSS file
import Header from './Header';

const CreateConcert = () => {
  const [formData, setFormData] = useState({
    title: '',
    speaker: '',
    date: '',
    location: '',
    description: '',
    price: ''
  });

  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // 이미지 미리보기 URL 상태 추가
  const navigate = useNavigate();
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

      const concertData = {
        ...formData,
        imageUrl
      };

      await axios.post('http://localhost:5000/api/create-concerts', concertData, {
        headers: {
          Authorization: `Bearer ${token}` // 인증 헤더 추가
        }
      });

      alert('강연이 성공적으로 생성되었습니다.');
      navigate('/concert');
    } catch (error) {
      console.error('Error creating concert:', error);
      alert('강연 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <Header />
      <div className="create-concert-container">
        <h2>강연 생성</h2>
        <form onSubmit={handleSubmit}>
        <label> 제목 
        <input type="text" name="title" value={formData.title} onChange={handleChange} required />
        </label>

        <label> 강연자 
        <input type="text" name="speaker" value={formData.speaker} onChange={handleChange} required />
        </label>
          
        <label> 날짜
        <input type="datetime-local" name="date" value={formData.date} onChange={handleChange} required />
        </label>

        <label> 위치
        <input type="text" name="location" value={formData.location} onChange={handleChange} required />
        </label>

        <label>설명</label>
        <textarea name="description" value={formData.description} onChange={handleChange} required />
    
            
        <label>가격
        <input type="number" name="price" value={formData.price} onChange={handleChange} required />
        </label>

        <label> 이미지 업로드  
        <input type="file" onChange={handleImageChange} /></label>
        {previewUrl && (
            <div className="image-preview">
              <img src={previewUrl} alt="이미지 미리보기" />
            </div>
          )}
          <div>
          <button className='create-concert-b' type="submit">생성</button>
          <button className='can-concert' type="button" onClick={() => navigate('/concert')}>취소</button>
          </div>
        </form>
      </div>
      <footer className="main-footer">
        <p>&copy; 2024 Book Adventure. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default CreateConcert;
