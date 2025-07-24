    //로컬에서 학번 가져오기
    const student_id = localStorage.getItem('student_id');
    const username = localStorage.getItem('username');
    const student_class = student_id ? `${student_id[0]}-${parseInt(student_id.slice(1, 3))}` : '학번 없음';
    console.log(student_class);

    // 페이지 로드 시 학번과 이름을 표시
    document.getElementById('student-id').textContent = student_id || '학번 없음';
    document.getElementById('username').textContent = username || '이름 없음'; 
    document.getElementById('student-class').textContent = student_class;
    console.log('학번:', student_id, '이름:', username);

    async function loadProfileData() {
    const res = await fetch('/profile-data');
    const result = await res.json();
    console.log('프로필 데이터:', result);
    if (result.success) {
        const images = result.images;
        const list = document.querySelector('.events-list');

        images.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'event-item';
        div.innerHTML = `
            <img class="event-thumb" src="${item.image_link}" alt="이벤트 이미지">
            <div class="event-info">
            <div class="event-date">${item.created_at?.slice(0, 10) || '날짜 없음'}</div>
            <div class="event-actions">
                <img src="images/post_leaderboard/edit_icon.png" alt="수정">
                <img src="images/post_leaderboard/trash_icon.png" alt="삭제">
            </div>
            </div>
        `;
        list.appendChild(div);
        });
    } else {
        alert('데이터 불러오기 실패');
    }
    }

    loadProfileData();
