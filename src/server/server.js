const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');
const multer = require('multer');
const bcrypt = require('bcrypt');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs'); 

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware 설정
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// 파일 업로드 설정
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// MySQL 연결 설정
const db = mysql.createConnection({
  host: "localhost",
  user: "user_hk",
  password: "1111",
  port: "3306",
  database: "db_hk"
});

app.listen(PORT, () => {
  console.log(`Server On : http://localhost:${PORT}`);
});

db.connect((err) => {
  if (!err) {
    console.log('db접속 성공!');
  } else {
    console.log(`db접속 실패 : ${err}`);
  }
});

// 기본 루트 라우트
app.get('/', (req, res) => {
  res.send('express 서버 실행!');
  console.log('express 서버 실행!');
});

// JWT 인증 미들웨어
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, 'your_jwt_secret', (err, user) => { 
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).send('TokenExpired');
        }
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    console.error('인증 헤더가 없습니다.');
    res.sendStatus(401);
  }
};


// 로그인 API 
app.post('/login', (req, res) => {
  const { id, pw } = req.body;

  const sql = 'SELECT * FROM members WHERE id = ?';

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send('서버 오류');
    } else if (results.length > 0) {
      const user = results[0];
      bcrypt.compare(pw, user.password, (err, result) => {
        if (result) {
          if (user.isBlocked && new Date(user.blockUntil) > new Date()) {
            res.status(403).send('이 계정은 차단된 계정입니다. 관리자에게 문의해주세요.');
          } else {
            const token = jwt.sign({ id: user.id }, 'your_jwt_secret');
            res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
          }
        } else {
          res.status(401).send('아이디 또는 비밀번호가 잘못되었습니다.');
        }
      });
    } else {
      res.status(401).send('아이디 또는 비밀번호가 잘못되었습니다.');
    }
  });
});

// 플레이리스트 생성 API
app.post('/playlists', authenticateJWT, (req, res) => {
  const { name, books, coverBooks } = req.body;
  const creatorId = req.user.id;

  const sql = `INSERT INTO playlists (name, books, cover_books, creator_id) VALUES (?, ?, ?, ?)`;
  db.query(sql, [name, JSON.stringify(books), JSON.stringify(coverBooks), creatorId], (err, result) => {
    if (err) {
      console.error('MySQL Error:', err);
      res.status(500).json({ error: 'Database query error' });
    } else {
      res.json({ id: result.insertId });
    }
  });
});

// 플레이리스트 수정 API
app.put('/playlists/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const { name, books, coverBooks } = req.body;
  const creatorId = req.user.id;

  const sqlSelect = `SELECT creator_id FROM playlists WHERE id = ?`;
  db.query(sqlSelect, [id], (err, result) => {
    if (err) {
      console.error('MySQL Error:', err);
      res.status(500).json({ error: 'Database query error' });
    } else if (result.length > 0 && result[0].creator_id === creatorId) {
      const sqlUpdate = `UPDATE playlists SET name = ?, books = ?, cover_books = ? WHERE id = ?`;
      db.query(sqlUpdate, [name, JSON.stringify(books), JSON.stringify(coverBooks), id], (err, result) => {
        if (err) {
          console.error('MySQL Error:', err);
          res.status(500).json({ error: 'Database query error' });
        } else {
          res.json({ success: true });
        }
      });
    } else {
      res.status(403).json({ error: '권한이 없습니다.' });
    }
  });
});

// 플레이리스트 삭제 API
app.delete('/playlists/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const creatorId = req.user.id;

  const sqlSelect = `SELECT creator_id FROM playlists WHERE id = ?`;
  db.query(sqlSelect, [id], (err, result) => {
    if (err) {
      console.error('MySQL Error:', err);
      res.status(500).json({ error: 'Database query error' });
    } else if (result.length > 0 && result[0].creator_id === creatorId) {
      const sqlDelete = `DELETE FROM playlists WHERE id = ?`;
      db.query(sqlDelete, [id], (err, result) => {
        if (err) {
          console.error('MySQL Error:', err);
          res.status(500).json({ error: 'Database query error' });
        } else {
          res.json({ success: true });
        }
      });
    } else {
      res.status(403).json({ error: '권한이 없습니다.' });
    }
  });
});

// 책 목록 가져오기 API
app.get('/book', (req, res) => {
  const category = req.query.category;
  let sql = "SELECT * FROM bookinfo";
  const params = [];

  if (category && category !== 'All') {
    if (category === 'Other') {
      sql += " WHERE categorylarge NOT IN (?, ?, ?, ?, ?)";
      params.push('소설/시/희곡', '에세이', '자기계발', '인문학', '경제경영');
    } else {
      sql += " WHERE categorylarge = ?";
      params.push(category);
    }
  }

  db.query(sql, params, (err, data) => {
    if (!err) {
      res.send(data);
    } else {
      console.log(err);
      res.status(500).send('Server error');
    }
  });
});

