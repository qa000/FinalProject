import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MyPage.css';

const MyBook = () => {
    const [readingList, setReadingList] = useState([]);
    const [bookInfos, setBookInfos] = useState({});
    const userId = localStorage.getItem('userId');
    const navigate = useNavigate();

    const [currentToReadPage, setCurrentToReadPage] = useState(1);
    const [currentReadingPage, setCurrentReadingPage] = useState(1);
    const [currentReadPage, setCurrentReadPage] = useState(1);
    const itemsPerPage = 3;

    useEffect(() => {
        const fetchReadingList = async () => {
            if (userId) {
                try {
                    const response = await axios.get(`http://localhost:9091/api/readinglist/${userId}`);
                    const uniqueList = filterRecentEntries(response.data);
                    setReadingList(uniqueList);
                    fetchBookInfos(uniqueList);
                } catch (error) {
                    console.error('Error fetching reading list', error);
                }
            }
        };

        const fetchBookInfos = async (list) => {
            const bookInfoPromises = list.map(item => axios.get(`http://localhost:9091/api/book/view/${item.bookId}`));
            try {
                const bookInfoResponses = await Promise.all(bookInfoPromises);
                const bookInfoData = {};
                bookInfoResponses.forEach(response => {
                    if (response.data) {
                        bookInfoData[response.data.itemid] = response.data;
                    }
                });
                setBookInfos(bookInfoData);
            } catch (error) {
                console.error('Error fetching book info', error);
            }
        };

        const filterRecentEntries = (list) => {
            const bookMap = {};
            list.forEach(item => {
                if (!bookMap[item.bookId] || new Date(item.addedAt) > new Date(bookMap[item.bookId].addedAt)) {
                    bookMap[item.bookId] = item;
                }
            });
            return Object.values(bookMap);
        };

        fetchReadingList();
    }, [userId]);

    if (!userId) {
        return <div>로그인이 필요합니다.</div>;
    }

    const toReadList = readingList.filter(item => item.status === 'TO_READ');
    const readingListStatus = readingList.filter(item => item.status === 'READING');
    const readList = readingList.filter(item => item.status === 'READ');

    const handleBookClick = (itemid) => {
        navigate(`/book/view/${itemid}`);
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
        <>
            <div className="page-container">
                <div className="reading-section">
                    <h2>읽을 책 목록 (TO_READ)</h2>
                    {toReadList.length > 0 ? (
                        <>
                            <ul>
                                {paginateList(toReadList, currentToReadPage).map((item) => (
                                    <li key={item.id} onClick={() => handleBookClick(item.bookId)} style={{ cursor: 'pointer' }}>
                                        {bookInfos[item.bookId] && (
                                            <>
                                                <img src={bookInfos[item.bookId].coverimage} alt={bookInfos[item.bookId].title} style={{ width: '50px', height: 'auto' }} />
                                                <div>
                                                    <span>{bookInfos[item.bookId].title}</span>
                                                    <br />
                                                    <span className="date">추가된 날짜: {item.addedAt ? new Date(item.addedAt).toLocaleString() : 'N/A'}</span>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <div className="mypage-pagination">
                                <button onClick={() => paginate(setCurrentToReadPage, currentToReadPage, Math.ceil(toReadList.length / itemsPerPage), -1)} disabled={currentToReadPage === 1}>
                                    &lt; 이전
                                </button>
                                <span>{currentToReadPage}</span>
                                <button onClick={() => paginate(setCurrentToReadPage, currentToReadPage, Math.ceil(toReadList.length / itemsPerPage), 1)} disabled={currentToReadPage === Math.ceil(toReadList.length / itemsPerPage)}>
                                    다음 &gt;
                                </button>
                            </div>
                        </>
                    ) : (
                        <p>읽을 책 목록이 없습니다.</p>
                    )}
                </div>

                <div className="reading-section">
                    <h2>읽고 있는 책 목록 (READING)</h2>
                    {readingListStatus.length > 0 ? (
                        <>
                            <ul>
                                {paginateList(readingListStatus, currentReadingPage).map((item) => (
                                    <li key={item.id} onClick={() => handleBookClick(item.bookId)} style={{ cursor: 'pointer' }}>
                                        {bookInfos[item.bookId] && (
                                            <>
                                                <img src={bookInfos[item.bookId].coverimage} alt={bookInfos[item.bookId].title} style={{ width: '50px', height: 'auto' }} />
                                                <div>
                                                    <span>{bookInfos[item.bookId].title}</span>
                                                    <br />
                                                    <span className="date">추가된 날짜: {item.addedAt ? new Date(item.addedAt).toLocaleString() : 'N/A'}</span>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <div className="mypage-pagination">
                                <button onClick={() => paginate(setCurrentReadingPage, currentReadingPage, Math.ceil(readingListStatus.length / itemsPerPage), -1)} disabled={currentReadingPage === 1}>
                                    &lt; 이전
                                </button>
                                <span>{currentReadingPage}</span>
                                <button onClick={() => paginate(setCurrentReadingPage, currentReadingPage, Math.ceil(readingListStatus.length / itemsPerPage), 1)} disabled={currentReadingPage === Math.ceil(readingListStatus.length / itemsPerPage)}>
                                    다음 &gt;
                                </button>
                            </div>
                        </>
                    ) : (
                        <p>읽고 있는 책 목록이 없습니다.</p>
                    )}
                </div>

                <div className="reading-section">
                    <h2>읽은 책 목록 (READ)</h2>
                    {readList.length > 0 ? (
                        <>
                            <ul>
                                {paginateList(readList, currentReadPage).map((item) => (
                                    <li key={item.id} onClick={() => handleBookClick(item.bookId)} style={{ cursor: 'pointer' }}>
                                        {bookInfos[item.bookId] && (
                                            <>
                                                <img src={bookInfos[item.bookId].coverimage} alt={bookInfos[item.bookId].title} style={{ width: '50px', height: 'auto' }} />
                                                <div>
                                                    <span>{bookInfos[item.bookId].title}</span>
                                                    <br />
                                                    <span className="date">추가된 날짜: {item.addedAt ? new Date(item.addedAt).toLocaleString() : 'N/A'}</span>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <div className="mypage-pagination">
                                <button onClick={() => paginate(setCurrentReadPage, currentReadPage, Math.ceil(readList.length / itemsPerPage), -1)} disabled={currentReadPage === 1}>
                                    &lt; 이전
                                </button>
                                <span>{currentReadPage}</span>
                                <button onClick={() => paginate(setCurrentReadPage, currentReadPage, Math.ceil(readList.length / itemsPerPage), 1)} disabled={currentReadPage === Math.ceil(readList.length / itemsPerPage)}>
                                    다음 &gt;
                                </button>
                            </div>
                        </>
                    ) : (
                        <p>읽은 책 목록이 없습니다.</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default MyBook;
