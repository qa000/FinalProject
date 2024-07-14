import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Form, Button, Col, Row } from 'react-bootstrap';
import Header from './Header';
import './Book.css'; // CSS 파일 이름을 변경

const UsedBookWrite = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const book = location.state?.book || {};

  const [form, setForm] = useState({
    sellerId: '',
    bookCondition: 'high',
    frontImage: null,
    backImage: null,
    price: '',
    description: ''
  });
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);

  useEffect(() => {
    if (Object.keys(book).length > 0) {
      setForm(prevForm => ({
        ...prevForm,
        price: calculatePrice(book.pricestandard, 'high')
      }));
    } else {
      alert('책 정보를 가져오는 데 실패했습니다.');
      navigate('/');
    }

    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setForm(prevForm => ({
        ...prevForm,
        sellerId: storedUserId
      }));
    }
  }, [book, navigate]);

  const handleConditionChange = (condition) => {
    setForm({
      ...form,
      bookCondition: condition,
      price: calculatePrice(book.pricestandard, condition)
    });
  };

  const calculatePrice = (standardPrice, condition) => {
    const discountRates = { high: 0.7, medium: 0.5, low: 0.3 };
    return Math.round(standardPrice * discountRates[condition]);
  };

  const handleFileChange = (e, imageType) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (imageType === 'front') {
          setFrontPreview(reader.result);
        } else {
          setBackPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
      setForm({
        ...form,
        [imageType === 'front' ? 'frontImage' : 'backImage']: file
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('bookId', book.itemid); // 여기서 book.id가 아닌 book.itemid로 수정
    formData.append('sellerId', form.sellerId);
    formData.append('bookCondition', form.bookCondition);
    formData.append('price', form.price);
    formData.append('description', form.description);
    if (form.frontImage) {
      formData.append('frontImage', form.frontImage);
    }
    if (form.backImage) {
      formData.append('backImage', form.backImage);
    }

    try {
      const response = await axios.post('/used_books_register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Success:', response.data);
      alert('중고책이 등록되었습니다.');
      navigate('/UsedBookInfo');
    } catch (error) {
      console.error('Error uploading the book:', error.response?.data || error.message);
      alert('중고책 등록에 실패했습니다.');
    }
  };

  return (
    <div className="usedbookwrite-container">
      <Header />
      <div className="usedbookwrite-content">
        <h1>중고책 등록</h1>
        
        {Object.keys(book).length > 0 && (
          <div className="usedbookwrite-book-details">
            <h3>{book.title}</h3>
            <img src={book.coverimage} alt={book.title} style={{ maxWidth: '200px', maxHeight: '200px' }} />
            <p>정가: ₩{book.pricestandard && book.pricestandard.toLocaleString()}</p>
          </div>
        )}

        <Form  className="used-form" onSubmit={handleSubmit}>
          <Form.Group as={Row} className="used-form-group">
            <Form.Label column sm="2" className="used-form-label">책 상태</Form.Label>
            <Col sm="10">
              <Form.Control
                as="select"
                value={form.bookCondition}
                onChange={(e) => handleConditionChange(e.target.value)}
                className="used-form-control"
              >
                <option value="high">최상</option>
                <option value="medium">중간</option>
                <option value="low">하</option>
              </Form.Control>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="used-form-group">
            <Form.Label column sm="2" className="used-form-label">할인 가격</Form.Label>
            <Col sm="10">
              <Form.Control
                type="text"
                readOnly
                value={`₩${form.price.toLocaleString()}`}
                className="used-form-control"
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="used-form-group">
            <Form.Label column sm="2" className="used-form-label">전면 사진</Form.Label>
            <Col sm="10">
              <Form.Control
                type="file"
                name="frontImage"
                onChange={(e) => handleFileChange(e, 'front')}
                className="used-form-control"
              />
              {frontPreview && (
                <div className="image-preview">
                  <img src={frontPreview} alt="Front Preview" style={{ maxWidth: '200px', maxHeight: '200px' }} />
                </div>
              )}
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="used-form-group">
            <Form.Label column sm="2" className="used-form-label">후면 사진</Form.Label>
            <Col sm="10">
              <Form.Control
                type="file"
                name="backImage"
                onChange={(e) => handleFileChange(e, 'back')}
                className="used-form-control"
              />
              {backPreview && (
                <div className="image-preview">
                  <img src={backPreview} alt="Back Preview" style={{ maxWidth: '200px', maxHeight: '200px' }} />
                </div>
              )}
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="used-form-group">
            <Form.Label column sm="2" className="used-form-label">설명</Form.Label>
            <Col sm="10">
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="책에 대한 설명을 입력하세요"
                name="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="used-form-control"
              />
            </Col>
          </Form.Group>

          <div className="usedwrite-btn">
            <Button type="submit" className="usedwrite-btn-2">등록</Button>
            <Button type="reset" variant="secondary" className="usedwrite-btn-c">초기화</Button>
          </div>
        </Form>
      </div>
      <footer className="main-footer">
      <p>&copy; 2024 Book Adventure. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default UsedBookWrite;
