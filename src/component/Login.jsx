import React, { useState } from 'react';
import './Login.css';
import Header from './Header';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    id: '',
    pw: ''
  });
  const [errorMessage, setErrorMessage] = useState('');

  const { id, pw } = form;

  const onChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/login', form);
      if (response.status === 200) {
        alert('로그인 성공');
        localStorage.setItem('token', response.data.token); // 토큰을 로컬 스토리지에 저장
        localStorage.setItem('userId', response.data.user.id); // userId도 로컬 스토리지에 저장
        navigate('/main');
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          setErrorMessage('아이디 또는 비밀번호가 잘못되었습니다.');
        } else if (error.response.status === 403) {
          setErrorMessage('이 계정은 차단된 계정입니다.');
        } else {
          setErrorMessage('서버 오류');
        }
      } else {
        setErrorMessage('서버 오류');
      }
    }
  };

  return (
    <div>
      <Header />
      <div className='joinBack'>
        <h1>로그인</h1>
        <div className='loginForm'>
          <form className="loginForm-form" onSubmit={onSubmit}>
            <div className="loginForm-title">Welcome,</div>
            <div className='loginForm-ss'>sign in to continue</div>
            <input className="loginForm-input" name="id" placeholder="Id" type="text" value={id} onChange={onChange} />
            <input className="loginForm-input" name="pw" placeholder="Password" type="password" value={pw} onChange={onChange} />
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            <div className="loginForm-login-with">
              <button className="loginForm-button-confirm" type="submit">로그인 →</button>
              <Link to={`/join`} className="loginForm-button-join">회원가입→</Link>
            </div>
          </form>
        </div>
      </div>
      <footer className="main-footer">
        <p>&copy; 2024 Book Adventure. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;
