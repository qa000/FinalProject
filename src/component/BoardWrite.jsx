import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Col, Row } from 'react-bootstrap';
import Header from './Header';
import './Board.css';

const Write = () => {
  const [form, setForm] = useState({
    title: '',
    contents: '',
    writer: '',
    file: null,
  });
  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setForm((prevForm) => ({
        ...prevForm,
        writer: storedUserId,
      }));
    }
  }, []);

  const { title, contents, writer, file } = form;

  const onChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const onFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setForm({
      ...form,
      file: selectedFile,
    });

    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
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
      if (window.confirm('게시글을 등록하시겠습니까?')) {
        const formData = new FormData();
        formData.append('board', new Blob([JSON.stringify({ title, contents, writer })], { type: 'application/json' }));
        if (file) {
          formData.append('file', file);
        }

        try {
          const response = await axios.post('http://localhost:9091/api/board', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          console.log('Success:', response.data);
          window.location.href = '/board';
        } catch (error) {
          console.error('Error uploading the form:', error.response?.data || error.message);
        }
      }
    }
  };

  return (
    <div className="write-container">
      <Header />
      <div className="write-content">
        <h1>게시글 작성</h1>
        <Form onSubmit={onSubmit}>
          <Form.Group as={Row} className="mb-3" controlId="formTitle">
            <Col sm="10">
              <Form.Control
                type="text"
                placeholder="제목을 입력하세요"
                name="title"
                value={title}
                onChange={onChange}
                className="custom-form-title"
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} controlId="formContents">

            <Col sm="10">
              <Form.Control
                as="textarea"
                rows={30}
                placeholder="내용을 입력하세요"
                name="contents"
                value={contents}
                onChange={onChange}
                className="custom-form-control"
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} controlId="formFile">
            <Col sm="10">
              <Form.Control
                type="file"
                name="file"
                onChange={onFileChange}
                
              />
              {filePreview && (
                <div className="custom-form-file">
                  <img src={filePreview} alt="미리보기" style={{ maxWidth: '200px', maxHeight: '200px' }} />
                </div>
              )}
            </Col>
          </Form.Group>

          <div className="text-center">
            <Button className="write-btn-w" type="submit">
              등록
            </Button>
            <Button className="write-btn-reset" type="reset"  variant="secondary" onClick={() => setForm({
              title: '',
              contents: '',
              writer: writer,
              file: null,
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

export default Write;