// API로 불러온 책 정보를 DB에 추가하는 API
app.post('/addBookToDB', (req, res) => {
  const { itemid, title, author, categorylarge, categorysmall, priceStandard, reviewrating, publisher, publicationdate, coverimage, description } = req.body;

  const selectSql = 'SELECT * FROM bookinfo WHERE itemid = ?';
  const insertSql = `INSERT INTO bookinfo (itemid, title, author, categorylarge, categorysmall, priceStandard, reviewrating, publisher, publicationdate, coverimage, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(selectSql, [itemid], (err, results) => {
    if (err) {
      console.log('책 정보 조회 실패:', err);
      res.status(500).send('책 정보 조회 실패');
    } else if (results.length > 0) {
      console.log('이미 존재하는 책 정보입니다.');
      res.status(200).send('이미 존재하는 책 정보입니다.');
    } else {
      db.query(insertSql, [itemid, title, author, categorylarge, categorysmall, priceStandard, reviewrating, publisher, publicationdate, coverimage, description], (err, result) => {
        if (err) {
          console.log('책 정보 추가 실패:', err);
          res.status(500).send('책 정보 추가 실패');
        } else {
          console.log('책 정보 추가 성공:', result);
          res.status(200).send('책 정보 추가 성공');
        }
      });
    }
  });
});

// 책 상세보기 API
app.get('/book/view/:itemid', (req, res) => {
  const itemid = req.params.itemid;
  console.log('책 상세보기 실행:', itemid);

  const sql = 'SELECT * FROM bookinfo WHERE itemid = ?';

  db.query(sql, [itemid], (err, data) => {
      if (!err) {
          if (data.length > 0) {
              console.log('책 데이터:', data[0]);
              res.send(data[0]); // 단일 책 객체를 반환합니다.
          } else {
              console.log('책을 찾을 수 없습니다.');
              res.status(404).send('Book not found');
          }
      } else {
          console.log('오류 발생:', err);
          res.status(500).send('Internal Server Error');
      }
  });
});

// 장바구니 항목 조회 API
app.get('/cart', authenticateJWT, (req, res) => {
  const user_id = req.user.id;

  const sql = `SELECT * FROM cart WHERE user_id = ?`;
  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error('MySQL Error:', err);
      res.status(500).json({ error: 'Database query error' });
    } else {
      res.json(results);
    }
  });
});

// 장바구니 항목 삭제 API
app.delete('/cart/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const sql = `DELETE FROM cart WHERE id = ? AND user_id = ?`;
  db.query(sql, [id, user_id], (err, result) => {
    if (err) {
      console.error('MySQL Error:', err);
      res.status(500).json({ error: 'Database query error' });
    } else {
      res.json({ success: true });
    }
  });
});

// 장바구니 항목 수량 업데이트 API
app.put('/cart/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const user_id = req.user.id;

  const sql = `UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?`;
  db.query(sql, [quantity, id, user_id], (err, result) => {
    if (err) {
      console.error('MySQL Error:', err);
      res.status(500).json({ error: 'Database query error' });
    } else {
      res.json({ success: true });
    }
  });
});

// 아임포트 토큰 요청
const IAMPORT_KEY = '0363585222434703';
const IAMPORT_SECRET = 'LjzOm7Sy70px9BWhRqsC4kG9M4xDhrZoWjtS8C875lMxgtIP3d3wqHGGfU34QA3DUM9vL3ebZas6osPr';

const getToken = async () => {
  try {
    console.log('Requesting token...');
    const response = await axios.post('http://localhost:3000/iamport/users/getToken', {
      imp_key: IAMPORT_KEY,
      imp_secret: IAMPORT_SECRET
    });
    console.log('Token response:', response.data);
    return response.data.response.access_token;
  } catch (error) {
    console.error('Error getting token:', error.response ? error.response.data : error.message);
    throw error;
  }
};

// 회원 정보 조회 API
app.get('/member-info', authenticateJWT, (req, res) => {
  const userId = req.user.id; // Extract userId from req.user object set by authenticateJWT
  const sql = 'SELECT id, name, email, phone, address FROM members WHERE id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('MySQL Error:', err);
      res.status(500).send('Database query error');
    } else if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).send('Member not found');
    }
  });
});

// 장바구니 항목 조회 API
app.get('/cart-items', authenticateJWT, (req, res) => {
  const userId = req.user.id;
  const sql = 'SELECT * FROM cart WHERE user_id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('MySQL Error:', err);
      res.status(500).send('Database query error');
    } else {
      res.json(results);
    }
  });
});

// 결제 정보 저장 API
app.post('/api/save-payment', authenticateJWT, (req, res) => {
  const {
    merchant_uid, user_id, title, amount, buyer_email,
    buyer_name, buyer_tel, buyer_addr, buyer_postcode, status
  } = req.body;

  const sql = `
    INSERT INTO payment (
      merchant_uid, user_id, title, amount, buyer_email,
      buyer_name, buyer_tel, buyer_addr, buyer_postcode, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [
    merchant_uid, user_id, title, amount, buyer_email,
    buyer_name, buyer_tel, buyer_addr, buyer_postcode, status
  ], (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      res.status(500).send('Database query error');
    } else {
      res.status(200).send('Payment saved successfully');
    }
  });
});


// 프록시 미들웨어 설정
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api', // 알라딘 API 경로 프록시
    createProxyMiddleware({
      target: 'http://www.aladin.co.kr/ttb/api',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // 알라딘 API 요청 시 '/api' 경로 제거
      },
    })
  );
  
  app.use(
    '/iamport', // 아임포트 API 경로 프록시
    createProxyMiddleware({
      target: 'https://api.iamport.kr',
      changeOrigin: true,
      pathRewrite: {
        '^/iamport': '', // 아임포트 API 요청 시 '/iamport' 경로 제거
      },
    })
  );
};

// 사용자 정보 조회 API
app.get('/user-info', authenticateJWT, (req, res) => {
  const userId = req.user.id; // 로그인한 사용자의 ID를 가져옴
  const sql = 'SELECT id, name, birth, phone, email FROM members WHERE id = ?';
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('사용자 정보를 가져오는 중 오류가 발생했습니다:', err);
      res.status(500).send('사용자 정보를 가져오는 중 오류가 발생했습니다');
    } else {
      res.json(results[0]);
    }
  });
});

// 콘서트 목록 조회 API
app.get('/api/concerts', (req, res) => {
  const sql = 'SELECT * FROM concerts';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('콘서트 데이터를 가져오는 중 오류가 발생했습니다:', err);
      res.status(500).send('콘서트 데이터를 가져오는 중 오류가 발생했습니다');
    } else {
      res.json(results);
    }
  });
});


// 결제 API
app.post('/api/pay', authenticateJWT, async (req, res) => {
  try {
    const { amount, buyer_email, buyer_name, buyer_tel, buyer_addr, buyer_postcode, title } = req.body;
    const token = await getToken();

    // amount를 숫자로 변환
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount)) {
      throw new Error('Invalid amount value');
    }

    const paymentData = {
      pg: "html5_inicis",
      pay_method: "card",
      merchant_uid: `merchant_${new Date().getTime()}`,
      name: title,
      amount: paymentAmount, // amount를 숫자로 변환하여 설정
      buyer_email,
      buyer_name,
      buyer_tel,
      buyer_addr,
      buyer_postcode,
      m_redirect_url: "http://localhost:3000/paymentPage"
    };

    console.log('결제 데이터:', paymentData);

    const response = await axios.post('https://api.iamport.kr/payments/prepare', paymentData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.code === 0) {
      res.json({ success: true, paymentData });
    } else {
      console.error('결제 준비 중 오류 발생:', response.data.message);
      res.status(500).json({ success: false, message: response.data.message });
    }
  } catch (error) {
    console.error('결제 처리 중 오류 발생:', error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, error: error.response ? error.response.data : error.message });
  }
});
 

