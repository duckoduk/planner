document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('explore').className += ' active'
    const cards = document.querySelectorAll('.card');
    cards.forEach((card) => {
        card.addEventListener('click', () => {
            window.location.replace(`/leaderboard/${card.querySelector('.label').textContent}`)
        })
    })
})