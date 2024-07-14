import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import { Form, Button, Col, Row } from 'react-bootstrap';
import './Board.css';

const BoardModify = () => {
  const { bnum } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    contents: '',
    writer: '',
    file: null,
    file_name: ''
  });

  const [preview, setPreview] = useState(null);

  const getBoardData = async () => {
    try {
      const response = await axios.get(`http://localhost:9091/api/board/view/${bnum}`);
      setForm({
        title: response.data.title,
        contents: response.data.contents,
        writer: response.data.writer,
        file: null,
        file_name: response.data.filename,
      });
      setPreview(response.data.filename ? `http://localhost:9091/uploads/${response.data.filename}` : null); // 기존 파일 미리보기 설정
    } catch (error) {
      console.error('Error fetching board data:', error);
    }
  };

  useEffect(() => {
    getBoardData();
  }, [bnum]);

  const { title, contents, writer, file, file_name } = form;

  const onChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const onFileChange = (e) => {
    const newFile = e.target.files[0];
    setForm({
      ...form,
      file: newFile,
    });
    if (newFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result); // 파일 미리보기 설정
      };
      reader.readAsDataURL(newFile);
    } else {
      setPreview(null);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (title === '') {
      alert('제목을 입력하세요');
    } else if (contents === '') {
      alert('내용을 입력하세요');
    } else if (writer === '') {
      alert('작성자가 없습니다. 다시 로그인 해주세요.');
    } else {
      if (window.confirm('게시글을 수정하시겠습니까?')) {
        const formData = new FormData();
        const boardDTO = {
          title,
          contents,
          writer,
        };
        formData.append('board', new Blob([JSON.stringify(boardDTO)], { type: 'application/json' }));
        if (file) {
          formData.append('file', file);
        }

        try {
          await axios.put(`http://localhost:9091/api/board/modify/${bnum}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          navigate(`/board/view/${bnum}`);
        } catch (error) {
          console.error('Error updating the form:', error.response?.data || error.message);
        }
      }
    }
  };

  return (
    <div className="modify-container">
      <Header />
      <div className="modify-content">
        <h1 className="text-center my-5">게시글 수정</h1>
        <Form onSubmit={onSubmit}>
          <Form.Group as={Row} className="mb-3" controlId="formTitle">
            <Form.Label column sm="2">
              제목
            </Form.Label>
            <Col sm="10">
              <Form.Control
                type="text"
                placeholder="제목을 입력하세요"
                name="title"
                value={title}
                onChange={onChange}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="formContents">
            <Form.Label column sm="2">
              내용
            </Form.Label>
            <Col sm="10">
              <Form.Control
                as="textarea"
                rows={10}
                placeholder="내용을 입력하세요"
                name="contents"
                value={contents}
                onChange={onChange}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="formFile">
            <Form.Label column sm="2">
              파일
            </Form.Label>
            <Col sm="10">
              {preview && (
                <div className="mb-2">
                  <img src={preview} alt="첨부파일" style={{ maxWidth: '200px', maxHeight: '200px' }} />
                </div>
              )}
              <Form.Control
                type="file"
                name="file"
                onChange={onFileChange}
              />
            </Col>
          </Form.Group>

          <div className="text-center">
            <Button className="modify-btn-m" type="submit" >
              수정
            </Button>
            <Button className="modify-btn-c" type="reset" variant="secondary" onClick={() => setForm({
              title: '',
              contents: '',
              writer: writer,
              file: null,
              file_name: file_name
            })}>
              초기화
            </Button>
          </div>
        </Form>
      </div>
      <footer className="main-footer">
      <p>&copy; 2024 Book Adventure. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default BoardModify;