// 좌석 데이터 삽입 API
app.post('/seats', (req, res) => {
  const { concert_id, seats } = req.body; // 'seats'는 좌석 번호의 배열
  console.log('Inserting seats:', { concert_id, seats });

  const seatInsertPromises = seats.map(seat => {
    const sqlInsertSeat = 'INSERT INTO seats (concert_id, seat_number) VALUES (?, ?)';
    return new Promise((resolve, reject) => {
      db.query(sqlInsertSeat, [concert_id, seat], (err, result) => {
        if (err) {
          console.error('MySQL Error inserting seat:', err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  });

  Promise.all(seatInsertPromises)
    .then(() => {
      res.json({ success: true, message: '좌석 데이터가 성공적으로 삽입되었습니다.' });
    })
    .catch(err => {
      console.error('MySQL Error inserting seats:', err);
      res.status(500).json({ error: 'Database query error' });
    });
});

// 예약 및 결제 완료 후 데이터 저장 API
app.post('/api/save-reservation', authenticateJWT, (req, res) => {
  const { concert_id, seats, total_price, merchant_uid } = req.body; // merchant_uid 추가
  const user_id = req.user.id;

  console.log('Reservation Request:', { concert_id, seats, total_price, user_id, merchant_uid });

  const checkSeatsAvailability = 'SELECT seat_number FROM seats WHERE concert_id = ? AND seat_number IN (?) AND is_reserved = TRUE';
  db.query(checkSeatsAvailability, [concert_id, seats], (err, results) => {
    if (err) {
      console.error('MySQL Error checking seat availability:', err);
      return res.status(500).json({ error: 'Database query error' });
    }

    if (results.length > 0) {
      const reservedSeats = results.map(row => row.seat_number).join(', ');
      return res.status(400).json({ error: `이미 예약된 좌석입니다: ${reservedSeats}` });
    }

    const sqlInsertReservation = 'INSERT INTO reservations (user_id, concert_id, seats, total_price, status, merchant_uid) VALUES (?, ?, ?, ?, "예약 완료", ?)';
    db.query(sqlInsertReservation, [user_id, concert_id, seats.join(','), total_price, merchant_uid], (err, result) => {
      if (err) {
        console.error('MySQL Error inserting reservation:', err);
        return res.status(500).json({ error: 'Database query error' });
      }

      const reservation_id = result.insertId;
      console.log('Reservation Inserted:', { reservation_id });

      const seatUpdatePromises = seats.map(seat => {
        const sqlInsertOrUpdateSeat = `
          INSERT INTO seats (concert_id, seat_number, is_reserved) 
          VALUES (?, ?, TRUE) 
          ON DUPLICATE KEY UPDATE is_reserved = TRUE`;
        return new Promise((resolve, reject) => {
          db.query(sqlInsertOrUpdateSeat, [concert_id, seat], (err, result) => {
            if (err) {
              console.error('MySQL Error inserting/updating seat:', err);
              reject(err);
            } else {
              console.log(`Seat ${seat} reserved for concert ${concert_id}`);
              resolve(result);
            }
          });
        });
      });

      Promise.all(seatUpdatePromises)
        .then(() => {
          res.json({ reservation_id });
        })
        .catch(err => {
          console.error('MySQL Error updating seats:', err);
          res.status(500).json({ error: 'Database query error' });
        });
    });
  });
});

// 좌석 상태 조회 API
app.get('/seats/:concert_id', (req, res) => {
  const { concert_id } = req.params;
  const sql = 'SELECT seat_number, is_reserved FROM seats WHERE concert_id = ?';
  db.query(sql, [concert_id], (err, results) => {
    if (err) {
      console.error('MySQL Error fetching seat status:', err);
      return res.status(500).json({ error: 'Database query error' });
    }
    res.json(results);
  });
});

// 독서 목록에 책 추가 API
app.post('/api/readinglist', authenticateJWT, (req, res) => {
  const { bookId, status, addedat } = req.body;
  const userId = req.user.id;

  const sql = 'INSERT INTO readinglist (userid, bookid, status, addedat) VALUES (?, ?, ?, ?)';
  db.query(sql, [userId, bookId, status, addedat], (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      res.status(500).send('서버 오류');
    } else {
      res.status(200).json({ success: true });
    }
  });
});


// 게시글 조회수 증가 API
app.post('/api/board/view/:bnum/increment', (req, res) => {
  const { bnum } = req.params;

  const incrementViewSql = 'UPDATE board SET hit = hit + 1 WHERE bnum = ?';
  db.query(incrementViewSql, [bnum], (err, result) => {
      if (err) {
          console.error('Database query error:', err);
          res.status(500).send('Database query error');
      } else {
          res.status(200).send('조회수 증가');
      }
  });
});

// 좋아요 증가 API
app.post('/api/board/like/:bnum', (req, res) => {
  const { bnum } = req.params;

  const incrementLikeSql = 'UPDATE board SET likes = likes + 1 WHERE bnum = ?';
  db.query(incrementLikeSql, [bnum], (err, result) => {
      if (err) {
          console.error('Database query error:', err);
          res.status(500).send('Database query error');
      } else {
          res.status(200).send('좋아요 증가');
      }
  });
});

// 좋아요 취소 API
app.post('/api/board/unlike/:bnum', (req, res) => {
  const { bnum } = req.params;

  const decrementLikeSql = 'UPDATE board SET likes = likes - 1 WHERE bnum = ?';
  db.query(decrementLikeSql, [bnum], (err, result) => {
      if (err) {
          console.error('Database query error:', err);
          res.status(500).send('Database query error');
      } else {
          res.status(200).send('좋아요 취소');
      }
  });
});

// 사용자 정보 조회 API
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;

  const sql = 'SELECT id, name, birth, email, phone, address, profile_name FROM members WHERE id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('MySQL Error:', err);
      res.status(500).send('Database query error');
    } else if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).send('User not found');
    }
  });
});

// 사용자 정보 수정 API
app.put('/api/users/:id', upload.single('profile'), (req, res) => {
  const userId = req.params.id;
  const { name, birth, email, phone, address } = req.body;
  let profile_name = req.body.profile_name;

  if (req.file) {
    profile_name = req.file.filename;
  }

  const sql = 'UPDATE members SET name = ?, birth = ?, email = ?, phone = ?, address = ?, profile_name = ? WHERE id = ?';
  db.query(sql, [name, birth, email, phone, address, profile_name, userId], (err, result) => {
    if (err) {
      console.error('MySQL Error:', err);
      res.status(500).send('Database query error');
    } else {
      res.status(200).send('User info updated successfully');
    }
  });
});

// 회원 탈퇴 API
const deleteUserData = (userId, callback) => {
  const deleteQueries = [
    'DELETE FROM readinglist WHERE userid = ?',
    'DELETE FROM cart WHERE user_id = ?',
    'DELETE FROM reservations WHERE user_id = ?',
    'DELETE FROM comments WHERE memberid = ?',
    'DELETE FROM playlists WHERE creator_id = ?',
    'DELETE FROM payment WHERE user_id = ?'
  ];

  const deleteQueryRecursive = (index) => {
    if (index < deleteQueries.length) {
      db.query(deleteQueries[index], [userId], (err) => {
        if (err) {
          callback(err);
        } else {
          deleteQueryRecursive(index + 1);
        }
      });
    } else {
      callback(null);
    }
  };

  deleteQueryRecursive(0);
};

app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;

  deleteUserData(userId, (err) => {
    if (err) {
      console.error('MySQL Error:', err);
      res.status(500).send('Database query error while deleting user');
    } else {
      const deleteUserSql = 'DELETE FROM members WHERE id = ?';
      db.query(deleteUserSql, [userId], (err) => {
        if (err) {
          console.error('MySQL Error:', err);
          res.status(500).send('Database query error while deleting user');
        } else {
          res.status(200).send('User deleted successfully');
        }
      });
    }
  });
});

