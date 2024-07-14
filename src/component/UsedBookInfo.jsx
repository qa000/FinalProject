import React, { useEffect, useState } from 'react';
import './Book.css';
import Header from './Header';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Footer from './Footer';

const UsedBookInfo = () => {
  const [usedBookList, setUsedBookList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const booksPerPage = 20;
  const navigate = useNavigate();

  // 서버에서 중고책 목록 가져오기
  const getUsedBookList = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/used_books_inquir');
      // 중복된 book_id 제거
      const uniqueBooks = response.data.reduce((acc, book) => {
        if (!acc.some(item => item.book_id === book.book_id)) {
          acc.push(book);
        }
        return acc;
      }, []);
      setUsedBookList(uniqueBooks);
    } catch (error) {
      setError('중고책 목록 가져오기 오류: ' + error.message);
    }
    setLoading(false);
  };

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    getUsedBookList();
  }, []);

  // 페이지네이션
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = usedBookList.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(usedBookList.length / booksPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div>
      <Header />
      <div className='usedbook-container'>
         <h2>중고책 목록</h2>
      <section className="book-info-best">
        {loading ? (
          <div>로딩 중...</div>
        ) : error ? (
          <div>{error}</div>
        ) : (
          <div className="book-info-list">
            {currentBooks.map((book) => (
              <div className="book-info-item" key={book.book_id}>
                <div className="book-info-cover-container">
                  <img src={book.coverimage} alt={book.title} />
                  <Link to={`/used_book/view/${book.book_id}`} className="quick-view">상세보기</Link>
                </div>
                <div className="book-info-title">{book.title}</div>
              </div>
            ))}
          </div>
        )}

        <div className="pagination">
          <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
            &lt; 이전
          </button>
          <span>{currentPage}</span>
          <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
            다음 &gt;
          </button>
        </div>
      </section>
      </div>
      <Footer />
    </div>
  );
};

export default UsedBookInfo;
