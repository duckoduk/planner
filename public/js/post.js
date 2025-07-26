document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('post').className += ' active'
    
    // 총 공부시간 max 값 초과 방지 로직
    const timeInputs = document.querySelectorAll('.time-num');

    timeInputs.forEach(input => {
      input.addEventListener('input', () => {
        const max = parseInt(input.max, 10);
        const min = parseInt(input.min, 10);

        if (input.value) {
          let value = parseInt(input.value, 10);

          if (value > max) {
            input.value = max;
          } else if (value < min) {
            input.value = min;
          }
        }
      });
    });

    // 이미지 업로드 미리보기
    const uploadArea = document.querySelector('.upload-area'); 
    const fileInput = uploadArea.querySelector('input[type="file"]');
    const imagePreview = uploadArea.querySelector('img');

    fileInput.addEventListener('change', function(event) {// 파일이 선택되었을 때
        const file = event.target.files[0];// 첫 번째 파일을 가져옴

        if (file && file.type.startsWith('image/')) {// 이미지 파일인지 확인
        const reader = new FileReader();// FileReader 객체 생성
        reader.onload = function(e) {// 파일 읽기가 완료되면
            imagePreview.src = e.target.result;// 미리보기 이미지에 설정
        };
        reader.readAsDataURL(file);// 파일을 Data URL로 읽음
        }
    });
    // post
    document.querySelector('.post-btn').addEventListener('click', async () => {
        const fileInput = document.querySelector('input[type="file"]');
        const file = fileInput.files[0];
        const text = document.querySelector('textarea').value;

        const timeInputs = document.querySelectorAll('.time-num');
        const hours = parseInt(timeInputs[0].value) || 0;
        const minutes = parseInt(timeInputs[1].value) || 0;
        const seconds = parseInt(timeInputs[2].value) || 0;
        const total_time = hours * 3600 + minutes * 60 + seconds;

        if (!file || !text) {
            alert('모든 항목을 입력해주세요!');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);
        formData.append('text', text);
        formData.append('total_time', total_time);
        console.log(' debug check');
        const response = await fetch('/upload-image', {
            method: 'POST',
            body: formData,
        });
        console.log('response:', response);
        const result = await response.json();
        alert(result.message);
        window.location.replace('/profile')
    });
})
