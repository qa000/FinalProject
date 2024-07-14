import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';
import './Book.css';
import Header from './Header';
import Footer from './Footer';

Modal.setAppElement('#root');

const UsedBookShop = () => {
  const { book_id } = useParams();
  const navigate = useNavigate();
  const [bookDetails, setBookDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalImage, setModalImage] = useState('');

  const getBookDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/used_books_inquir/${book_id}`);
      console.log('Book Details:', response.data); // 데이터를 확인하기 위한 로그
      setBookDetails(response.data);
    } catch (error) {
      setError('책 정보를 가져오는 중 오류가 발생했습니다: ' + error.message);
    }
    setLoading(false);
  };

  const addToCart = async (book) => {
    setAddingToCart(true);
    try {
      const token = localStorage.getItem('token'); // 로컬 스토리지에서 토큰을 가져옵니다.
      const response = await axios.post('/cart', {
        title: book.title,
        isUsedBook: true,
        usedBookId: book.id,
      }, {
        headers: {
          Authorization: `Bearer ${token}`, // 요청 헤더에 토큰을 추가합니다.
        },
      });
      console.log('Add to Cart Response:', response.data);
      alert('장바구니에 추가되었습니다.');
    } catch (error) {
      console.error('Add to Cart Error:', error);
      alert('장바구니에 추가하는 중 오류가 발생했습니다: ' + error.message);
    }
    setAddingToCart(false);
  };

  const openModal = (image) => {
    setModalImage(image);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setModalImage('');
  };

  useEffect(() => {
    getBookDetails();
  }, [book_id]);

  return (
    <div className="usedbook-detail-container">
      <Header />
      <section className="usedbook-detail">
        {loading ? (
          <div>로딩 중...</div>
        ) : error ? (
          <div>{error}</div>
        ) : (
          <div className="usedbook-detail-list">
            {bookDetails.map((book) => (
              <div className="book-detail-item" key={book.id}>
                <div className="book-detail-cover-container">
                  <img 
                    src={`/uploads/${book.front_image}`} 
                    alt={book.title} 
                    className="front-image" 
                    onClick={() => openModal(`/uploads/${book.front_image}`)} 
                  />
                  <img 
                    src={`/uploads/${book.back_image}`} 
                    alt={`${book.title} - Back`} 
                    className="back-image" 
                    onClick={() => openModal(`/uploads/${book.back_image}`)} 
                  />
                </div>
                <div className="usedbook-detail-info">
                  <h2>{book.title}</h2>
                  <p>판매자: {book.seller_id}</p>
                  <p>상태: {book.book_condition}</p>
                  <p>가격: ₩{new Intl.NumberFormat('ko-KR').format(Number(book.price))}</p>
                  <p>{book.description}</p>
                  <button className="usedaddcart" onClick={() => addToCart(book)} disabled={addingToCart}>
                    <span className="usedaddcartspan">
                      {addingToCart ? '추가 중...' : 'Add To Cart'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Book Image Modal"
        className="used-modal"
        overlayClassName="overlay"
      >
        <button onClick={closeModal} className="close-usedmodal-button">X</button>
        <img src={modalImage} alt="Book" className="usedmodal-image" />
      </Modal>
    </div>
  );
};

export default UsedBookShop;
