// Floating background hearts
let bgHeartIntervalId = null;

function createBgHeart() {
    const heart = document.createElement('div');
    heart.className = 'bg-heart';
    const emojis = ['\u2764\uFE0F', '\uD83D\uDC97', '\uD83D\uDC95', '\uD83E\uDE77', '\uD83D\uDC96'];
    heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.fontSize = (Math.random() * 18 + 12) + 'px';
    heart.style.animationDuration = (Math.random() * 4 + 5) + 's';
    heart.style.opacity = Math.random() * 0.4 + 0.3;
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 9000);
}
bgHeartIntervalId = setInterval(createBgHeart, 500);

function stopBackgroundHearts() {
    if (bgHeartIntervalId) {
        clearInterval(bgHeartIntervalId);
        bgHeartIntervalId = null;
    }
    document.querySelectorAll('.bg-heart').forEach(h => h.remove());
}

function startBackgroundHearts() {
    if (!bgHeartIntervalId) {
        bgHeartIntervalId = setInterval(createBgHeart, 500);
    }
}