// 프로필 이미지 조회 API
app.get('/api/profile-image/:fileName', (req, res) => {
  const fileName = req.params.fileName;

  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return res.status(500).send('Server error');
    }

    const matchedFile = files.find(file => file.endsWith(fileName));
    
    if (matchedFile) {
      res.sendFile(path.join(uploadDir, matchedFile));
    } else {
      res.status(404).send('File not found');
    }
  });
});

// 로그인한 사용자의 결제 정보 조회 API
app.get('/api/payment-info', authenticateJWT, (req, res) => {
  const userId = req.user.id;
  const sql = 'SELECT * FROM payment WHERE user_id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      res.status(500).send('Database query error');
    } else {
      res.json(results);
    }
  });
});

// 로그인한 사용자의 예약 정보 조회 API
app.get('/api/reservation-info', authenticateJWT, (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT r.id, r.merchant_uid, r.user_id, r.concert_id, r.seats, r.total_price, r.status, r.reserved_at, 
           c.title as concert_title
    FROM reservations r
    JOIN concerts c ON r.concert_id = c.id
    WHERE r.user_id = ?
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      res.status(500).send('Database query error');
    } else {
      res.json(results);
    }
  });
});



// 결제 취소 API
app.post('/api/cancel-payment', authenticateJWT, async (req, res) => {
  const { merchant_uid, reason } = req.body;
  const userId = req.user.id;

  try {
    // 결제 정보를 조회하여 사용자 확인
    const paymentSelectSql = 'SELECT * FROM payment WHERE merchant_uid = ? AND user_id = ?';
    db.query(paymentSelectSql, [merchant_uid, userId], async (err, paymentResults) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).send('Database query error');
      }

      if (paymentResults.length === 0) {
        return res.status(404).send('Payment not found');
      }

      const payment = paymentResults[0];
      if (payment.status === '결제 취소') {
        return res.status(400).send('이미 전액취소된 주문입니다.');
      }

      // 아임포트 API를 통해 결제 취소 요청
      const token = await getToken();
      const response = await axios.post('https://api.iamport.kr/payments/cancel', {
        merchant_uid,
        reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.code !== 0) {
        return res.status(500).send(response.data.message);
      }

      // 결제 상태 업데이트
      const paymentUpdateSql = 'UPDATE payment SET status = ? WHERE merchant_uid = ?';
      db.query(paymentUpdateSql, ['결제 취소', merchant_uid], (err) => {
        if (err) {
          console.error('Database query error:', err);
          return res.status(500).send('Database query error');
        }

        res.status(200).send('Payment cancelled successfully');
      });
    });
  } catch (error) {
    console.error('Error cancelling payment:', error.response ? error.response.data : error.message);
    res.status(500).send(error.response ? error.response.data : error.message);
  }
});

// 예약 취소 API
app.post('/api/cancel-reservation', authenticateJWT, async (req, res) => {
  const { reservation_id, reason } = req.body;
  const userId = req.user.id;

  try {
    // 예약 정보를 조회하여 사용자 확인
    const reservationSelectSql = 'SELECT * FROM reservations WHERE id = ? AND user_id = ?';
    db.query(reservationSelectSql, [reservation_id, userId], async (err, reservationResults) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).send('Database query error');
      }

      if (reservationResults.length === 0) {
        return res.status(404).send('Reservation not found');
      }

      const reservation = reservationResults[0];
      if (reservation.status === '예약 취소') {
        return res.status(400).send('이미 취소된 예약입니다.');
      }

      const token = await getToken();

      // 아임포트 결제 취소
      const response = await axios.post(
        'https://api.iamport.kr/payments/cancel',
        { merchant_uid: reservation.merchant_uid, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.message);
      }

      // 예약 상태 업데이트 및 좌석 정보 삭제
      const reservationUpdateSql = 'UPDATE reservations SET status = ? WHERE id = ?';
      db.query(reservationUpdateSql, ['예약 취소', reservation_id], (err) => {
        if (err) {
          console.error('Database query error:', err);
          return res.status(500).send('Database query error');
        }

        const seatDeleteSql = 'DELETE FROM seats WHERE concert_id = ? AND seat_number IN (?)';
        db.query(seatDeleteSql, [reservation.concert_id, reservation.seats.split(',')], (err) => {
          if (err) {
            console.error('Database query error:', err);
            return res.status(500).send('Database query error');
          }

          res.status(200).send('Reservation cancelled successfully');
        });
      });
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error.message);
    res.status(500).send(error.message);
  }
});

// 마이페이지에서 사용자의 게시물 조회 API
app.get('/api/my-board', authenticateJWT, (req, res) => {
  const userId = req.user.id;

  const queries = {
    boards: 'SELECT * FROM board WHERE writer = ?',
    bookreviews: `
      SELECT br.*, bi.title 
      FROM bookreviews br
      JOIN bookinfo bi ON br.bookid = bi.itemid
      WHERE br.memberid = ?
    `,
    comments: `
      SELECT c.*, b.title as board_title
      FROM comments c
      JOIN board b ON c.boardnum = b.bnum
      WHERE c.memberid = ?
    `,
    playlists: 'SELECT * FROM playlists WHERE creator_id = ?',
  };

  const results = {};

  const executeQuery = (key, query, params) => {
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          results[key] = data;
          resolve();
        }
      });
    });
  };

  Promise.all([
    executeQuery('boards', queries.boards, [userId]),
    executeQuery('bookreviews', queries.bookreviews, [userId]),
    executeQuery('comments', queries.comments, [userId]),
    executeQuery('playlists', queries.playlists, [userId]),
  ])
    .then(() => {
      res.json(results);
    })
    .catch((err) => {
      console.error('Database query error:', err);
      res.status(500).send('Database query error');
    });
});

// 책 리뷰 추가 API
app.post('/api/bookreviews', authenticateJWT, (req, res) => {
  const { bookid, memberid, rating, comment, createdat } = req.body;

  if (!bookid || !memberid || !rating || !comment || !createdat) {
    return res.status(400).send('필수 필드가 누락되었습니다.');
  }

  const selectSql = 'SELECT * FROM bookreviews WHERE bookid = ? AND memberid = ?';
  const insertSql = 'INSERT INTO bookreviews (bookid, memberid, rating, comment, createdat) VALUES (?, ?, ?, ?, ?)';

  db.query(selectSql, [bookid, memberid], (err, results) => {
    if (err) {
      console.error('리뷰 조회 중 오류가 발생했습니다:', err);
      return res.status(500).send('리뷰 조회 중 오류가 발생했습니다.');
    } 
    if (results.length > 0) {
      return res.status(400).send('이미 이 책에 대한 리뷰를 작성하셨습니다.');
    }

    db.query(insertSql, [bookid, memberid, rating, comment, createdat], (err, result) => {
      if (err) {
        console.error('리뷰 추가 중 오류가 발생했습니다:', err);
        return res.status(500).send('리뷰 추가 중 오류가 발생했습니다.');
      }
      return res.status(201).json({ reviewid: result.insertId });
    });
  });
});



