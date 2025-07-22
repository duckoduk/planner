const express = require('express')
const app = express()
const path = require('path')
const port = 5000
const supabase = require('./supabaseClient') // Supabase 클라이언트 가져오기

// static 폴더로 지정
app.use(express.static(path.join(__dirname, 'public')))

// json 데이터 req.body로 접근 가능하게 함
app.use(express.json())
 
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