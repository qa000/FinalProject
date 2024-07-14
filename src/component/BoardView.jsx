import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import './Board.css';
import { Button } from 'react-bootstrap';
import { FaThumbsUp, FaRegThumbsUp, FaExclamationTriangle } from 'react-icons/fa';

const BoardView = () => {
    const { bnum } = useParams();
    const navigate = useNavigate();
    const [board, setBoard] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [editCommentId, setEditCommentId] = useState(null);
    const [editCommentContent, setEditCommentContent] = useState('');
    const [hasLiked, setHasLiked] = useState(false);
    const [hasReported, setHasReported] = useState(false);
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    const getBoardData = async () => {
        try {
            const response = await axios.get(`http://localhost:9091/api/board/view/${bnum}`);
            setBoard(response.data);

            await axios.post(`http://localhost:5000/api/board/view/${bnum}/increment`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Error fetching board data:', error);
        }
    };

    const toggleLike = async () => {
        try {
            if (hasLiked) {
                await axios.post(`http://localhost:5000/api/board/unlike/${bnum}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setHasLiked(false);
                setBoard(prevBoard => ({
                    ...prevBoard,
                    likes: prevBoard.likes - 1
                }));
            } else {
                await axios.post(`http://localhost:5000/api/board/like/${bnum}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setHasLiked(true);
                setBoard(prevBoard => ({
                    ...prevBoard,
                    likes: prevBoard.likes + 1
                }));
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const reportBoard = async () => {
        try {
            if (hasReported) {
                alert('이미 신고한 게시글입니다.');
                return;
            }

            await axios.post(`http://localhost:5000/api/board/report/${bnum}`, { userId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHasReported(true);
            alert('신고가 성공적으로 접수되었습니다.');
        } catch (error) {
            console.error('Error reporting board:', error);
        }
    };

    const getComments = async () => {
        try {
            const response = await axios.get(`http://localhost:9091/api/comments/board/${bnum}`);
            setComments(response.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
            setComments([]);
        }
    };

    const postComment = async () => {
        if (!newComment) return;
        try {
            await axios.post('http://localhost:9091/api/comments', {
                boardnum: bnum,
                memberid: userId,
                content: newComment
            });
            setNewComment('');
            getComments();
        } catch (error) {
            console.error('Error posting comment:', error);
        }
    };

    const updateComment = async (commentId) => {
        if (!editCommentContent) return;
        try {
            await axios.put(`http://localhost:9091/api/comments/${commentId}`, {
                content: editCommentContent
            });
            setEditCommentId(null);
            setEditCommentContent('');
            getComments();
        } catch (error) {
            console.error('Error updating comment:', error);
        }
    };

    const deleteComment = async (commentId) => {
        if (window.confirm('이 댓글을 삭제하시겠습니까?')) {
            try {
                await axios.delete(`http://localhost:9091/api/comments/${commentId}`);
                getComments();
            } catch (error) {
                console.error('Error deleting comment:', error);
            }
        }
    };

    const onDelete = async () => {
        if (window.confirm(`${bnum}번 게시글을 삭제하시겠습니까?`)) {
            await axios.delete(`http://localhost:9091/api/board/${bnum}`);
            window.location.href = "/board";
        }
    };

    useEffect(() => {
        getBoardData();
        getComments();
    }, [bnum]);

    const isImageFile = (filename) => {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];
        const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
        return imageExtensions.includes(ext);
    };

    if (!board) {
        return <div>Loading...</div>;
    }

    const formattedRegDate = board.regdate ? new Date(board.regdate).toLocaleDateString() : 'Unknown Date';

    return (
        <div>
             <Header />
        <div className="board-view-container">
           
            <div className="board-view-content">
                <div className="board-view-info">
                <h1 className="board-view-title">{board.title}</h1>
                <div className="board-view-details">
                    <p className="board-view-writer">작성자: {board.writer}</p>
                    <p className="board-view-date">작성일: {formattedRegDate}</p>
                    <p className="board-view-views">조회수: {board.hit}</p>
                </div>
                </div>

                {board.filename && (
                    <div className="board-view-file">
                        {isImageFile(board.filename) ? (
                            <img src={`http://localhost:9091/uploads/${encodeURIComponent(board.filename)}`} alt="첨부파일" style={{ maxWidth: '500px', maxHeight: '500px' }} />
                        ) : (
                            <a href={`http://localhost:9091/uploads/${encodeURIComponent(board.filename)}`} download>{board.filename}</a>
                        )}
                    </div>
                )}

                <div className="board-view-contents">{board.contents}</div>

                <div className="board-view-actions">
                    <button className="board-view-like" onClick={toggleLike}>
                        {hasLiked ? <FaThumbsUp /> : <FaRegThumbsUp />} {board.likes}
                    </button>
                    <button className="board-view-report" onClick={reportBoard}>
                        <FaExclamationTriangle /> 신고
                    </button>
                </div>

                <div className="comments-section">
                    <h2>댓글</h2>
                    <div className="comment-form">
                        <textarea 
                            value={newComment} 
                            onChange={(e) => setNewComment(e.target.value)} 
                            placeholder="댓글을 입력하세요..." 
                        />
                        <Button className="comment-form-but" onClick={postComment}>작성</Button>
                    </div>
                    {comments.length === 0 ? (
                        <p>댓글이 없습니다.</p>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.commentid} className="comment">
                                <div className="comment-header">
                                    <span>아이디: {comment.memberid}</span>
                                    <span>작성일: {new Date(comment.createdat).toLocaleDateString()}</span>
                                </div>
                                {editCommentId === comment.commentid ? (
                                    <div className="comment-edit">
                                        <textarea 
                                            value={editCommentContent}
                                            onChange={(e) => setEditCommentContent(e.target.value)}
                                        />
                                        <div className="comment-editbutton">
                                            <Button className="comment-editup" onClick={() => updateComment(comment.commentid)}>수정</Button>
                                            <Button className="comment-editcan" onClick={() => setEditCommentId(null)}>취소</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="view-comment-content">
                                        {comment.content}
                                        {comment.memberid === userId && (
                                             <div className="view-comment-actions">
                                             <Button className="view-comment-edit" onClick={() => {
                                                 setEditCommentId(comment.commentid);
                                                 setEditCommentContent(comment.content);
                                             }}>수정</Button>
                                             <Button className="view-comment-delete" variant="danger" onClick={() => deleteComment(comment.commentid)}>삭제</Button>
                                         </div>
                                        )}
                                    </div>
                                )}
                                <hr />
                            </div>
                        ))
                    )}
                </div>
                <div className='view-list-div'>
                   <Button className='view-list' onClick={() => navigate('/board')}>글 목록</Button>
                    {board.writer === userId && (
                    <>
                        <div className='board-view-editbutton'>
                            <Link to={`/board/modify/${board.bnum}`}>
                                <Button className='board-view-edit'>글 수정</Button>
                            </Link>
                            <Button className='board-view-delete' variant='danger' onClick={onDelete}>글 삭제</Button>
                        </div>
                    </>
                )}
                </div>
            </div>
            <footer className="main-footer">
            <p>&copy; 2024 Book Adventure. All rights reserved.</p>
            </footer>
        </div>
        </div>
    );
};

export default BoardView;
