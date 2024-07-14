import React from 'react';
import styled, { keyframes, css } from 'styled-components';

const slideLeft = keyframes`
  0% { background-position: 0 0; }
  100% { background-position: -3000px 0; }
`;

const slideRight = keyframes`
  0% { background-position: 0 0; }
  100% { background-position: 3000px 0; }
`;

const SliderContainer = styled.div`
  position: relative;
  overflow: hidden;
  height: 200px; 
  margin-top: 10px;
`;

const Slide = styled.div`
  width: 100%;
  height: 200px; /* 슬라이더 높이 조정 */
  background-size: cover;
  background-position: 0 0;
  animation: ${({ direction }) =>
    direction === 'left' ? css`${slideLeft} 100s linear infinite` : css`${slideRight} 100s linear infinite`};
  background-image: ${({ $imageUrl }) => `url(${$imageUrl})`};
`;

const BookSlider = ({ direction, imageUrl }) => {
  return (
    <SliderContainer>
      <Slide direction={direction} $imageUrl={imageUrl} />
    </SliderContainer>
  );
};

export default BookSlider;
