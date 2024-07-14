// PlaylistPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode'; // Import jwtDecode
import Header from './Header';
import BookPLI from './BookPLI';
import './Play.css';

const PlaylistPage = () => {
  const [books, setBooks] = useState([]);
  const [visibleBooks, setVisibleBooks] = useState(15);
  const [playlistName, setPlaylistName] = useState('');
  const [playlists, setPlaylists] = useState([]);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserId(decodedToken.id);
      } catch (error) {
        console.error('토큰 디코딩 중 에러 발생:', error);
      }
    }

    axios
      .get('http://localhost:9091/api/book')
      .then((response) => {
        setBooks(response.data);
      })
      .catch((error) => {
        console.error('책 정보를 가져오는 중 에러가 발생했습니다!', error);
      });

    const savedPlaylists = JSON.parse(localStorage.getItem('playlists')) || [];
    setPlaylists(savedPlaylists);
  }, []);

  const handleLoadMore = () => {
    setVisibleBooks((prevVisibleBooks) => prevVisibleBooks + 15);
  };

  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return; // 로그인하지 않았을 경우 함수를 여기서 종료
    }

    const decodedToken = jwtDecode(token);
    const creatorId = decodedToken.id;

    if (playlistName && selectedBooks.length > 0) {
      const coverBooks = getRandomBooks(selectedBooks, 4);
      const newPlaylist = { name: playlistName, books: selectedBooks, coverBooks, creatorId };
      axios
        .post('/playlists', newPlaylist, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          const updatedPlaylists = [...playlists, { ...newPlaylist, id: response.data.id }];
          setPlaylists(updatedPlaylists);
          localStorage.setItem('playlists', JSON.stringify(updatedPlaylists));
          setPlaylistName('');
          setSelectedBooks([]);
        })
        .catch((error) => {
          console.error('플레이리스트 생성 중 에러가 발생했습니다!', error);
        });
    }
  };

  const handleSelectBook = (book) => {
    setSelectedBooks((prevSelectedBooks) => {
      if (prevSelectedBooks.includes(book)) {
        return prevSelectedBooks.filter((b) => b !== book);
      } else {
        return [...prevSelectedBooks, book];
      }
    });
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setVisibleBooks(15);
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.publisher.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRandomBooks = (books, num) => {
    if (books.length <= num) return books;
    const shuffled = [...books].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
  };

  const handlePlaylistClick = (index) => {
    navigate(`/playlists/${index}`);
  };

  return (
    <div>
      <Header userId={userId} setUserId={setUserId} />
    <div className="playlist-container">
      <BookPLI />
      
      <h1>북 플레이리스트 만들기</h1>
      <br />
      <div className="search-bar-container">
        <div className="search-bar">
          <FaSearch />
          <input
            type="text"
            name="search"
            placeholder="책 제목, 작가 이름 또는 출판사 검색"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>
      <form className="playlist-form" onSubmit={handleCreatePlaylist}>
        <input
          className="input-field"
          type="text"
          name="playlistName"
          placeholder="플레이리스트 이름"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
        />
        <button className="button" type="submit">플레이리스트 생성</button>
      </form>
      {searchQuery && (
        <div className="book-list-container">
          {filteredBooks.slice(0, visibleBooks).map((book, index) => (
            <div
              className={`book-item ${selectedBooks.includes(book) ? 'selected' : ''}`}
              key={index}
              onClick={() => handleSelectBook(book)}
            >
              <img src={book.coverimage} alt={book.title} />
              {selectedBooks.includes(book) && (
                <img
                  className="paw-stamp"
                  src="https://img.icons8.com/emoji/96/000000/paw-prints.png"
                  alt="Paw Stamp"
                />
              )}
              <h3>{book.title}</h3>
              <p>{book.author}</p>
            </div>
          ))}
        </div>
      )}
      {searchQuery && visibleBooks < filteredBooks.length && (
        <button className="load-more-button" onClick={handleLoadMore}>더보기</button>
      )}
      <h2>앙큼 독자들의 PICK</h2>
      <div className="playlists-wrapper">
        {playlists.length > 0 ? (
          playlists.map((playlist, index) => (
            <div
              className="playlist-item"
              key={index}
              onClick={() => handlePlaylistClick(index)}
            >
              <div className="playlist-image-grid">
                {playlist.coverBooks.map((book, idx) => (
                  <img
                    className="playlist-image"
                    key={idx}
                    src={book.coverimage}
                    alt={book.title}
                  />
                ))}
              </div>
              <div className="playlist-info">
                <h3> {playlist.name}<br />{playlist.creatorId}</h3>
              </div>
            </div>
          ))
        ) : (
          <p>생성된 플레이리스트가 없습니다.</p>
        )}
      </div>
    </div>
    <footer className="main-footer">
            <p>&copy; 2024 Book Adventure. All rights reserved.</p>
            </footer>
    </div>
  );
};

export default PlaylistPage;
