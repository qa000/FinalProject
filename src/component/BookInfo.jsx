import React, { useEffect, useState } from 'react';
import './Book.css';
import Header from './Header';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Footer from './Footer';

const BookInfo = () => {
  const [bookList, setBookList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [aladinSearchTerm, setAladinSearchTerm] = useState('');
  const [aladinSearchResults, setAladinSearchResults] = useState([]);
  const [aladinSearchError, setAladinSearchError] = useState(null);
  
  const booksPerPage = 20;
  const ALADIN_TTBKEY = "ttbjeyu771001001"; // 알라딘 API
  const navigate = useNavigate();

  const formatPrice = (price) => {
    if (price === undefined || price === null) {
      return '0';
    }
    return price.toLocaleString('ko-KR');
  };

  // 서버에서 책 목록 가져오기
  const getBookList = async (category = 'All') => {
    try {
      const response = await axios.get('/book', { params: { category } });
      setBookList(response.data);
    } catch (error) {
      console.error('책 목록 가져오기 오류:', error);
    }
  };

  // 알라딘 검색 실행
  const handleAladinSearch = async () => {
    try {
      const response = await axios.get('/api/ItemSearch.aspx', {
        params: {
          ttbkey: ALADIN_TTBKEY,
          Query: aladinSearchTerm,
          QueryType: 'Keyword',
          MaxResults: 20,
          start: 1,
          Cover: 'Big',
          Output: 'JS',
          Version: '20131101'
        },
      });
      setAladinSearchResults(response.data.item);
      setAladinSearchError(null);
    } catch (error) {
      console.error('알라딘 검색 오류:', error);
      setAladinSearchError('검색 결과를 가져오는 중 오류가 발생했습니다.');
      setAladinSearchResults([]);
    }
  };

  // DB에 책 정보 추가하고 상세보기 페이지로 이동
  const AddToDBAndView = async (book) => {
    const categoryParts = book.categoryName.split('>');
    const bookData = {
      itemid: book.itemId,
      title: book.title.split(' - ')[0].replace(/\([^)]*\)/g, ''),
      author: book.author.split(',')[0].split('(')[0],
      categorylarge: categoryParts[1] || "UNKNOWN",
      categorysmall: categoryParts[3] || "UNKNOWN",
      priceStandard: book.priceStandard,
      reviewrating: book.customerReviewRank,
      publisher: book.publisher,
      publicationdate: book.pubDate || '',
      coverimage: book.cover,
      description: book.description,
    };
    try {
      await axios.post('/addBookToDB', bookData);
      console.log('책 정보를 MySQL에 성공적으로 추가했습니다.');
      navigate(`/book/view/${book.itemId}`);
    } catch (error) {
      console.error('책 정보를 DB에 저장하는 중 오류가 발생했습니다:', error);
      navigate(`/book/view/${book.itemId}`);
    }
  };

  // 카트에 책 추가하기
  const AddToCart = async (title) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(
        '/cart',
        { title },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert('책이 장바구니에 추가되었습니다.');
      navigate('/book'); // 장바구니 페이지로 이동
    } catch (error) {
      console.error('장바구니에 책을 추가하는 중 오류가 발생했습니다:', error);
    }
  };

  // 필터 적용 버튼 클릭 시
  const handleFilterApply = () => {
    setAladinSearchResults([]); // 검색 결과 초기화
    getBookList(selectedCategory);
  };

  // 검색어 입력 시 엔터 키 이벤트 핸들링
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleAladinSearch();
    }
  };

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    getBookList();
  }, []);

  // 페이지네이션
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = bookList.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(bookList.length / booksPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
      <div className="book-info-container">
      <Header />

      {/* 검색 결과 또는 베스트셀러 목록 표시 */}
      <section className="book-info-best">
         <h2>도서 목록</h2>
         
       <div className="book-info-banner">
        {/* 카테고리 선택 UI */}
      <div className="category-select">
        <select 
          id="category" 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="All">전체</option>
          <option value="소설/시/희곡">소설/시/희곡</option>
          <option value="에세이">에세이</option>
          <option value="자기계발">자기계발</option>
          <option value="인문학">인문학</option>
          <option value="경제경영">경제경영</option>
          <option value="Other">기타</option>
          {/* 필요에 따라 추가 카테고리 */}
        </select>
        <button onClick={handleFilterApply}>필터 적용</button>
      </div>

        <div className="aladin-search-bar">
          <input 
            type="text" 
            placeholder="검색어를 입력해주세요" 
            value={aladinSearchTerm}
            onChange={(e) => setAladinSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown} // 엔터 키 감지
          />
          <button onClick={handleAladinSearch}>검색</button>
        </div>
      </div>

        <div className="book-info-list">
          {aladinSearchResults.length > 0 ? (
            // 알라딘 검색 결과 표시
            aladinSearchResults.map(book => (
              <div className="book-info-item" key={book.itemid}>
                <div className="book-info-cover-container">
                  <img src={book.cover} alt={book.title} />
                  <button 
                    className="quick-view" 
                    onClick={() => AddToDBAndView(book)}
                  >
                    상세보기
                  </button>
                </div>
                <div className="book-info-title">{book.title.split(' - ')[0].replace(/\([^)]*\)/g, '')}</div>
                <div className="book-info-price">₩{book.pricestandard ? new Intl.NumberFormat('ko-KR').format(Number(book.pricestandard)) : '가격 정보 없음'}</div>
                <button 
                  className="add-to-cart"
                  onClick={() => AddToCart(book.title.split(' - ')[0].replace(/\([^)]*\)/g, ''))}
                >
                  장바구니 담기
                </button>
              </div>
            ))
          ) : (
            // 베스트셀러 목록 표시
            currentBooks.map((book) => (
              <div className="book-info-item" key={book.itemid}>
                <div className="book-info-cover-container">
                  <img src={book.coverimage} alt={book.title} />
                  <Link to={`/book/view/${book.itemid}`} className="quick-view">상세보기</Link>
                </div>
                <div className="book-info-title">{book.title}</div>
                <div className="price">₩{formatPrice(book.pricestandard)}</div>
                <button 
                  className="add-to-cart"
                  onClick={() => AddToCart(book.title)}
                >
                  장바구니 담기
                </button>
              </div>
            ))
          )}
        </div>

        {/* 페이지네이션 */}
        {!aladinSearchResults.length > 0 && (
          <div className="pagination">
            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
              &lt; 이전
            </button>
            <span className="pagination-span">{currentPage}</span>
            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
              다음 &gt;
            </button>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default BookInfo;
