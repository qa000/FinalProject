import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaRegComment, FaRegThumbsUp, FaRegEye } from 'react-icons/fa';
import Header from './Header';

const BookBoard = () => {
  const [boardList, setBoardList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 7;

  const getBoardData = async () => {
    try {
      const response = await axios.get('http://localhost:9091/api/board/list');
      setBoardList(response.data);
    } catch (error) {
      console.error('Error fetching board data:', error);
    }
  };

  useEffect(() => {
    getBoardData();
  }, []);

  // 페이지네이션
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = boardList.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(boardList.length / postsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div>
      <Header />
      <div className='BookBoard'>
        <h1 className='text-center my-5'>게시글 목록</h1>

        {boardList.length > 0 ? (
          <>
            <Table className='bookboard-table'>
              <thead className='table-head'>
                <tr>
                  <th>번호</th>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>
                    <FaRegComment />
                  </th>
                  <th>
                    <FaRegThumbsUp />
                  </th>
                  <th>
                    <FaRegEye />
                  </th>
                  <th>게시일</th>
                </tr>
              </thead>
              <tbody className='table-body'>
                {currentPosts.map((b) => (
                  <tr key={b.bnum}>
                    <td>{b.bnum}</td>
                    <td>
                      <Link to={`/board/view/${b.bnum}`}>{b.title}</Link>
                    </td>
                    <td>{b.writer}</td>
                    <td>{b.commentCount}</td>
                    <td>{b.likes}</td>
                    <td>{b.hit}</td>
                    <td>{new Date(b.regdate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className='table-button'>
              <Link to='/write'>
                <Button className='mx-2'>작성하기</Button>
              </Link>
            </div>

            {/* 페이지네이션 */}
            <div className="board-pagination">
              <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                &lt; 이전
              </button>
              <span className="board-pagination-span">{currentPage}</span>
              <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
                다음 &gt;
              </button>
            </div>
          </>
        ) : (
          <>
            <p className='text-center'>게시글이 없습니다.</p>
            <div className='table-button'>
              <Link to='/write'>
                <Button className='mx-2'>작성하기</Button>
              </Link>
            </div>
          </>
        )}
      </div>
      <footer className="main-footer">
        <p>&copy; 2024 Book Adventure. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default BookBoard;
