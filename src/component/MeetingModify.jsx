import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './Meeting.css';
import Header from './Header';

const MeetingModify = () => {
  const { id } = useParams(); // useParams로 meeting id 가져오기
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    schedule: '',
    firstBook: '',
    description: ''
  });
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/meeting/${id}`);
        setFormData(response.data);
        setPreviewUrl(`http://localhost:5000${response.data.imgSrc}`);
      } catch (error) {
        console.error('Error fetching meeting details:', error);
      }
    };

    fetchMeeting();
  }, [id]);

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

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = formData.imgSrc;
      if (image) {
        const imageFormData = new FormData();
        imageFormData.append('image', image);

        const imageResponse = await axios.post('http://localhost:5000/api/upload', imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        imageUrl = imageResponse.data.imageUrl;
      }

      const updatedData = { ...formData, imgSrc: imageUrl };
      const token = localStorage.getItem('token');

      await axios.put(`http://localhost:5000/api/meeting/modify/${id}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('모임이 성공적으로 수정되었습니다.');
      navigate(`/meeting/${id}`);
    } catch (error) {
      console.error('Error updating meeting:', error);
      alert('모임 수정 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <Header />
      <div className="meeting-form">
        <h2>모임 수정</h2>
        <form onSubmit={handleSave}>
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
          <button type="submit">수정</button>
        </form>
      </div>
      <footer className="main-footer">
        <p>&copy; 2024 Book Adventure. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MeetingModify;