// 책 리뷰 삭제 API
app.delete('/api/bookreviews/:reviewid', authenticateJWT, (req, res) => {
  const { reviewid } = req.params;
  const userId = req.user.id;

  const selectSql = 'SELECT memberid FROM bookreviews WHERE reviewid = ?';
  const deleteSql = 'DELETE FROM bookreviews WHERE reviewid = ?';

  db.query(selectSql, [reviewid], (err, results) => {
    if (err) {
      console.error('리뷰 조회 중 오류가 발생했습니다:', err);
      return res.status(500).send('리뷰 조회 중 오류가 발생했습니다.');
    }

    if (results.length === 0) {
      return res.status(404).send('리뷰를 찾을 수 없습니다.');
    }

    if (results[0].memberid !== userId) {
      return res.status(403).send('권한이 없습니다.');
    }

    db.query(deleteSql, [reviewid], (err, result) => {
      if (err) {
        console.error('리뷰 삭제 중 오류가 발생했습니다:', err);
        return res.status(500).send('리뷰 삭제 중 오류가 발생했습니다.');
      }
      return res.status(200).send('리뷰가 성공적으로 삭제되었습니다.');
    });
  });
});

// 파일 업로드 API
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('파일이 업로드되지 않았습니다.');
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({ imageUrl });
});


// 모임 데이터 저장 API
app.post('/api/meetings', authenticateJWT, (req, res) => {
  const { title, schedule, firstBook, description, imgSrc } = req.body;
  const leader = req.user.id;

  // 모임 생성
  const createMeetingSql = 'INSERT INTO BookMeetings (title, schedule, leader, firstBook, imgSrc, description) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(createMeetingSql, [title, schedule, leader, firstBook, imgSrc, description], (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send('Database query error');
    }
    res.status(201).send('모임이 성공적으로 생성되었습니다.');
  });
});

// 모임 목록 조회 API
app.get('/api/meetings', (req, res) => {
  const sql = 'SELECT * FROM BookMeetings';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('데이터 조회 실패:', err);
      res.status(500).json({ error: '서버 오류' });
    } else {
      res.json(results);
    }
  });
});

// 특정 모임 조회 API
app.get('/api/meeting/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM BookMeetings WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('데이터 조회 실패:', err);
      res.status(500).json({ error: '서버 오류' });
    } else if (result.length === 0) {
      res.status(404).json({ error: '해당 모임을 찾을 수 없습니다' });
    } else {
      res.json(result[0]);
    }
  });
});

// 모임 삭제 API
app.delete('/api/meeting/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // 모임의 리더가 현재 사용자와 같은지 확인
  const selectMeetingSql = 'SELECT leader FROM BookMeetings WHERE id = ?';
  db.query(selectMeetingSql, [id], (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send('Database query error');
    }

    if (result.length === 0) {
      return res.status(404).send('Meeting not found');
    }

    if (result[0].leader !== userId) {
      return res.status(403).send('Permission denied');
    }

    const deleteMeetingSql = 'DELETE FROM BookMeetings WHERE id = ?';
    db.query(deleteMeetingSql, [id], (err) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).send('Database query error');
      }
      res.status(200).send('Meeting deleted successfully');
    });
  });
});

// 모임 수정 API
app.put('/api/meeting/modify/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const { title, schedule, firstBook, description, imgSrc } = req.body;
  const userId = req.user.id;

  const selectMeetingSql = 'SELECT leader FROM BookMeetings WHERE id = ?';
  db.query(selectMeetingSql, [id], (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send('Database query error');
    }

    if (result.length === 0) {
      return res.status(404).send('Meeting not found');
    }

    if (result[0].leader !== userId) {
      return res.status(403).send('Permission denied');
    }

    const updateMeetingSql = 'UPDATE BookMeetings SET title = ?, schedule = ?, firstBook = ?, description = ?, imgSrc = ? WHERE id = ?';
    db.query(updateMeetingSql, [title, schedule, firstBook, description, imgSrc, id], (err) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).send('Database query error');
      }
      res.status(200).send('Meeting updated successfully');
    });
  });
});

// 특정 사용자의 모임 및 플레이리스트 조회 API
app.get('/api/my-meetings', authenticateJWT, (req, res) => {
  const userId = req.user.id;

  const queries = {
    playlists: 'SELECT * FROM playlists WHERE creator_id = ?',
    meetings: 'SELECT * FROM BookMeetings WHERE leader = ?'
  };

  const results = {};

  const executeQuery = (key, query, params) => {
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          results[key] = data;
          resolve();
        }
      });
    });
  };

  Promise.all([
    executeQuery('playlists', queries.playlists, [userId]),
    executeQuery('meetings', queries.meetings, [userId])
  ])
    .then(() => {
      res.json(results);
    })
    .catch((err) => {
      console.error('Database query error:', err);
      res.status(500).send('Database query error');
    });
});

