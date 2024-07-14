import React, { useState, useEffect } from 'react';
import Header from './Header';
import './Login.css';
import { Form, Button } from 'react-bootstrap';
import axios from 'axios';

const Join = () => {
    const [form, setForm] = useState({
        id: "",
        password: "",
        confirmPassword: "",
        name: "",
        birth: "",
        email: "",
        phone: "",
        address1: "",
        address2: "",
        address3: "",
        profile: null,
        verificationInput: ""
    });

    const [preview, setPreview] = useState(null);
    const [emailVerified, setEmailVerified] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [idAvailable, setIdAvailable] = useState(true);
    const [passwordValid, setPasswordValid] = useState(true);
    const [passwordsMatch, setPasswordsMatch] = useState(true);

    const { id, password, confirmPassword, name, birth, email, phone, address1, address2, address3, verificationInput } = form;

    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const onChange = (e) => {
        if (e.target.name === 'profile') {
            const file = e.target.files[0];
            if (file) {
                setForm({
                    ...form,
                    profile: file
                });
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result);
                };
                // 파일이 Blob 타입인지 확인
                if (file instanceof Blob) {
                    reader.readAsDataURL(file);
                } else {
                    console.error("Profile file is not a Blob or File.");
                }
            } else {
                setForm({
                    ...form,
                    profile: null
                });
                setPreview(null);
            }
        } else {
            setForm({
                ...form,
                [e.target.name]: e.target.value
            });
            if (e.target.name === 'id') {
                checkIdAvailability(e.target.value);
            }
            if (e.target.name === 'password') {
                validatePassword(e.target.value);
                if (confirmPassword) {
                    setPasswordsMatch(e.target.value === confirmPassword);
                }
            }
            if (e.target.name === 'confirmPassword') {
                setPasswordsMatch(e.target.value === password);
            }
        }
    };

    const checkIdAvailability = async (id) => {
        try {
            const response = await axios.post(`http://localhost:9091/api/idCheck`, null, {
                params: { id }
            });
            setIdAvailable(!response.data);
        } catch (error) {
            console.error("ID 체크 실패:", error);
            setIdAvailable(false);
        }
    };

    const validatePassword = (password) => {
        const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;
        setPasswordValid(passwordPattern.test(password));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!idAvailable) {
            alert('이미 사용 중인 아이디입니다.');
            return;
        }
        if (!passwordValid) {
            alert('비밀번호는 영어, 숫자, 특수문자를 포함한 8~12글자여야 합니다.');
            return;
        }
        if (!passwordsMatch) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        if (id === "") {
            alert('아이디를 입력하세요');
        } else if (password === "") {
            alert('비밀번호를 입력하세요');
        } else if (name === "") {
            alert('이름을 입력하세요');
        } else if (birth === "") {
            alert('생년월일을 입력하세요');
        } else if (email === "") {
            alert('이메일을 입력하세요');
        } else if (phone === "") {
            alert('번호를 입력하세요');
        } else if (!emailVerified) {
            alert('이메일 인증을 완료해주세요.');
        } else {
            if (window.confirm('회원가입을 하시겠습니까?')) {
                const formData = new FormData();
                Object.keys(form).forEach(key => {
                    formData.append(key, form[key]);
                });

                try {
                    const response = await axios.post(`http://localhost:9091/api/join`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    alert("회원가입 성공");
                    window.location.href = "/login"; // 회원가입 성공 후 로그인 페이지로 이동
                } catch (error) {
                    console.error("회원가입 실패:", error);
                    alert("회원가입에 실패했습니다. 다시 시도해주세요.");
                }
            }
        }
    };

    const onReset = () => {
        setForm({
            id: "",
            password: "",
            confirmPassword: "",
            name: "",
            birth: "",
            email: "",
            phone: "",
            address1: "",
            address2: "",
            address3: "",
            profile: null,
            verificationInput: ""
        });
        setPreview(null);
        setIdAvailable(true);
        setPasswordValid(true);
        setPasswordsMatch(true);
        setEmailVerified(false);
        setVerificationCode("");
    };

    const sample6_execDaumPostcode = () => {
        new window.daum.Postcode({
            oncomplete: function(data) {
                var addr = '';
                var extraAddr = '';

                if (data.userSelectedType === 'R') { 
                    addr = data.roadAddress;
                } else { 
                    addr = data.jibunAddress;
                }

                if(data.userSelectedType === 'R'){
                    if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
                        extraAddr += data.bname;
                    }
                    if(data.buildingName !== '' && data.apartment === 'Y'){
                        extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                    }   
                }

                setForm({
                    ...form,
                    address1: data.zonecode,
                    address2: addr
                });

                document.getElementById("sample6_detailAddress").focus();
            }
        }).open();
    };

    const sendVerificationCode = async () => {
        if (!email || email.trim() === "") {
            alert('이메일을 입력하세요.');
            return;
        }

        // 이메일 유효성 검사
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(email)) {
            alert('유효한 이메일 주소를 입력하세요.');
            return;
        }

        try {
            const response = await axios.post('http://localhost:9091/api/emailCheck', { email: email });
            setVerificationCode(response.data);
            console.log("인증번호:", response.data);
            alert("인증번호가 이메일로 발송되었습니다.");
        } catch (error) {
            console.error("이메일 인증 실패:", error);
            alert("이메일 인증에 실패했습니다. 다시 시도해주세요.");
        }
    };

    const verifyEmail = () => {
        if (verificationInput === verificationCode) {
            setEmailVerified(true);
            alert("이메일 인증 성공");
        } else {
            alert("인증번호가 일치하지 않습니다.");
        }
    };

    return (
        <div>
            <Header />
        
        <div className='joinBack'>
            
            <h1><span>회원가입</span></h1>
            <Form className="join-form" onSubmit={onSubmit}>
                <Form.Group>
                    <Form.Control id="formId" className='join-input' name='id' placeholder='아이디를 입력하세요'
                        value={id} onChange={onChange} />
                    {!idAvailable && <div className="error">이미 사용 중인 아이디입니다.</div>}
                </Form.Group>

                <Form.Group>
                    <Form.Control type="password" id="formPassword" className='join-input' name='password' placeholder='비밀번호를 입력하세요'
                        value={password} onChange={onChange} />
                    {!passwordValid && <div className="error">비밀번호는 영어, 숫자, 특수문자를 포함한 8~12글자여야 합니다.</div>}
                </Form.Group>

                <Form.Group>
                    <Form.Control type="password" id="formConfirmPassword" className='join-input' name='confirmPassword' placeholder='비밀번호 확인'
                        value={confirmPassword} onChange={onChange} />
                    {!passwordsMatch && <div className="error">비밀번호가 일치하지 않습니다.</div>}
                </Form.Group>

                <Form.Group>
                    <Form.Control id="formName" className='join-input' name='name' placeholder='이름을 입력하세요'
                        value={name} onChange={onChange} />
                </Form.Group>

                <Form.Group>
                    <Form.Control type="date" id="formBirth" className='join-input' name='birth' placeholder='생년월일을 입력하세요'
                        value={birth} onChange={onChange} />
                        <hr className="form-group-divider" />
                </Form.Group>

                <Form.Group>
                    <Form.Control type="email" id="formEmail" className='join-input-email' name='email' placeholder='이메일을 입력하세요'
                        value={email} onChange={onChange} />
                    <Button className="join-btn-send-code" onClick={sendVerificationCode}>인증번호 발송</Button>
                </Form.Group>

                <Form.Group>
                    <Form.Control id="formVerification" className='join-input-email' name='verificationInput' placeholder='인증번호를 입력하세요'
                        value={verificationInput} onChange={onChange} />
                    <Button className="join-btn-verify-code" onClick={verifyEmail}>인증번호 확인</Button>
                    <hr className="form-group-divider" />
                </Form.Group>

                <Form.Group>
                    <Form.Control id="formPhone" className='join-input' name='phone' placeholder='연락처를 입력하세요'
                        value={phone} onChange={onChange} />
                    <hr className="form-group-divider" />
                </Form.Group>
                
                <Form.Group className="address-group">
                    <div className="input-group mb-3">
                        <Form.Control type="text" name="address1" id="sample6_postcode"
                            className="join-input-addr" placeholder="우편번호" value={address1} onChange={onChange} />
                        <Button className="join-btn-find-address" onClick={sample6_execDaumPostcode}>주소찾기</Button>
                    </div>
                </Form.Group>

                <Form.Group className="address-group">
                    <Form.Control type="text" name="address2" id="sample6_address"
                        className="join-input" placeholder="주소" value={address2} onChange={onChange} />
                </Form.Group>

                <Form.Group className="address-group">
                    <Form.Control type="text" name="address3" id="sample6_detailAddress"
                        className="join-input" placeholder="상세주소" value={address3} onChange={onChange} />
                <hr className="form-group-divider" />
                </Form.Group>
            
                <Form.Group className="profile-group">
                    <Form.Label>프로필 사진</Form.Label>
                    <Form.Control type="file" id="profile" name="profile" onChange={onChange} />
                    {preview && <img src={preview} alt="프로필 사진 미리보기" className="profile-preview" width="150px" />}
                </Form.Group>

                <div className='join-button'>
                    <Button type="submit" className="join-btn-primary">등록</Button>
                    <Button onClick={onReset} className="join-btn-secondary" variant='secondary'>초기화</Button>
                </div>
            </Form>
        </div>
        <footer className="main-footer">
      <p>&copy; 2024 Book Adventure. All rights reserved.</p>
      </footer>
        </div>
    );
};

export default Join;
