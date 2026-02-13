// Catch photos game
let catchScore = 0, catchInterval = null;
const CATCH_GOAL = 10;

const CATCH_IMAGES = [
    'assets/images/hearts/heart1.jpg',
    'assets/images/hearts/heart2.jpg',
    'assets/images/hearts/heart3.jpg',
    'assets/images/hearts/heart4.jpg',
    'assets/images/hearts/heart5.jpg',
    'assets/images/hearts/heart6.jpg'
];

function initCatchGame() {
    if (catchInterval) { clearInterval(catchInterval); catchInterval = null; }
    catchScore = 0;
    updateCatchScore();
    document.getElementById('catch-area').innerHTML = '';
    catchInterval = setInterval(spawnHeart, 700);
}

function spawnHeart() {
    if (catchScore >= CATCH_GOAL) { clearInterval(catchInterval); return; }
    const area = document.getElementById('catch-area');
    const heart = document.createElement('div');
    heart.className = 'falling-heart';

    const img = document.createElement('img');
    img.src = CATCH_IMAGES[Math.floor(Math.random() * CATCH_IMAGES.length)];
    img.alt = '';
    img.draggable = false;
    heart.appendChild(img);

    const x = Math.random() * (area.offsetWidth - 55);
    heart.style.left = x + 'px';
    heart.style.top = '-60px';
    const duration = 2000 + Math.random() * 1500;
    const startTime = Date.now();

    function onCatch(e) {
        e.preventDefault();
        if (heart.classList.contains('caught')) return;
        heart.classList.add('caught');
        catchScore++;
        updateCatchScore();
        if (catchScore >= CATCH_GOAL) {
            clearInterval(catchInterval);
            setTimeout(() => goToScreen('screen-memory'), 800);
        }
        setTimeout(() => heart.remove(), 400);
    }
    heart.addEventListener('click', onCatch);
    heart.addEventListener('touchstart', onCatch, { passive: false });
    area.appendChild(heart);

    (function fall() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        if (progress >= 1 || heart.classList.contains('caught')) {
            if (!heart.classList.contains('caught')) heart.remove();
            return;
        }
        heart.style.top = (progress * (area.offsetHeight + 60) - 60) + 'px';
        heart.style.transform = `translateX(${Math.sin(elapsed / 200) * 15}px)`;
        requestAnimationFrame(fall);
    })();
}

function updateCatchScore() {
    document.getElementById('catch-score').textContent = `${catchScore} / ${CATCH_GOAL}`;
    document.getElementById('catch-progress').style.width = `${(catchScore / CATCH_GOAL) * 100}%`;
}
