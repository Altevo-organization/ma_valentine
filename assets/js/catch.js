// Catch hearts game
let catchScore = 0, catchInterval = null;
const CATCH_GOAL = 10;

function initCatchGame() {
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
    const hearts = ['\u2764\uFE0F', '\uD83D\uDC97', '\uD83D\uDC96', '\uD83D\uDC9D', '\uD83E\uDE77'];
    heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    const x = Math.random() * (area.offsetWidth - 40);
    heart.style.left = x + 'px';
    heart.style.top = '-40px';
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
        heart.style.top = (progress * (area.offsetHeight + 40) - 40) + 'px';
        heart.style.transform = `translateX(${Math.sin(elapsed / 200) * 15}px)`;
        requestAnimationFrame(fall);
    })();
}

function updateCatchScore() {
    document.getElementById('catch-score').textContent = `${catchScore} / ${CATCH_GOAL}`;
    document.getElementById('catch-progress').style.width = `${(catchScore / CATCH_GOAL) * 100}%`;
}
