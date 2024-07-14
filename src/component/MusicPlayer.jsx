import React from 'react';
import styled from 'styled-components';

const IframeWrapper = styled.div`
  margin-top: 20px;
  width: 100%;
  max-width: 800px;
`;

const MusicPlayer = ({ playlistUri }) => {
  return (
    <IframeWrapper>
      <iframe
        title="Spotify Playlist"
        style={{ borderRadius: '12px' }}
        src={`https://open.spotify.com/embed/playlist/${playlistUri}?utm_source=generator`}
        width="100%"
        height="352"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      ></iframe>
    </IframeWrapper>
  );
};

export default MusicPlayer;