// 중고책 등록 API
app.post('/used_books_register', upload.fields([{ name: 'frontImage' }, { name: 'backImage' }]), (req, res) => {
  const { bookId, sellerId, bookCondition, price, description } = req.body;
  const frontImage = req.files['frontImage'] ? req.files['frontImage'][0].filename : null;
  const backImage = req.files['backImage'] ? req.files['backImage'][0].filename : null;
  const bookIdQuery = `SELECT * FROM bookinfo WHERE itemid = ?`;
  db.query(bookIdQuery, [bookId], (bookErr, bookResults) => {
    if (bookErr || bookResults.length === 0) {
      console.error('책 ID 오류 또는 책 정보가 없음:', bookErr);
      return res.status(400).json({ error: '유효하지 않은 책 ID입니다.' });
    }

    const sql = `INSERT INTO used_books (book_id, seller_id, book_condition, front_image, back_image, price, description)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [bookId, sellerId, bookCondition, frontImage, backImage, price, description], (err, result) => {
      if (err) {
        console.error('MySQL 오류:', err);
        res.status(500).json({ error: '데이터베이스 쿼리 오류' });
      } else {
        res.json({ success: true, data: result.insertId });
      }
    });
  });
});

// 중고책 목록 조회 API
app.get('/used_books_inquir', (req, res) => {
  const sql = `
    SELECT ub.*, bi.coverimage, bi.title 
    FROM used_books ub
    JOIN bookinfo bi ON ub.book_id = bi.itemid
  `;

  db.query(sql, (err, data) => {
    if (!err) {
      res.send(data);
    } else {
      console.log(err);
      res.status(500).send('Server error');
    }
  });
});

// 중고책 상세보기 API
app.get('/used_books_inquir/:book_id', (req, res) => {
  const { book_id } = req.params;
  console.log('Received book_id:', book_id);  // book_id를 확인하기 위한 로그

  const sql = `
    SELECT ub.id, ub.book_id, ub.seller_id, ub.book_condition, ub.front_image, ub.back_image, 
           ub.price, ub.description, ub.listed_at, bi.title, bi.author, bi.categorylarge, 
           bi.categorysmall, bi.pricestandard, bi.reviewrating, bi.publisher, bi.publicationdate, 
           bi.coverimage, bi.description as book_description
    FROM used_books ub
    JOIN bookinfo bi ON ub.book_id = bi.itemid
    WHERE ub.book_id = ?
  `;

  console.log('SQL Query:', sql);
  console.log('SQL Params:', [book_id]);

  db.query(sql, [book_id], (err, data) => {
    if (!err) {
      console.log('Book Details from DB:', data);  // 데이터를 확인하기 위한 로그
      res.send(data);
    } else {
      console.error('DB Query Error:', err);
      res.status(500).send('Server error');
    }
  });
});

// 장바구니에 책 추가 API
app.post('/cart', authenticateJWT, (req, res) => {
  const { title, isUsedBook, usedBookId } = req.body;
  const user_id = req.user.id;

  const bookSelectSql = `SELECT * FROM bookinfo WHERE title = ?`;
  db.query(bookSelectSql, [title], (err, bookResults) => {
    if (err) {
      console.error('MySQL Error:', err);
      res.status(500).json({ error: 'Database query error' });
      return;
    }
    if (bookResults.length === 0) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    const book = bookResults[0];
    const { itemid, pricestandard, coverimage } = book;

    let price = pricestandard; // 기본 가격을 설정

    if (isUsedBook) {
      const usedBookSelectSql = `SELECT * FROM used_books WHERE id = ?`;
      db.query(usedBookSelectSql, [usedBookId], (err, usedBookResults) => {
        if (err) {
          console.error('MySQL Error:', err);
          res.status(500).json({ error: 'Database query error' });
          return;
        }
        if (usedBookResults.length === 0) {
          res.status(404).json({ error: 'Used book not found' });
          return;
        }

        const usedBook = usedBookResults[0];
        price = usedBook.price;

        const cartSelectSql = `SELECT * FROM cart WHERE user_id = ? AND book_id = ? AND price = ?`;
        db.query(cartSelectSql, [user_id, itemid, price], (err, cartResults) => {
          if (err) {
            console.error('MySQL Error:', err);
            res.status(500).json({ error: 'Database query error' });
            return;
          }

          if (cartResults.length > 0) {
            const updateSql = `UPDATE cart SET quantity = quantity + 1 WHERE user_id = ? AND book_id = ? AND price = ?`;
            db.query(updateSql, [user_id, itemid, price], (err, result) => {
              if (err) {
                console.error('MySQL Error:', err);
                res.status(500).json({ error: 'Database query error' });
                return;
              }
              res.json({ success: true });
            });
          } else {
            // 제목에 " (중고)"를 추가하여 중고 책을 구분
            const usedBookTitle = `${title} (중고)`;
            const insertSql = `INSERT INTO cart (user_id, book_id, title, price, coverimage) VALUES (?, ?, ?, ?, ?)`;
            db.query(insertSql, [user_id, itemid, usedBookTitle, price, coverimage], (err, result) => {
              if (err) {
                console.error('MySQL Error:', err);
                res.status(500).json({ error: 'Database query error' });
                return;
              }
              res.json({ success: true, id: result.insertId });
            });
          }
        });
      });
    } else {
      const cartSelectSql = `SELECT * FROM cart WHERE user_id = ? AND book_id = ? AND price = ?`;
      db.query(cartSelectSql, [user_id, itemid, price], (err, cartResults) => {
        if (err) {
          console.error('MySQL Error:', err);
          res.status(500).json({ error: 'Database query error' });
          return;
        }

        if (cartResults.length > 0) {
          const updateSql = `UPDATE cart SET quantity = quantity + 1 WHERE user_id = ? AND book_id = ? AND price = ?`;
          db.query(updateSql, [user_id, itemid, price], (err, result) => {
            if (err) {
              console.error('MySQL Error:', err);
              res.status(500).json({ error: 'Database query error' });
              return;
            }
            res.json({ success: true });
          });
        } else {
          const insertSql = `INSERT INTO cart (user_id, book_id, title, price, coverimage) VALUES (?, ?, ?, ?, ?)`;
          db.query(insertSql, [user_id, itemid, title, price, coverimage], (err, result) => {
            if (err) {
              console.error('MySQL Error:', err);
              res.status(500).json({ error: 'Database query error' });
              return;
            }
            res.json({ success: true, id: result.insertId });
          });
        }
      });
    }
  });
});

// 사용자 목록 가져오기
app.get('/api/users', (req, res) => {
  const { page = 1, limit = 5 } = req.query;
  const offset = (page - 1) * limit;

  const query = 'SELECT * FROM members WHERE id != "admin" LIMIT ? OFFSET ?';
  const countQuery = 'SELECT COUNT(*) AS total FROM members WHERE id != "admin"';

  db.query(query, [parseInt(limit), parseInt(offset)], (err, results) => {
    if (err) {
      console.error('사용자 목록을 가져오는 중 오류 발생:', err);
      return res.status(500).send('사용자 목록을 가져오는 중 오류가 발생했습니다.');
    }

    db.query(countQuery, (countErr, countResults) => {
      if (countErr) {
        console.error('사용자 총수를 가져오는 중 오류 발생:', countErr);
        return res.status(500).send('사용자 총수를 가져오는 중 오류가 발생했습니다.');
      }

      const totalUsers = countResults[0].total;
      res.json({ users: results, total: totalUsers });
    });
  });
});


// 사용자 정보 조회 API
app.get('/api/user/:id', (req, res) => {
  const userId = req.params.id;
  const sql = 'SELECT * FROM members WHERE id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('사용자 정보를 가져오는 중 오류 발생:', err);
      res.status(500).send('서버 오류');
    } else if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).send('사용자를 찾을 수 없습니다.');
    }
  });
});

// 게시글 목록 조회 API
app.get('/api/posts', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  const query = `SELECT bnum, title, contents, writer, report_count, regdate FROM board LIMIT ${limit} OFFSET ${offset}`;
  db.query(query, (err, results) => {
    if (err) {
      console.error('게시글 목록을 가져오는 중 오류 발생:', err);
      res.status(500).send('서버 오류');
    } else {
      // 총 게시글 수를 가져와서 응답에 포함시킵니다.
      const countQuery = 'SELECT COUNT(*) AS count FROM board';
      db.query(countQuery, (err, countResults) => {
        if (err) {
          console.error('게시글 수를 가져오는 중 오류 발생:', err);
          res.status(500).send('서버 오류');
        } else {
          res.json({
            posts: results,
            total: countResults[0].count
          });
        }
      });
    }
  });
});



// 사용자의 신고 기록 삭제 API
app.post('/api/deleteReportsByUser', (req, res) => {
  const userId = req.body.userId;
  const deleteReportsQuery = 'DELETE FROM reports WHERE memberid = ?';
  
  db.query(deleteReportsQuery, [userId], (err, results) => {
    if (err) {
      console.error('사용자의 신고 기록을 삭제하는 중 오류 발생:', err);
      return res.status(500).send('서버 오류');
    }
    res.send('사용자의 신고 기록이 삭제되었습니다.');
  });
});

// 사용자 차단/차단 해제 API
app.post('/api/toggleBlockUser', authenticateJWT, (req, res) => {
  const { id, isBlocked } = req.body;

  const blockUntil = new Date();
  blockUntil.setDate(blockUntil.getDate() + 1);

  const query = isBlocked ? 
    'UPDATE members SET isBlocked = FALSE, blockUntil = NULL WHERE id = ?' :
    'UPDATE members SET isBlocked = TRUE, blockUntil = ? WHERE id = ?';

  const params = isBlocked ? [id] : [blockUntil, id];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('사용자 차단/차단 해제 중 오류 발생:', err);
      return res.status(500).send('서버 오류');
    }
    res.send(isBlocked ? '사용자 차단 해제되었습니다.' : '사용자가 차단되었습니다.');
  });
});


// 사용자 삭제 API
app.post('/api/deleteUser', (req, res) => {
  const { id } = req.body;

  const deleteUserData = (userId, callback) => {
    const deleteQueries = [
      'DELETE FROM readinglist WHERE userid = ?',
      'DELETE FROM cart WHERE user_id = ?',
      'DELETE FROM reservations WHERE user_id = ?',
      'DELETE FROM comments WHERE memberid = ?',
      'DELETE FROM playlists WHERE creator_id = ?',
      'DELETE FROM payment WHERE user_id = ?',
      'DELETE FROM bookreviews WHERE memberid = ?',
      'DELETE FROM board WHERE writer = ?',
      'DELETE FROM used_books WHERE seller_id = ?', // 추가된 부분
      'DELETE FROM reports WHERE memberid = ?' // 추가된 부분
    ];

    const executeDeleteQueries = (index) => {
      if (index < deleteQueries.length) {
        db.query(deleteQueries[index], [userId], (err) => {
          if (err) {
            callback(err);
          } else {
            executeDeleteQueries(index + 1);
          }
        });
      } else {
        callback(null);
      }
    };

    executeDeleteQueries(0);
  };

  deleteUserData(id, (err) => {
    if (err) {
      console.error('MySQL Error:', err);
      res.status(500).send('Database query error while deleting user data');
    } else {
      const deleteUserSql = 'DELETE FROM members WHERE id = ?';
      db.query(deleteUserSql, [id], (err) => {
        if (err) {
          console.error('MySQL Error:', err);
          res.status(500).send('Database query error while deleting user');
        } else {
          res.status(200).send('User deleted successfully');
        }
      });
    }
  });
});


// 게시물 삭제 API
app.post('/api/deletePost', (req, res) => {
  const postId = req.body.id;
  if (!postId) {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  const deleteReportsQuery = 'DELETE FROM reports WHERE boardnum = ?';
  const deleteCommentsQuery = 'DELETE FROM comments WHERE boardnum = ?';
  const deletePostQuery = 'DELETE FROM board WHERE bnum = ?';

  // 트랜잭션 시작
  db.beginTransaction((err) => {
    if (err) {
      console.error('Transaction error:', err);
      return res.status(500).json({ error: 'Failed to delete post' });
    }

    // 리포트 삭제
    db.query(deleteReportsQuery, [postId], (err, result) => {
      if (err) {
        return db.rollback(() => {
          console.error('Database query error (reports):', err);
          return res.status(500).json({ error: 'Failed to delete reports' });
        });
      }

      // 댓글 삭제
      db.query(deleteCommentsQuery, [postId], (err, result) => {
        if (err) {
          return db.rollback(() => {
            console.error('Database query error (comments):', err);
            return res.status(500).json({ error: 'Failed to delete comments' });
          });
        }

        // 게시글 삭제
        db.query(deletePostQuery, [postId], (err, result) => {
          if (err) {
            return db.rollback(() => {
              console.error('Database query error (post):', err);
              return res.status(500).json({ error: 'Failed to delete post' });
            });
          }

          // 트랜잭션 커밋
          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error('Transaction commit error:', err);
                return res.status(500).json({ error: 'Failed to delete post' });
              });
            }

            res.status(200).json({ message: 'Post and related comments and reports deleted successfully' });
          });
        });
      });
    });
  });
});



// 사용자 차단 상태 확인 API
app.get('/api/checkBlockStatus', authenticateJWT, (req, res) => {
  const userId = req.user.id;

  const query = 'SELECT isBlocked, blockUntil FROM members WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('차단 상태를 확인하는 중 오류 발생:', err);
      res.status(500).send('서버 오류');
    } else {
      const user = results[0];
      const now = new Date();
      if (user.isBlocked && new Date(user.blockUntil) > now) {
        res.json({ isBlocked: true });
      } else {
        res.json({ isBlocked: false });
      }
    }
  });
});

// 특정 게시글 조회 API
app.get('/api/posts/:postId', (req, res) => {
  const postId = req.params.postId;
  const sql = 'SELECT * FROM board WHERE bnum = ?';
  
  db.query(sql, [postId], (err, result) => {
    if (err) {
      console.error('게시글 정보를 가져오는 중 오류 발생:', err);
      res.status(500).send('서버 오류');
    } else if (result.length === 0) {
      res.status(404).send('게시글을 찾을 수 없습니다');
    } else {
      res.json(result[0]);
    }
  });
});


// 게시글 신고 API
app.post('/api/board/report/:bnum', (req, res) => {
  const bnum = req.params.bnum;
  const userId = req.body.userId;

  // 사용자가 이미 신고했는지 확인합니다.
  const checkReportQuery = 'SELECT * FROM reports WHERE boardnum = ? AND id = ?';
  db.query(checkReportQuery, [bnum, userId], (err, results) => {
      if (err) {
          console.error('Error checking report:', err);
          return res.status(500).send('서버 오류');
      }

      if (results.length > 0) {
          return res.status(400).send('이미 신고한 게시글입니다.');
      }

      // 신고를 추가하고, 신고 횟수를 증가시킵니다.
      const addReportQuery = 'INSERT INTO reports (boardnum, memberid) VALUES (?, ?)';
      db.query(addReportQuery, [bnum, userId], (err) => {
          if (err) {
              console.error('Error adding report:', err);
              return res.status(500).send('서버 오류');
          }

          const updateBoardQuery = 'UPDATE board SET report_count = report_count + 1 WHERE bnum = ?';
          db.query(updateBoardQuery, [bnum], (err) => {
              if (err) {
                  console.error('Error updating report count:', err);
                  return res.status(500).send('서버 오류');
              }

              res.send('신고가 성공적으로 접수되었습니다.');
          });
      });
  });
});

// 결제 목록 가져오기
app.get('/api/payments', (req, res) => {
  db.query('SELECT * FROM payment', (err, results) => {
    if (err) {
      console.error('Error fetching payment:', err);
      res.status(500).send('Error fetching payments');
      return;
    }
    res.json(results);
  });
});

// 관리자 결제 취소 API
app.post('/api/cancelPayment', authenticateJWT, async (req, res) => {
  const { merchant_uid } = req.body;

  if (!merchant_uid) {
    return res.status(400).send('취소할 imp_uid 또는 merchant_uid를 지정해주셔야합니다.');
  }

  try {
    const token = await getToken();

    // 결제 취소 요청
    const cancelResponse = await axios.post('https://api.iamport.kr/payments/cancel', {
      merchant_uid: merchant_uid
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (cancelResponse.data.code === 0) {
      // 결제 상태 업데이트
      const query = 'UPDATE payment SET status = ? WHERE merchant_uid = ?';
      db.query(query, ['결제 취소', merchant_uid], (err, result) => {
        if (err) {
          console.error('결제 상태 업데이트 중 오류 발생:', err);
          res.status(500).send('서버 오류');
        } else {
          res.send('결제가 취소되었습니다.');
        }
      });
    } else {
      res.status(400).send(cancelResponse.data.message);
    }
  } catch (error) {
    console.error('결제를 취소하는 중 오류 발생:', error);
    res.status(500).send('결제 취소 중 오류가 발생했습니다.');
  }
});

// 관리자 / 예약 목록 가져오기
app.get('/api/reservations', (req, res) => {
  const sql = `
    SELECT 
      r.id, r.merchant_uid, r.user_id, r.seats, r.total_price, r.status, r.reserved_at,
      c.title as concert_title, m.name as buyer_name
    FROM 
      reservations r
    JOIN 
      concerts c ON r.concert_id = c.id
    JOIN 
      members m ON r.user_id = m.id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching reservations:', err);
      res.status(500).send('Error fetching reservations');
      return;
    }
    res.json(results);
  });
});

