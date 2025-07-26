document.addEventListener('DOMContentLoaded', () => {
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
});