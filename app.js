const express = require('express')
const app = express()
const path = require('path')
const port = 5000
const multer = require('multer');// 파일 업로드를 위한 multer 모듈 가져오기
const fs = require('fs');// 파일 시스템 모듈 가져오기

// 세션 기반 인증
const bcrypt = require('bcryptjs')
const session = require('express-session')
const pg = require('pg');
const pgSession = require('connect-pg-simple')(session);

require('dotenv').config(); // env 가져오기
const supabase = require('./supabaseClient'); // supbase 가져오기

const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// static 폴더로 지정
app.use(express.static(path.join(__dirname, 'public')))

app.set('trust proxy', 1) // 세션 쿠키를 HTTPS로 설정하기 위해 필요
// ejs 관련
app.set('view engine', 'ejs') // ejs 템플릿 엔진 사용
app.set('views', path.join(__dirname, 'views')) // views 폴더 지정

// json 데이터 req.body로 접근 가능하게 함
app.use(express.json())

// express-session 미들웨어 설정 (PostgreSQL 세션 저장소 사용)
app.use(session({
  store: new pgSession({
    pool: pgPool, // 연결 풀 사용
    tableName: 'session',
    createTableIfMissing: false,
  }),
  secret: process.env.SESSION_SECRET, // 세션 ID를 서명하는 비밀 키
  resave: false, // 세션이 변경되지 않아도 다시 저장할지 여부
  saveUninitialized: false, // 초기화되지 않은 세션을 저장할지 여부
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 일주일 (세션 유지 시간)
    httpOnly: true, // JavaScript에서 쿠키 접근 불가
    secure: process.env.NODE_ENV === 'production', // HTTPS 환경에서만 쿠키 전송
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// 세션 기반 인증 미들웨어
const isAuthenticated = (req, res, next) => {
  // 세션에 userId가 있는지 확인하여 로그인 여부 판단
  if (req.session && req.session.userId) {
    next(); // 로그인되어 있으면 다음 미들웨어 또는 라우트로 이동
  } else {
    // 로그인되어 있지 않으면 401 Unauthorized 응답
    res.status(401).json({ message: '로그인이 필요합니다.', 'session': req.session });
  }
};

// 로그인
app.post('/login', async (req, res) => {
  const { number, password } = req.body

  // Supabase의 'users' 테이블에서 사용자 정보 가져오기
  try {
    const { data: user, error: userError } = await supabase
      .from('users') // 'users' 테이블 지정 (로그인 데이터 디비임)
      .select('*')
      .eq('student_id', number) // 'number'에 학번(student_id)값 할당
      .single(); // 한 개의 행만 ok. 없거나 여러 개 -> 에러

    if (userError) {// error! error! 위이이이이이이이이잉 웨에에에ㅔ에에에에에엥
      console.error(userError);
      // 사용자X-> .single()이 'PGRST116' 코드를 포함한 에러를 반환.
      if (userError.code === 'PGRST116') {
        return res.status(404).json({ success: false, message: '사용자가 존재하지 않습니다.' });
      }
      return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }

    // 1. 사용자가 존재할 경우 (data가 null이 아님)
    // 비밀번호를 확인->  bcrypt 사용
    // const isPasswordCorrect = await bcrypt.compare(password, data.password_hash);
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    // 2. 비밀번호가 맞을 경우
    if (isPasswordCorrect) {
      // -> 로그인 성공
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.studentId = user.student_id;
      console.log('로그인 성공:', user.username);
      return res.json({
        success: true,
        message: '로그인 성공!',
        userId: user.id,
        username: user.username,
        studentId: user.student_id
      });
    } else {
      // 비밀번호가 틀릴 경우
      return res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: '알 수 없는 오류가 발생했습니다.' });
  }
})

// 회원가입
app.post('/register', async (req, res) => {
  const { number, id, password } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 회원가입 로직
    const { data, error } = await supabase
      .from('users')
      .insert([{ student_id: number, username: id, password: hashedPassword }]) // 해시된 비밀번호 저장
      .select()
      .single();

    if (error) {
      console.error('회원가입 에러:', error);
      // 23505=> PostgreSQL의 unique constraint violation 에러 코드임.(colums 항목중에 is unique그거)
      if (error.code === '23505') {
        return res.status(409).json({ success: false, message: '이미 사용 중인 학번 또는 ID입니다.' });
      }
      return res.status(500).json({ success: false, message: '데이터베이스 오류' });
    }

    return res.json({ success: true, message: '회원가입 성공!', userId: data.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: '알 수 없는 오류가 발생했습니다.' });
  }
})

// 업로드된 파일을 저장할 디렉토리 생성
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// post.ejs 라우팅
app.get('/post', isAuthenticated, (req, res) => {
  res.render('post')
})

// profile.ejs 라우팅
app.get('/profile', isAuthenticated, async (req, res) => {
  const student_id = req.session.studentId;
  const { data, error } = await supabase
    .from('image')
    .select('image_link, total_time, created_date')
    .eq('student_id', student_id)
    .order('created_date', { ascending: false })
  if (error) {
    console.error('이미지 조회 실패:', error);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
  res.render('profile', {images: data, username: req.session.username, student_id: String(req.session.studentId)})
})

// 이미지 업로드 요청
app.post('/upload-image', isAuthenticated, upload.single('image'), async (req, res) => {
  try {   
    const student_id = req.session.studentId;
    const { text, total_time:totTime } = req.body;
    const file = req.file;
    // created_date 하는거
    const today = new Date()
    const nowDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`

    // 중복 체크 //
    const { data: existingImages, error: checkError } = await supabase
      .from('image')
      .select('id')
      .eq('student_id', student_id)
      .eq('created_date', nowDate);

    if (checkError) {
      console.error('중복 확인 실패:', checkError);
      return res.status(500).json({ message: '중복 확인 중 오류 발생' });
    }

    if (existingImages && existingImages.length > 0) {
      return res.status(400).json({ message: '오늘은 이미 게시하였습니다. 매일 오전 9시에 다시 게시 가능합니다.' });
    }

    // 파일명 변경
    const ext = path.extname(file.originalname);
    const newFileName = `${student_id}-${Date.now()}${ext}`;
    const newFilePath = path.join(file.destination, newFileName);

    await fs.promises.rename(file.path, newFilePath);

    const storagePath = `${student_id}/${newFileName}`;
    // 1. Supabase Storage에 업로드
    const { data, error: uploadError } = await supabase.storage
      .from('planner-image')
      .upload(storagePath, fs.readFileSync(newFilePath), {
        contentType: file.mimetype,
        upsert: false,  
      });

    if (uploadError) {
      console.error(uploadError);
      fs.unlinkSync(newFilePath);
      return res.status(500).json({ message: 'Storage 업로드 실패' });
    }

    // 2. 퍼블릭 URL 생성
    const { data: urlData } = supabase.storage
      .from('planner-image')
      .getPublicUrl(storagePath);

    const image_link = urlData.publicUrl;

    // 3. DB 테이블 삽입
    const { error: insertError } = await supabase
      .from('image')
      .insert([{ student_id, image_link, text, total_time: Number(totTime), created_date: nowDate, username: req.session.username }]);

    if (insertError) {
      console.error(insertError);
      if (fs.existsSync(newFilePath)) fs.unlinkSync(newFilePath); // 실패 시 파일 삭제
      return res.status(500).json({ message: 'DB 저장 실패' });
    }
    const classId = String(student_id).slice(0, 3);

    // class_data 테이블에서 해당 class_id 조회
    const { data: classData, error: selectError } = await supabase
      .from('class_data')
      .select('total_count, total_time')
      .eq('class_id', classId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // 다른 에러일 경우 로그
      console.error('조회 중 오류:', selectError);
    }

    if (classData) {
      const newCount = classData.total_count + 1;
      const newTime = classData.total_time + Number(totTime)

      const { error: updateError } = await supabase
        .from('class_data')
        .update({ total_count: newCount, total_time: Number(newTime) })
        .eq('class_id', classId);

      if (updateError) {
        console.error('업데이트 실패:', updateError);
      }
    } else {
      // 해당 class_id가 없으면 새로 추가
      const { error: insertError } = await supabase
        .from('class_data')
        .insert([{ class_id: classId, total_count: 1 }]);

      if (insertError) {
        console.error('삽입 실패:', insertError);
      }
    }

    // user_data 테이블 데이터 변경
    const { data: userData, error: userSelectError } = await supabase
      .from('user_data')
      .select('total_count, total_time')
      .eq('student_id', student_id)
      .single();

    if (userData) {
      // 이미 존재하면 total_count +1로 업데이트
      const newUserCount = userData.total_count + 1;
      const newUserTime = userData.total_time + Number(totTime)
      const { error: userUpdateError } = await supabase
        .from('user_data')
        .update({ total_count: newUserCount, total_time: Number(newUserTime) })
        .eq('student_id', student_id);

      if (userUpdateError) {
        console.error('user_data 업데이트 실패:', userUpdateError);
      }
    } else {
      // 존재하지 않으면 새로 insert
      const { error: insertError } = await supabase
        .from('user_data')
        .insert([{ student_id, total_count: 1, username: req.session.username }]);

      if (insertError) {
        console.error('user_data 행 생성 실패:', insertError);
      }
    }


    // 4. 임시 파일 제거
    fs.unlinkSync(newFilePath);

    return res.json({ message: '업로드 성공!' });

  } catch (err) {
    console.error('이미지 업로드 중 서버 오류:', err);
    // 예외 발생 시 rename된 파일이 있을 경우 삭제 시도
    // newFilePath 변수가 정의되어 있고, 해당 경로에 파일이 실제로 존재하는지 확인
    if (typeof newFilePath !== 'undefined' && fs.existsSync(newFilePath)) {
      try {
        fs.unlinkSync(newFilePath);
      } catch (unlinkErr) {
        console.error('임시 파일 삭제 실패 (catch 블록):', unlinkErr);
      }
    }
    return res.status(500).json({ message: '서버 오류' });
  }
});

app.get('/explore', isAuthenticated, async (req, res) => {
  const { data, error } = await supabase
    .from('class_data')
    .select('*')
    .order('class_id', { ascending: true })

  if (error) {
    console.error('data 로드 에러 발생')
    return res.status(500).send('데이터 불러오기 중 오류 발생')
  }
  const changedData = data.map(row => {
    let classId = String(row.class_id)
    return {
      class_id: `${classId.charAt(0)}-${parseInt(classId.substring(1, 3))}`,
      total_count: row.total_count
    }
  })
  res.render('explore', { classes: changedData })
})

app.get('/leaderboard/:classId', isAuthenticated, async (req, res) => {
  let [grade, classNum] = req.params.classId.split('-').map((s) => { return String(s) })
  if (classNum.length === 1) classNum = '0' + classNum
  const cId = grade + classNum
  // class_id가 cId인 데이터 가져오기
  const { data: imageData, error: error } = await supabase //이건 image테이블
    .from('image')
    .select('student_id, image_link, text, total_time, username, created_date') //<-- 필요한 데이터만 골라 써
    .eq('class_id', cId)
    .order('created_at', { ascending: false })
    .limit(10) // 상위 10개만 가져오기 <-- 얼마나 필요한지 몰라서 그냥 씀
  if (error) {
    console.error('랭킹 데이터 조회 실패:', error);
  }
  const { data: userData, error: userError } = await supabase //이건 user_data테이블
    .from('user_data')
    .select('student_id, total_count, total_time, username')
    .order('total_count', { ascending: false }) // total_count 기준으로 내림차순 정렬(랭킹 정렬임)
    .eq('class_id', cId)
    .limit(5) // 상위 10개만 가져오기
  if (userError) {
    console.error('유저 데이터 조회 실패:', userError);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
  return res.render('leaderboard', { images: imageData, rank: userData, classId: req.params.classId });

})
app.get('/gallery/:classId', isAuthenticated, async (req, res) => {
let [grade, classNum] = req.params.classId.split('-').map((s) => { return String(s) })
  if (classNum.length === 1) classNum = '0' + classNum
  const cId = grade + classNum
  // class_id가 cId인 데이터 가져오기
  const { data: imageData, error: error } = await supabase //이건 image테이블
    .from('image')
    .select('student_id, image_link, text, total_time, username') //<-- 필요한 데이터만 골라 써
    .eq('class_id', cId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('랭킹 데이터 조회 실패:', error);
  }
  const { data: userData, error: userError } = await supabase //이건 user_data테이블
    .from('user_data')
    .select('student_id, total_count, total_time, username')
    .order('total_count', { ascending: false }) // total_count 기준으로 내림차순 정렬(랭킹 정렬임)
    .eq('class_id', cId)
    
  if (userError) {
    console.error('유저 데이터 조회 실패:', userError);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
  return res.render('gallery', { images: imageData, rank: userData, classId: req.params.classId });

})

// 타이머
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'timer.html'))
// })

// login.html
app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/explore'); 
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'))
})

// 로그아웃
app.get('/logout', (req, res) => {
  // 세션 파괴 (로그아웃)
  req.session.destroy(err => {
    if (err) {
      console.error('세션 파괴 실패:', err);
      return res.status(500).json({ success: false, message: '로그아웃 실패' });
    }
    // 클라이언트에게 성공 응답
    res.clearCookie('connect.sid'); // express-session 기본 쿠키 이름
    return res.redirect('/');
  });
});

//rank.ejs 라우팅
app.get('/rank', isAuthenticated, async (req, res) => {
  try {
    // 쿼리에서 type을 받아서 선택 (기본: class)
    const type = req.query.type === 'individual' ? 'individual' : 'class';
    
    const formatTime = (totalSeconds) => {
      if (!totalSeconds || totalSeconds < 0) return '0s';
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      let result = '';
      if (hours > 0) result += `${hours}시간 `;
      if (minutes > 0) result += `${minutes}분 `;
      if (seconds > 0 || result === '') result += `${seconds}초`;
      return result.trim();
    };

    if (type === 'individual') {
      const { data, error } = await supabase
        .from('user_data')
        .select('student_id, username, total_time, total_count')
        .order('total_count', { ascending: false })
        .order('total_time', { ascending: false });
      
      if (error) {
        console.error(`individual 랭킹 조회 실패:`, error);
        return res.status(500).send('랭킹 데이터를 불러오는 중 오류가 발생했습니다.');
      }
      res.render('rank', {ranking: data, type: type})
    } else {
      const { data, error } = await supabase
        .from('class_data')
        .select('class_id, total_time, total_count')
        .order('total_count', { ascending: false })
        .order('total_time', { ascending: false })
        .order('class_id', { ascending: true })
      
      if (error) {
        console.error(`class 랭킹 조회 실패:`, error);
        return res.status(500).send('랭킹 데이터를 불러오는 중 오류가 발생했습니다.');
      }
      res.render('rank', {ranking: data, type: type})
    }
  } catch (err) {
    console.error('랭킹 페이지 렌더링 오류:', err);
    res.status(500).send('서버 오류가 발생했습니다.');
  }
});

// server open
app.listen(port, () => {
  console.log(`${port}(으)로 서버가 열렸습니다.`)
})
