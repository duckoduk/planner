document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card) => {
        card.addEventListener('click', () => {
            window.location.replace(`/leaderboard/${card.querySelector('.label').textContent}`)
        })
    })
})