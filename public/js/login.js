const button = document.querySelector('.btn')
const num = document.getElementById('num')
const pass = document.getElementById('pass')
const err1 = document.getElementById('error1')
const err2 = document.getElementById('error2')

button.addEventListener('click', async () => {
    let number = num.value
    let password = pass.value

    err1.style.display = 'none'
    err2.style.display = 'none'
    let isError = false

    // 학번
    if (!number) {
        isError = true
        err1.innerText = "학번을 입력해주세요."
        err1.style.display = 'block'
    }
    
    // 비번
    if (!password) {
        isError = true
        err2.innerText = "비밀번호를 입력해주세요."
        err2.style.display = 'block'
    }

    if (isError) return

    // 대충 로그인 요청
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number, password })
        })

        const data = await response.json()
        if (response.ok) {
            if (data.success) {
                window.location.replace('/explore')
            } else {
                err2.innerText = data.message || '로그인에 실패했습니다.'
            }
        } else {
            err2.innerText = data.message || `오류 발생: ${response.status} ${response.statusText}`
        }
    } catch (error) {
        console.error('로그인 요청 중 오류 발생', error)
        err2.innerText = '서버와 통신 중 오류가 발생했습니다.'
    }
})