// 예약 취소 API
app.post('/api/cancel-reservation', authenticateJWT, async (req, res) => {
  const { reservation_id, reason } = req.body;
  const userId = req.user.id;

  try {
    // 예약 정보를 조회하여 사용자 확인
    const reservationSelectSql = 'SELECT * FROM reservations WHERE id = ? AND user_id = ?';
    db.query(reservationSelectSql, [reservation_id, userId], async (err, reservationResults) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).send('Database query error');
      }

      if (reservationResults.length === 0) {
        return res.status(404).send('Reservation not found');
      }

      const reservation = reservationResults[0];
      if (reservation.status === '예약 취소') {
        return res.status(400).send('이미 취소된 예약입니다.');
      }

      const token = await getToken();

      // 아임포트 결제 취소
      const response = await axios.post(
        'https://api.iamport.kr/payments/cancel',
        { merchant_uid: reservation.merchant_uid, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.message);
      }

      // 예약 상태 업데이트 및 좌석 정보 삭제
      const reservationUpdateSql = 'UPDATE reservations SET status = ? WHERE id = ?';
      db.query(reservationUpdateSql, ['예약 취소', reservation_id], (err) => {
        if (err) {
          console.error('Database query error:', err);
          return res.status(500).send('Database query error');
        }

        const seatDeleteSql = 'DELETE FROM seats WHERE concert_id = ? AND seat_number IN (?)';
        db.query(seatDeleteSql, [reservation.concert_id, reservation.seats.split(',')], (err) => {
          if (err) {
            console.error('Database query error:', err);
            return res.status(500).send('Database query error');
          }

          res.status(200).send('Reservation cancelled successfully');
        });
      });
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error.message);
    res.status(500).send(error.message);
  }
});

