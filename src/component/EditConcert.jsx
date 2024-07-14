import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import './Concert.css';
import Header from './Header';

const EditConcert = () => {
  const [formData, setFormData] = useState({
    title: '',
    speaker: '',
    date: '',
    location: '',
    description: '',
    price: ''
  });

  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();  // 경로 매개변수 가져오기
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchConcertDetails();
  }, []);

  const fetchConcertDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/concerts/${id}`);
      const concertData = response.data;
      concertData.date = formatDateTimeForInput(concertData.date);
      setFormData(concertData);
      setPreviewUrl(concertData.imageUrl);
    } catch (error) {
      console.error('Error fetching concert details:', error);
    }
  };

  const formatDateTimeForInput = (dateTime) => {
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);

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
      let imageUrl = formData.imageUrl;
      if (image) {
        const imageFormData = new FormData();
        imageFormData.append('image', image);

        const imageResponse = await axios.post('http://localhost:5000/api/upload', imageFormData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });

        imageUrl = imageResponse.data.imageUrl;
      }

      const updatedConcertData = {
        ...formData,
        imageUrl
      };

      await axios.put(`http://localhost:5000/api/concerts/${id}`, updatedConcertData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      alert('강연이 성공적으로 수정되었습니다.');
      navigate('/concert');
    } catch (error) {
      console.error('Error updating concert:', error);
      alert('강연 수정 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <Header />
      <div className="create-concert-container">
        <h2>강연 수정</h2>
        <form onSubmit={handleSubmit}>
          <label>
            제목
            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
          </label>
          <label>
            강연자
            <input type="text" name="speaker" value={formData.speaker} onChange={handleChange} required />
          </label>
          <label>
            날짜
            <input type="datetime-local" name="date" value={formData.date} onChange={handleChange} required />
          </label>
          <label>
            위치
            <input type="text" name="location" value={formData.location} onChange={handleChange} required />
          </label>
          <label>설명</label>
            <textarea name="description" value={formData.description} onChange={handleChange} required />
          
          <label>
            가격
            <input type="number" name="price" value={formData.price} onChange={handleChange} required />
          </label>
          <label>
            이미지 업로드
            <input type="file" onChange={handleImageChange} />
          </label>
          {previewUrl && (
            <div className="image-preview">
              <img src={previewUrl} alt="이미지 미리보기" />
            </div>
          )}
          <button className='create-concert-b' type="submit">수정</button>
          <button className='can-concert' type="button" onClick={() => navigate('/concert')}>취소</button>
        </form>
      </div>
      <footer className="main-footer">
        <p>&copy; 2024 Book Adventure. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default EditConcert;
