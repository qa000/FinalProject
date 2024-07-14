import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MyPage.css'

const MyList = () => {
  const [data, setData] = useState({
    playlists: [],
    meetings: []
  });

  const navigate = useNavigate();

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

      const response = await axios.get('http://localhost:5000/api/my-meetings', {
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

  const handlePlaylistClick = (playlistName) => {
    const matchingPlaylist = data.playlists.find(pl => pl.name === playlistName);
    if (matchingPlaylist) {
      const playlistIndex = data.playlists.indexOf(matchingPlaylist);
      navigate(`/playlist/${playlistIndex}`);
    }
  };

  const handleMeetingClick = (meetingId) => {
    navigate(`/meeting/${meetingId}`);
  };

  return (
    <div className='MyList-section' >
      <h1>내 플레이리스트 정보</h1>
      <div className="myList-playlists-wrapper">
        {data.playlists && data.playlists.length > 0 ? (
          data.playlists.map((playlist, index) => {
            const coverBooks = JSON.parse(playlist.cover_books);
            return (
              <div
                className="myList-playlist-item"
                key={index}
                onClick={() => handlePlaylistClick(playlist.name)}
              >
                <div className="myList-playlist-image-grid">
                  {coverBooks.map((book, idx) => (
                    <img
                      className="myList-playlist-image"
                      key={idx}
                      src={book.coverimage}
                      alt={book.title}
                    />
                  ))}
                </div>
                <div className="myList-playlist-info">
                  <h3 className="myList-playlist-title">
                    {playlist.name}
                  </h3>
                </div>
              </div>
            );
          })
        ) : (
          <p>생성된 플레이리스트가 없습니다.</p>
        )}
      </div>

      <h1>내 독서모임 정보</h1>
      <div className="myList-meetings-wrapper">
        {data.meetings && data.meetings.length > 0 ? (
          data.meetings.map((meeting, index) => (
            <div
              className="myList-meeting-item"
              key={index}
              onClick={() => handleMeetingClick(meeting.id)}
            >
              <img
                className="myList-meeting-image"
                src={meeting.imgSrc}
                alt={meeting.title}
              />
              <div className="myList-meeting-info">
                <h3 className="myList-meeting-title">{meeting.title}</h3>
              </div>
            </div>
          ))
        ) : (
          <p>생성된 독서모임이 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default MyList;
