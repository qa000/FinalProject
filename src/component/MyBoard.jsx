import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MyPage.css';

const MyBoard = () => {
  const [data, setData] = useState({
    boards: [],
    bookreviews: [],
    comments: [],
    playlists: []
  });

  const navigate = useNavigate();

  const [currentBoardPage, setCurrentBoardPage] = useState(1);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [currentCommentPage, setCurrentCommentPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/my-board', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setData(response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        if (error.response.data === 'TokenExpired') {
          alert('세션이 만료되었습니다. 다시 로그인해주세요.');
        } else {
          alert('접근 권한이 없습니다. 다시 로그인해주세요.');
        }
        navigate('/login');
      } else {
        console.error('Error fetching user data:', error);
      }
    }
  };

  const handleBoardClick = (boardId) => {
    navigate(`/board/view/${boardId}`);
  };

  const handleReviewClick = (bookId) => {
    navigate(`/book/view/${bookId}`);
  };

  const handleCommentClick = (boardNum) => {
    navigate(`/board/view/${boardNum}`);
  };

  const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  const paginate = (pageSetter, currentPage, totalPages, direction) => {
    const newPage = currentPage + direction;
    if (newPage > 0 && newPage <= totalPages) {
      pageSetter(newPage);
    }
  };

  const paginateList = (list, currentPage) => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return list.slice(indexOfFirstItem, indexOfLastItem);
  };

  return (
    <div className="my-board">
      <h1>내 글 정보</h1>
      {data.boards.length > 0 ? (
        <>
          <ul>
            {paginateList(data.boards, currentBoardPage).map((board) => (
              <li key={board.bnum} onClick={() => handleBoardClick(board.bnum)}>
                <p>제목: {board.title}</p>
                <p>내용: {truncateText(board.contents, 100)}</p> {/* Adjust maxLength as needed */}
                <p>작성일: {new Date(board.regdate).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
          <div className="mypage-pagination">
            <button onClick={() => paginate(setCurrentBoardPage, currentBoardPage, Math.ceil(data.boards.length / itemsPerPage), -1)} disabled={currentBoardPage === 1}>
              &lt; 이전
            </button>
            <span>{currentBoardPage}</span>
            <button onClick={() => paginate(setCurrentBoardPage, currentBoardPage, Math.ceil(data.boards.length / itemsPerPage), 1)} disabled={currentBoardPage === Math.ceil(data.boards.length / itemsPerPage)}>
              다음 &gt;
            </button>
          </div>
        </>
      ) : (
        <p>글 목록이 없습니다.</p>
      )}

      <h1>내 책 리뷰 정보</h1>
      {data.bookreviews.length > 0 ? (
        <>
          <ul>
            {paginateList(data.bookreviews, currentReviewPage).map((review) => (
              <li key={review.reviewid} onClick={() => handleReviewClick(review.bookid)}>
                <p>책 제목: {review.title}</p>
                <p>평점: {review.rating}</p>
                <p>내용: {truncateText(review.comment, 100)}</p> {/* Adjust maxLength as needed */}
                <p>작성일: {new Date(review.createdat).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
          <div className="mypage-pagination">
            <button onClick={() => paginate(setCurrentReviewPage, currentReviewPage, Math.ceil(data.bookreviews.length / itemsPerPage), -1)} disabled={currentReviewPage === 1}>
              &lt; 이전
            </button>
            <span>{currentReviewPage}</span>
            <button onClick={() => paginate(setCurrentReviewPage, currentReviewPage, Math.ceil(data.bookreviews.length / itemsPerPage), 1)} disabled={currentReviewPage === Math.ceil(data.bookreviews.length / itemsPerPage)}>
              다음 &gt;
            </button>
          </div>
        </>
      ) : (
        <p>책 리뷰 목록이 없습니다.</p>
      )}

      <h1>내 댓글 정보</h1>
      {data.comments.length > 0 ? (
        <>
          <ul>
            {paginateList(data.comments, currentCommentPage).map((comment) => (
              <li key={comment.commentid} onClick={() => handleCommentClick(comment.boardnum)}>
                <p>게시글 제목: {comment.board_title}</p>
                <p>댓글 내용: {truncateText(comment.content, 100)}</p> {/* Adjust maxLength as needed */}
                <p>작성일: {new Date(comment.createdat).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
          <div className="mypage-pagination">
            <button onClick={() => paginate(setCurrentCommentPage, currentCommentPage, Math.ceil(data.comments.length / itemsPerPage), -1)} disabled={currentCommentPage === 1}>
              &lt; 이전
            </button>
            <span>{currentCommentPage}</span>
            <button onClick={() => paginate(setCurrentCommentPage, currentCommentPage, Math.ceil(data.comments.length / itemsPerPage), 1)} disabled={currentCommentPage === Math.ceil(data.comments.length / itemsPerPage)}>
              다음 &gt;
            </button>
          </div>
        </>
      ) : (
        <p>댓글 목록이 없습니다.</p>
      )}
    </div>
  );
};

export default MyBoard;
