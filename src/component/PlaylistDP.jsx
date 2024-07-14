import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlay, FaTrash } from 'react-icons/fa';
import {jwtDecode} from 'jwt-decode';    // npm install jwt-decode 해주세요
import MusicPlayer from './MusicPlayer';
import Header from './Header';
import './Play.css'; // 스타일 임포트

const PlaylistDP = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [playlistUri, setPlaylistUri] = useState('');
  const [isMusicPlayerVisible, setIsMusicPlayerVisible] = useState(false);
  const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
  const playlist = playlists[id];

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
  }, []);

  if (!playlist) {
    return <div className="playlist-details-container">플레이리스트 정보를 불러올 수 없습니다.</div>;
  }

  const handleDeletePlaylist = () => {
    if (playlist.creatorId !== userId) {
      alert('권한이 없습니다.');
      return;
    }
    
    const updatedPlaylists = playlists.filter((_, index) => index !== parseInt(id));
    localStorage.setItem('playlists', JSON.stringify(updatedPlaylists));
    navigate('/playlists');
  };

  const handlePlay = () => {
    setIsMusicPlayerVisible(!isMusicPlayerVisible);

    if (!isMusicPlayerVisible) {
      console.log('재생 버튼이 클릭되었습니다.'); // 로그 추가
      const categories = playlist.books.map(book => book.categoryname_large);
      const categoryCounts = categories.reduce((counts, category) => {
        counts[category] = (counts[category] || 0) + 1;
        return counts;
      }, {});

      const mostFrequentCategory = Object.keys(categoryCounts).reduce((a, b) =>
        categoryCounts[a] > categoryCounts[b] ? a : b
      );

      console.log('가장 많은 카테고리:', mostFrequentCategory); // 로그 추가

      let spotifyPlaylistUri;
      switch (mostFrequentCategory) {
        case '에세이':
          spotifyPlaylistUri = '4pu0KZlgShyCaMMBzePWVk'; // 에세이에 어울리는 플레이리스트 URI
          break;
        case '자기계발':
          spotifyPlaylistUri = '37i9dQZF1DX2XmsXL2WBQ3'; // 자기계발에 어울리는 플레이리스트 URI
          break;
        case '소설/시/희곡':
          spotifyPlaylistUri = '37i9dQZF1DX3PIPIT6lEg5'; // 소설/시에 어울리는 플레이리스트 URI
          break;
        case '인문학':
          spotifyPlaylistUri = '37i9dQZF1DX5trt9i14X7j'; // 인문학에 어울리는 플레이리스트 URI
          break;
        case '경제경영':
          spotifyPlaylistUri = '37i9dQZF1DWXLeA8Omikj7'; // 경제경영에 어울리는 플레이리스트 URI
          break;
        case '과학':
          spotifyPlaylistUri = '37i9dQZF1DX1s9knjP51Oa'; // 과학에 어울리는 플레이리스트 URI
          break;
        case '예술':
          spotifyPlaylistUri = '37i9dQZF1DX3YPJ6dDQhLl'; // 예술에 어울리는 플레이리스트 URI
          break;
        case '역사':
          spotifyPlaylistUri = '37i9dQZF1DX4fpCWaHOned'; // 역사에 어울리는 플레이리스트 URI
          break;
        case '철학':
          spotifyPlaylistUri = '37i9dQZF1DWU76KTKX2V6t'; // 철학에 어울리는 플레이리스트 URI
          break;
        case '심리학':
          spotifyPlaylistUri = '37i9dQZF1DWZqd5JICZI0u'; // 심리학에 어울리는 플레이리스트 URI
          break;
        case '종교':
          spotifyPlaylistUri = '37i9dQZF1DWU7E6PdhcA6t'; // 종교에 어울리는 플레이리스트 URI
          break;
        case '건강':
          spotifyPlaylistUri = '37i9dQZF1DWV07g8z6qKJm'; // 건강에 어울리는 플레이리스트 URI
          break;
        case '여행':
          spotifyPlaylistUri = '37i9dQZF1DX0BcQWzuB7ZO'; // 여행에 어울리는 플레이리스트 URI
          break;
        case '요리':
          spotifyPlaylistUri = '37i9dQZF1DX1dzX6bg8rG8'; // 요리에 어울리는 플레이리스트 URI
          break;
        default:
          spotifyPlaylistUri = '4pu0KZlgShyCaMMBzePWVk'; // 기본 플레이리스트 URI
      }

      setPlaylistUri(spotifyPlaylistUri);
    } else {
      setPlaylistUri('');
    }
  };

  return (
    <div>
      <Header />
    <div className="playlist-details-container">
      <div className="header-container">
        <button className="back-button" onClick={() => navigate('/playlists')}>
          <FaArrowLeft />
        </button>
      </div>
     
      {/* <div className="playlist-cover">
          <BookPLI />
        </div> */}
        <h1 className="playlist-title">{playlist.name}</h1>
        <p className="playlist-author">{playlist.books.length} books</p>
        <div className="playlist-button-container">
          <button className="playlist-play-button" onClick={handlePlay}>
            <FaPlay /> {isMusicPlayerVisible ? 'STOP' : '재생'}
          </button>
          <button className="playlist-delete-button" onClick={handleDeletePlaylist}>
            <FaTrash /> 삭제
          </button>
        </div>

      <ul className="playlist-details-list">
        {isMusicPlayerVisible && <MusicPlayer playlistUri={playlistUri} />}
        {playlist.books.map((book, idx) => (
          <li key={idx}>
            <img src={book.coverimage} alt={book.title} />
            <span>{book.title}</span>
            <span>{book.author}</span>
          </li>
        ))}
      </ul>
    </div>
    <footer className="main-footer">
     <p>&copy; 2024 Book Adventure. All rights reserved.</p>
    </footer>
    </div>
  );
};

export default PlaylistDP;
