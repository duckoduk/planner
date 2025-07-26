function openImageModal(src) {
  const modal = document.getElementById('image-modal');
  const img = document.getElementById('image-modal-img');
  img.src = src;
  modal.classList.add('active');
}

function closeImageModal() {
  const modal = document.getElementById('image-modal');
  modal.classList.remove('active');
}

// 이벤트 연결
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.zoomable-image').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      openImageModal(img.src);
    });
  });
});