import React, { useEffect, useState } from 'react';
import Header from './Header';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './Book.css';
import { Button } from 'react-bootstrap';
import { FaHeart, FaRegHeart, FaRegStar, FaStar, FaTrashAlt, FaEdit } from 'react-icons/fa';

const BookShop = () => {
  const { itemid } = useParams();
  const [book, setBook] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [readingStatus, setReadingStatus] = useState('TO_READ');
  const [isFavorite, setIsFavorite] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [reviews, setReviews] = useState([]);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const reviewsPerPage = 4;
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [hasReviewed, setHasReviewed] = useState(false); // 리뷰 작성 여부 확인
  const [editReviewId, setEditReviewId] = useState(null);
  const [editReview, setEditReview] = useState({ rating: 0, comment: '' });
  const [isEditingReview, setIsEditingReview] = useState(false);
  const navigate = useNavigate();

  const userId = localStorage.getItem('userId');

  const indexOfLastReview = currentReviewPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);

  const formatToMySQLDate = (isoDate) => {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  };

  const paginateReviews = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= Math.ceil(reviews.length / reviewsPerPage)) {
      setCurrentReviewPage(pageNumber);
    }
  };

  const getBook = async () => {
    try {
      const response = await axios.get(`http://localhost:9091/api/book/view/${itemid}`);
      setBook(response.data);

      const readingListResponse = await axios.get(`http://localhost:9091/api/readinglist/${userId}`);
      const userBook = readingListResponse.data.find(item => item.bookid === itemid);
      if (userBook) {
        setReadingStatus(userBook.status);
        setIsFavorite(true);
      }

      const reviewsResponse = await axios.get(`http://localhost:9091/api/bookreviews/${itemid}`);
      setReviews(reviewsResponse.data);

      const userReview = reviewsResponse.data.find(review => review.memberid === userId);
      setHasReviewed(!!userReview); // 사용자가 리뷰를 작성했는지 확인
    } catch (error) {
      console.error('Error fetching book details:', error);
    }
  };

  const handleShowModal = (event) => {
    const rect = event.target.getBoundingClientRect();
    setModalPosition({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleSave = async () => {
    if (!userId) {
      alert('로그인 후 사용 가능합니다.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const addedat = formatToMySQLDate(new Date().toISOString());
      const response = await axios.post('http://localhost:5000/api/readinglist', {
        userId: userId,
        bookId: itemid,
        status: readingStatus,
        addedat: addedat,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsFavorite(true);
      setShowModal(false);
      if (response.data.updated) {
        alert('상태가 변경되었습니다.');
      } else {
        alert('상태가 변경되었습니다.');
      }
    } catch (error) {
      console.error('에러', error);
    }
  };

  const AddToCart = async (title, showAlert = true) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      await axios.post(
        '/cart',
        { title },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (showAlert) {
        alert('책이 장바구니에 추가되었습니다.');
        navigate('/cart');
      }
    } catch (error) {
      console.error('장바구니에 책을 추가하는 중 오류가 발생했습니다:', error);
    }
  };

  const handleBuyNow = async (title) => {
    await AddToCart(title, false);
    navigate('/payment');
  };

  const handleReviewSubmit = async () => {
    if (!userId) {
      alert('로그인 후 사용 가능합니다.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const reviewData = {
        bookid: itemid,
        memberid: userId,
        rating: newReview.rating,
        comment: newReview.comment,
        createdat: new Date().toISOString(), // LocalDateTime과 호환되는 ISO 형식 사용
      };

      console.log('Review Data:', reviewData); // 리뷰 데이터를 로그로 출력

      await axios.post(`http://localhost:9091/api/bookreviews`, reviewData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('리뷰가 작성되었습니다.');
      setShowReviewForm(false);
      setNewReview({ rating: 0, comment: '' });
      getBook();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert('이미 이 책에 대한 리뷰를 작성하셨습니다.');
      } else {
        console.error('리뷰 작성 중 오류가 발생했습니다:', error.response ? error.response.data : error.message);
      }
    }
  };

  const handleReviewEdit = async () => {
    if (!userId) {
      alert('로그인 후 사용 가능합니다.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const reviewData = {
        rating: editReview.rating,
        comment: editReview.comment
      };
  
      console.log('Edit Review Data:', reviewData); // 수정 리뷰 데이터를 로그로 출력
  
      await axios.post(`http://localhost:9091/api/bookreviews/edit/${editReviewId}`, reviewData, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      alert('리뷰가 수정되었습니다.');
      setIsEditingReview(false);
      setEditReviewId(null);
      setEditReview({ rating: 0, comment: '' });
      getBook();
    } catch (error) {
      console.error('리뷰 수정 중 오류가 발생했습니다:', error.response ? error.response.data : error.message);
    }
  };
  
  

  const handleReviewDelete = async (reviewid) => {
    if (!userId) {
      alert('로그인 후 사용 가능합니다.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/bookreviews/${reviewid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('리뷰가 삭제되었습니다.');
      getBook();
    } catch (error) {
      console.error('리뷰 삭제 중 오류가 발생했습니다:', error.response ? error.response.data : error.message);
    }
  };

  useEffect(() => {
    getBook();
  }, [itemid]);

  if (!book) {
    return <div>Loading...</div>;
  }

  const formatPrice = (price) => {
    if (price === undefined || price === null) {
      return '0';
    }
    return price.toLocaleString('ko-KR');
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (totalRating / reviews.length).toFixed(1);
  };

  const navigateToUsedBookWrite = () => {
    navigate('/UsedBookWrite', { state: { book } }); // 책 정보를 상태로 전달
  };

  return (
    <div className='bookShop-container'>
      <Header />
      <div className='bookShop'>
        <div className="breadcrumb">
          <a href="/book">Home</a> / {book.title}
        </div>
        <div className="product-details">
          <div className="product-image">
            <img src={book.coverimage} alt={book.title} />
            <button className="heart-button" onClick={handleShowModal}>
              {isFavorite ? <FaHeart /> : <FaRegHeart />}
            </button>
          </div>
          <div className="product-info">
            <h1>{book.title}</h1>
            <p className="author">작가: {book.author}</p>
            <p className="publisher">출판사: {book.publisher}</p>
            <p className="pubDate">출판일: {book.publicationdate ? book.publicationdate.slice(0, 10) : '날짜 정보 없음'}</p>
            <p className="sku">장르: {book.categorylarge}</p>
            <p className="price">₩{formatPrice(book.pricestandard)}</p>
            <label>수량</label>
            <input type="number" defaultValue="1" min="1" />
            <div className="quantity-and-buttons">
              <button className="addcart" onClick={() => AddToCart(book.title)}>
                <span className="addcartspan">Add to Cart</span>
              </button>
              <button className="buy-now" onClick={() => handleBuyNow(book.title)}>
                Buy Now
                <svg className="buy-svgIcon" viewBox="0 0 576 512">
                  <path d="M512 80c8.8 0 16 7.2 16 16v32H48V96c0-8.8 7.2-16 16-16H512zm16 144V416c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V224H528zM64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V96c0-35.3-64-64-64-64H64zm56 304c-13.3 0-24 10.7-24 24s10.7 24 24 24h48c13.3 0 24-10.7 24-24s-10.7-24-24-24H120zm128 0c-13.3 0-24 10.7-24 24s10.7 24 24 24H360c13.3 0 24-10.7 24-24s-10.7-24-24-24H248z"></path>
                </svg>
              </button>
              <div className="used-book-status">
                <Button className="used-book-button" variant="info" onClick={navigateToUsedBookWrite}>중고책 등록</Button>
              </div>
            </div>
          </div>
        </div>
        <div className="product-description">
          <h2>PRODUCT INFO</h2>
          <p>
            {book.description || "No description available."}
          </p>
        </div>
        <div className="book-reviews">
          <h2>리뷰</h2>
          <h3>평균 {calculateAverageRating()} / 5</h3>
          {currentReviews.map((review) => (
            <div key={review.reviewid} className="book-review">
              <div className="book-review-header">
                <span>아이디: {review.memberid}</span>
                <span>작성일: {new Date(review.createdat).toLocaleDateString()}</span>
                <div className="book-review-rating">
                  {Array.from({ length: 5 }, (_, index) => (
                    index < review.rating ? (
                      <FaStar key={index} color="#ffcc00" />
                    ) : (
                      <FaRegStar key={index} color="#ffcc00" />
                    )
                  ))}
                </div>
                {review.memberid === userId && (
                  <div className="review-actions">
                    <button
                      className="edit-review-button"
                      onClick={() => {
                        setEditReviewId(review.reviewid);
                        setEditReview({ rating: review.rating, comment: review.comment });
                        setIsEditingReview(true);
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="delete-review-button"
                      onClick={() => handleReviewDelete(review.reviewid)}
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                )}
              </div>
              <div className="book-review-comment">
                {review.comment}
              </div>
              <hr />
            </div>
          ))}
          {isEditingReview && (
            <div className="review-form">
              <div className="rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    color={star <= editReview.rating ? "#ffcc00" : "#ccc"}
                    onClick={() => setEditReview({ ...editReview, rating: star })}
                  />
                ))}
              </div>
              <textarea
                value={editReview.comment}
                onChange={(e) => setEditReview({ ...editReview, comment: e.target.value })}
                placeholder="리뷰를 수정하세요"
              />
              <Button variant="primary" onClick={handleReviewEdit}>
                수정 제출
              </Button>
            </div>
          )}
          <div className="review-pagination">
            <button onClick={() => paginateReviews(currentReviewPage - 1)} disabled={currentReviewPage === 1}>
              &lt;
            </button>
            <span>{currentReviewPage}</span>
            <button onClick={() => paginateReviews(currentReviewPage + 1)} disabled={currentReviewPage === Math.ceil(reviews.length / reviewsPerPage)}>
              &gt;
            </button>
          </div>
          {!hasReviewed && (
            <>
              {showReviewForm && (
                <div className="review-form">
                  <div className="rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        color={star <= newReview.rating ? "#ffcc00" : "#ccc"}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                      />
                    ))}
                  </div>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="리뷰를 작성하세요"
                  />
                  <Button variant="primary" onClick={handleReviewSubmit}>
                    제출
                  </Button>
                </div>
              )}

              <button onClick={() => setShowReviewForm(!showReviewForm)} className="add-review-button">
                리뷰 작성
              </button>
            </>
          )}
        </div>
        <div className="return-policy">
          <h2>반품/교환</h2>
          <p>주문/배송내역 → 주문조회 → 반품/교환 신청</p>
          <p>
            변심반품의 경우 수령 후 7일 이내, 상품의 결함 및 계약내용과 다를 경우 문제점 발견 후 30일 이내
          </p>
          <h2>반품/교환 불가</h2>
          <p> 1. 소비자의 책임 있는 사유로 상품 등이 손실 또는 훼손된 경우 (단지 확인을 위한 포장 훼손은 제외)</p>
          <p> 2. 소비자의 사용, 포장 개봉에 의해 상품 등의 가치가 현저히 감소한 경우</p>
          <p> 3. 복제가 가능한 상품 등의 포장을 훼손한 경우</p>
        </div>
      </div>
      <footer className="main-footer">
        <p>&copy; 2024 Book Adventure. All rights reserved.</p>
      </footer>
      {showModal && (
        <div
          className="custom-modal"
          style={{
            top: `${modalPosition.top}px`,
            left: `${modalPosition.left}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="modal-header">
            <h5 className="modal-title">독서 상태</h5>
          </div>
          <div className="modal-body">
            <div className="wishlist-option">
              <input
                type="radio"
                id="to-read"
                name="readingStatus"
                value="TO_READ"
                checked={readingStatus === 'TO_READ'}
                onChange={(e) => setReadingStatus(e.target.value)}
              />
              <label htmlFor="to-read">읽을 책</label>
            </div>
            <div className="wishlist-option">
              <input
                type="radio"
                id="reading"
                name="readingStatus"
                value="READING"
                checked={readingStatus === 'READING'}
                onChange={(e) => setReadingStatus(e.target.value)}
              />
              <label htmlFor="reading">읽고 있는 책</label>
            </div>
            <div className="wishlist-option">
              <input
                type="radio"
                id="read"
                name="readingStatus"
                value="READ"
                checked={readingStatus === 'READ'}
                onChange={(e) => setReadingStatus(e.target.value)}
              />
              <label htmlFor="read">읽은 책</label>
            </div>
          </div>
          <div className="modal-footer">
            <Button variant="secondary" onClick={handleCloseModal}>
              취소
            </Button>
            <Button variant="primary" onClick={handleSave}>
              저장
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookShop;
