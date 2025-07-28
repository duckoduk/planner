document.addEventListener('DOMContentLoaded', () => {
    // 회원가입 폼 요소들
    const numInput = document.getElementById('num'); 
    const idInput = document.getElementById('id');
    const passInput = document.getElementById('password');
    const confirmPassInput = document.getElementById('confirm-password');
    const termsCheckbox = document.getElementById('terms');
    const registerBtn = document.querySelector('.btn');
    const errorMessage = document.getElementById('error-message');
    const first = [32, 32, 32, 32, 32, 32, 31, 31, 31, 31, 31, 31]
    const second = [33, 33, 33, 31, 32, 35, 33, 35, 35, 33, 35, 33]
    registerBtn.addEventListener('click', async () => {// 회원가입 버튼 클릭 시
        console.log('회원가입 버튼 클릭됨');
        const number = numInput.value;
        const id = idInput.value;
        const password = passInput.value;
        const confirmPassword = confirmPassInput.value;
        
        if (!number || !id || !password || !confirmPassword) {
            errorMessage.textContent = '모든 입력란을 채워주세요.';
            errorMessage.style.display = 'block';
            return;
        }

        const idString = String(number)
        const grade = parseInt(idString.charAt(0), 10);
        const classNum = parseInt(idString.substring(1, 3), 10);
        const indiNum = parseInt(idString.substring(3, 5), 10)
        let numberError = false
        if (idString.length !== 5) numberError = true
        else if (grade < 1 || grade > 2) numberError = true
        else if (classNum > 12 || classNum < 1) numberError = true
        else if (grade === 1 && indiNum > first[classNum - 1]) numberError = true // 1학년 인원수 제한
        else if (grade === 2 && indiNum > second[classNum - 1]) numberError = true // 2학년 인원수 제한
        
        if (numberError) {
            errorMessage.textContent = '유효하지 않은 학번입니다.'
            errorMessage.style.display = 'block'
            return;
        }

        if (id.length > 6) {
            errorMessage.textContent = 'ID는 6자 이내여야 합니다.'
            errorMessage.style.display = 'block'
            return;
        }

        if (password !== confirmPassword) {
            errorMessage.textContent = '비밀번호가 일치하지 않습니다.';
            errorMessage.style.display = 'block';
            return;
        }

        if (!termsCheckbox.checked) {
            errorMessage.textContent = '동의 사항에 체크해주세요.';
            errorMessage.style.display = 'block';
            return;
        }

        errorMessage.style.display = 'none';

        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ number, id, password }),
        });

        const result = await response.json();

        if (result.success) {
            alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
            window.location.href = '/'; // 로그인 페이지로 리디렉션
        } else {
            errorMessage.textContent = result.message;
            errorMessage.style.display = 'block';
        }
    });
});
