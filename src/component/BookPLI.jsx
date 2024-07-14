import React, { useState } from 'react';
import './Play.css'; // Assuming styles are placed here

const BookPLI = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div id="PLIBody">
    <div style={{ fontFamily: 'Quicksand' }}>
      <center>
        <div id="turntable">
          <div id="table-shadow"></div>
          <div id="table-feet"></div>
          <div id="wood">
            {/* These divs represent the wood grain effects */}
            <div id="grain1"></div>
            {/* Add remaining grains as needed */}
          </div>
          <div id="wood2">
            {/* Additional wood grain divs */}
            <div id="grain7"></div>
            {/* Add remaining grains as needed */}
          </div>
          <div id="table"></div>
          <div id="button" style={{ top: isPlaying ? '157px' : '155px', boxShadow: isPlaying ? '0px 0px 0px #1a1a1a' : '2px 2px 0px #1a1a1a' }} onClick={togglePlay}></div>
          <div id="disk" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
            <div id="label"></div>
          </div>
          <div id="axis-shadow"></div>
          <div id="axis"></div>
          <div id="arm-shadow"></div>
          <div id="weight-shadow"></div>
          <div id="base">
            <div id="axle-shadow"></div>
          </div>
          <div id="lever"></div>
          <div id="weight"></div>
          <div id="axle"></div>
          <div id="arm"></div>
          <div id="head"></div>
        </div>
      </center>
    </div>
    </div>
  );
};

export default BookPLI;
