const express = require('express')
const app = express()
const path = require('path')
const port = 5000
const supabase = require('./supabaseClient') // Supabase 클라이언트 가져오기
const multer = require('multer');// 파일 업로드를 위한 multer 모듈 가져오기
const fs = require('fs');// 파일 시스템 모듈 가져오기

// static 폴더로 지정
app.use(express.static(path.join(__dirname, 'public')))

// json 데이터 req.body로 접근 가능하게 함
app.use(express.json())
//로그인
app.post('/login', async (req, res) => { // 함수를 async로 변경
    const { number, password } = req.body
 
    // 예시: Supabase의 'users' 테이블에서 사용자 정보 가져오기
    try {
        const { data, error } = await supabase
            .from('users') // 'users' 테이블 지정 (로그인 데이터 디비임)
            .select('*')
            .eq('student_id', number) // 'number'에 학번(student_id)값 할당
            .single(); // 한 개의 행만 ok. 없거나 여러 개 -> 에러
 
        if (error) {// error! error! 위이이이이이이이이잉 웨에에에ㅔ에에에에에엥
            console.error(error);
            // 사용자X-> .single()이 'PGRST116' 코드를 포함한 에러를 반환.
            if (error.code === 'PGRST116') {
                return res.status(404).json({ success: false, message: '사용자가 존재하지 않습니다.' });
            }
            return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }
 
        // 1. 사용자가 존재할 경우 (data가 null이 아님)
        // 비밀번호를 확인->  bcrypt 사용
        // const isPasswordCorrect = await bcrypt.compare(password, data.password_hash);
        const isPasswordCorrect = (password === data.password); // 일단 bycrypt 빼놈. 나중에 활성화만 시키면 대!
 
        // 2. 비밀번호가 맞을 경우
        if (isPasswordCorrect) {
            // -> 로그인 성공
            // 세션/토큰 로직.
            return res.json({ success: true, message: '로그인 성공!', userId: data.id });
        } else {
            // 비밀번호가 틀릴 경우
            return res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
        }
 
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: '알 수 없는 오류가 발생했습니다.' });
    }
})

//회원가입
app.post('/register', async (req, res) => {
    const { number, id, password } = req.body;

    try {
        // 회원가입 로직
        const { data, error } = await supabase
            .from('users')
            .insert([{ student_id: number, username: id, password: password }]) // supabase 저장 해싱 나중에 하겟음.
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

app.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    const { student_id, text, total_time } = req.body;
    const file = req.file;

    const storagePath = `${student_id}/${file.filename}`;

    // 1. Supabase Storage에 업로드
    const { data, error: uploadError } = await supabase.storage
      .from('planner-image')
      .upload(storagePath, fs.readFileSync(file.path), {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error(uploadError);
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
      .insert([{ student_id, image_link, text, total_time: Number(total_time) }]);

    if (insertError) {
      console.error(insertError);
      return res.status(500).json({ message: 'DB 저장 실패' });
    }

    // 4. 임시 파일 제거
    fs.unlinkSync(file.path);

    return res.json({ message: '업로드 성공!' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: '서버 오류' });
  }
});
app.get('/explore', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'explore.html'))
})

// login.html
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'login.html'))
})


// server open
app.listen(port, () => {
	console.log(`${port}(으)로 서버가 열렸습니다.`)
})