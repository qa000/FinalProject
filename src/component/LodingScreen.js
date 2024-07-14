import React from 'react';
import { css, keyframes } from '@emotion/react';
/** @jsxImportSource @emotion/react */
import pawImage from './assets/paw.png';

const walk = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  50% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
`;

const LoadingScreen = ({ percentage }) => {
  return (
    <div css={styles.container}>
      <div css={styles.pawContainer}>
        <img src={pawImage} alt="Loading" css={[styles.pawImage, styles.paw1]} />
        <img src={pawImage} alt="Loading" css={[styles.pawImage, styles.paw2]} />
        <img src={pawImage} alt="Loading" css={[styles.pawImage, styles.paw3]} />
        <img src={pawImage} alt="Loading" css={[styles.pawImage, styles.paw4]} />
      </div>
      <div css={styles.loadingText}>Experience is loading</div>
      <div css={styles.loadingPercentage}>{percentage}%</div>
    </div>
  );
};

const styles = {
    container: css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 0;
      background: linear-gradient(to bottom, #f0f4f8, #ffffff);
      font-family: Arial, sans-serif;
    `,
    pawContainer: css`
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      height: 240px; 
      transform: translateX(-30px);
    `,
    pawImage: css`
      width: 50px;
      height: 50px;
      position: absolute;
      animation: ${walk} 2s linear infinite;
    `,
    paw1: css`
      animation-delay: 0s;
      bottom: 0;
      left: 20px; 
    `,
    paw2: css`
      animation-delay: 0.5s;
      bottom: 60px;
      left: -20px; 
    `,
    paw3: css`
      animation-delay: 1s;
      bottom: 120px;
      left: 20px; 
    `,
    paw4: css`
      animation-delay: 1.5s;
      bottom: 180px;
      left: -20px; 
    `,
    loadingText: css`
      margin-top: 20px;
      color: #888;
      font-size: 14px;
    `,
    loadingPercentage: css`
      margin-top: 10px;
      color: #888;
      font-size: 16px;
    `,
  };

export default LoadingScreen;
