document.addEventListener('DOMContentLoaded', () => {
    // 회원가입 폼 요소들
    const numInput = document.getElementById('num'); 
    const idInput = document.getElementById('id');
    const passInput = document.getElementById('password');
    const confirmPassInput = document.getElementById('confirm-password');
    const termsCheckbox = document.getElementById('terms');
    const registerBtn = document.querySelector('.btn');
    const errorMessage = document.getElementById('error-message');

    registerBtn.addEventListener('click', async () => {// 회원가입 버튼 클릭 시
        console.log('회원가입 버튼 클릭됨');
        const number = numInput.value;
        const id = idInput.value;
        const password = passInput.value;
        const confirmPassword = confirmPassInput.value;
        console.log(`학번: ${number}, ID: ${id}, 비밀번호: ${password}, 비밀번호 확인: ${confirmPassword}`);
        
        if (!number || !id || !password || !confirmPassword) {
            errorMessage.textContent = '모든 필드를 입력해주세요.';
            errorMessage.style.display = 'block';
            return;
        }

        if (password !== confirmPassword) {
            errorMessage.textContent = '비밀번호가 일치하지 않습니다.';
            errorMessage.style.display = 'block';
            return;
        }

        if (!termsCheckbox.checked) {
            errorMessage.textContent = '이용약관 및 개인정보 처리방침에 동의해주세요.';
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
