import React, { useEffect, useState } from 'react';
import './Book.css';
import Header from './Header';
import axios from 'axios';
import { Link } from 'react-router-dom';
import QAService from './QAService';
import ScrollButton from './ScrollButton';
import BookSlider from './BookSlider';
import AnimatedSection from './AnimatedSection';
import { useTheme } from '../contexts/ThemeContext';
import Footer from './Footer';

const BookMain = () => {
  const [bookList, setBookList] = useState([]);
  const { theme } = useTheme(); // useTheme 훅을 통해 theme 가져오기

  const getBookList = async () => {
    try {
      const response = await axios.get('http://localhost:9091/api/main');
      setBookList(response.data);
    } catch (error) {
      console.error('Error fetching book list:', error);
    }
  };

  useEffect(() => {
    getBookList();
  }, []);

  const formatPrice = (price) => {
    return price.toLocaleString('ko-KR');
  };

  return (
    <div className={`main-page-container ${theme}`}>
      <Header />
      <BookSlider direction="left" imageUrl="https://d3udu241ivsax2.cloudfront.net/v3/images/brand/slide01.a7cc998bd9e966d0d94956bef997e0c8.png" />
      <br />
      <BookSlider direction="right" imageUrl="https://d3udu241ivsax2.cloudfront.net/v3/images/brand/slide03.2246c95c20916dc665da8a84af1cd2ad.png" />
      
      <section className="best gradient-background">
        <AnimatedSection
          id="section1"
          title="RECOMMENDED BOOKS"
          bgColor="transparent" 
          color={theme === 'light' ? '#000' : '#fff'}
        />
        <div className="book-list">
          {bookList.map((b) => (
            <div className="book-item" key={b.itemid}>
              <div className="cover-container">
                <img src={b.coverimage} alt={b.title} />
                <Link to={`/book/view/${b.itemid}`} className="main-view">상세보기</Link>
              </div>
              <div className="title">{b.title}</div>
              <div className="price">₩{formatPrice(b.pricestandard)}</div>
            </div>
          ))}
        </div>
      </section>
      <QAService />
      <ScrollButton /> 
      <Footer />
    </div>
  );
};

export default BookMain;
