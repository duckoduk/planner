const express = require('express')
const app = express()
const path = require('path')
const port = 5000

// static 폴더로 지정
app.use(express.static(path.join(__dirname, 'public')))

// json 데이터 req.body로 접근 가능하게 함
app.use(express.json())


app.post('/login', (req, res) => {
    const { number, password } = req.body
    // DB에서 있는지 확인 어쩌고저쩌고 구현해.
    // 1. 사용자가 존재할 경우
    // 2. 비밀번호가 맞을 경우
    //    -> 로그인 성공
    // -> 사용자가 존재하지 않음
    
    // 데이터 송신 형태 : {success:boolean, message:'대충왜오륜지에대한메세지' id: userId}

    // httpOnly로 세션 기반 인증
    // cookie-parser
    // byscript
    // 이것저것 ㅎㅇㅌ
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