// 강연 생성 API
app.post('/api/create-concerts', authenticateJWT, (req, res) => {
  const { title, speaker, date, location, price, imageUrl, description } = req.body;

  if (req.user.id !== 'admin') {
    return res.status(403).send('권한이 없습니다.');
  }

  const sql = 'INSERT INTO concerts (title, speaker, date, location, price, imageUrl, description) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [title, speaker, date, location, price, imageUrl, description], (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send('Database query error');
    }

    res.status(201).send('강연이 성공적으로 생성되었습니다.');
  });
});

// 강연 삭제 API
app.delete('/api/concerts/:id', authenticateJWT, (req, res) => {
  const concertId = req.params.id;

  if (req.user.id !== 'admin') {
    return res.status(403).send('권한이 없습니다.');
  }

  const sql = 'DELETE FROM concerts WHERE id = ?';
  db.query(sql, [concertId], (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send('Database query error');
    }

    res.status(200).send('강연이 성공적으로 삭제되었습니다.');
  });
});

// 단일 강연 조회 API
app.get('/api/concerts/:id', (req, res) => {
  const concertId = req.params.id;
  const sql = 'SELECT * FROM concerts WHERE id = ?';
  db.query(sql, [concertId], (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send('Database query error');
    }
    if (result.length === 0) {
      return res.status(404).send('강연을 찾을 수 없습니다.');
    }
    res.json(result[0]);
  });
});

// 강연 수정 API
app.put('/api/concerts/:id', authenticateJWT, (req, res) => {
  const concertId = req.params.id;
  const { title, speaker, date, location, price, imageUrl, description } = req.body;

  if (req.user.id !== 'admin') {
    return res.status(403).send('권한이 없습니다.');
  }

  const sql = 'UPDATE concerts SET title = ?, speaker = ?, date = ?, location = ?, price = ?, imageUrl = ?, description = ? WHERE id = ?';
  db.query(sql, [title, speaker, date, location, price, imageUrl, description, concertId], (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send('Database query error');
    }
    res.status(200).send('강연이 성공적으로 수정되었습니다.');
  });
});

// Contact 메시지 저장 API
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  
  const sql = 'INSERT INTO contact (name, email, message, created_at) VALUES (?, ?, ?, NOW())';
  db.query(sql, [name, email, message], (err, result) => {
    if (err) {
      console.error('메시지 저장 중 오류 발생:', err);
      res.status(500).send('메시지 저장 중 오류가 발생했습니다.');
    } else {
      res.status(200).send('메시지가 성공적으로 전송되었습니다.');
    }
  });
});

// 문의 목록 가져오기 API
app.get('/api/contacts', authenticateJWT, (req, res) => {
  const sql = 'SELECT * FROM contact ORDER BY created_at DESC';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('문의 목록을 가져오는 중 오류 발생:', err);
      res.status(500).send('문의 목록을 가져오는 중 오류가 발생했습니다.');
    } else {
      res.json(results);
    }
  });
});
