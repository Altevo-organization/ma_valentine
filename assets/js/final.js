// Final question + celebration
let noAttempts = 0;
const noTexts = ["Non \uD83D\uDE48", "T'es sure ? \uD83E\uDD28", "Vraiment ? \uD83D\uDE22", "Reflechis bien... \uD83E\uDD7A", "Derniere chance... \uD83D\uDE2D", "..."];
const dodgeMessages = [
    "Hop, rate ! \uD83D\uDE1C", "Ce bouton est en greve \uD83E\uDEA7", "Erreur 404 : 'Non' introuvable \uD83D\uDD0D",
    "Le bouton Non a pris ses vacances \uD83C\uDFD6\uFE0F", "Nope, essaie encore \uD83D\uDE0F", "Tu croyais vraiment ? \uD83D\uDE02",
    "Ce bouton ne marche pas, bizarre... \uD83E\uDD37", "La bonne reponse est a gauche \u2B05\uFE0F"
];

function dodgeNoTouch(e) { e.preventDefault(); dodgeNo(); }

function initQuestion() {
    noAttempts = 0;
    const noBtn = document.getElementById('no-btn');
    noBtn.textContent = noTexts[0];
    noBtn.style.cssText = '';

    // Remove old listeners to prevent stacking on re-entry
    noBtn.removeEventListener('mouseenter', dodgeNo);
    noBtn.removeEventListener('touchstart', dodgeNoTouch);
    noBtn.addEventListener('mouseenter', dodgeNo);
    noBtn.addEventListener('touchstart', dodgeNoTouch, { passive: false });
}

function dodgeNo() {
    const noBtn = document.getElementById('no-btn');
    const card = document.getElementById('question-card');
    const container = document.getElementById('final-buttons');
    noAttempts++;

    const msg = document.createElement('div');
    msg.className = 'dodge-message';
    msg.textContent = dodgeMessages[Math.min(noAttempts - 1, dodgeMessages.length - 1)];
    msg.style.left = (Math.random() * 60 + 20) + '%';
    msg.style.top = (Math.random() * 30) + '%';
    container.appendChild(msg);
    setTimeout(() => msg.remove(), 1500);

    if (noAttempts < noTexts.length) noBtn.textContent = noTexts[noAttempts];

    const scale = Math.max(0.4, 1 - noAttempts * 0.1);
    noBtn.style.fontSize = (15 * scale) + 'px';
    noBtn.style.padding = `${12 * scale}px ${28 * scale}px`;
    noBtn.style.opacity = Math.max(0.3, 1 - noAttempts * 0.12);

    const cardRect = card.getBoundingClientRect();
    const maxX = cardRect.width - 100;
    noBtn.style.position = 'relative';
    noBtn.style.left = (Math.random() * maxX - maxX / 2) + 'px';
    noBtn.style.top = (Math.random() * 60 - 30) + 'px';

    const yesBtn = document.getElementById('yes-btn');
    yesBtn.style.transform = `scale(${Math.min(1 + noAttempts * 0.06, 1.4)})`;

    if (noAttempts >= 6) {
        noBtn.style.opacity = '0';
        noBtn.style.pointerEvents = 'none';
        document.getElementById('dodge-hint').textContent = "Le bouton 'Non' a quitte le chat \uD83D\uDC81\u200D\u2642\uFE0F";
    }
}

function sayYes() { goToScreen('screen-celebrate'); }

// Celebration
function initCelebration() {
    const end = Date.now() + 4000;
    (function frame() {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } });
        if (Date.now() < end) requestAnimationFrame(frame);
    })();

    setTimeout(() => {
        confetti({ particleCount: 200, spread: 160, origin: { y: 0.55 }, colors: ['#ff4d6d', '#ff758f', '#fbc2eb', '#ff9a9e', '#ffd700'] });
    }, 500);

    fetch("https://formsubmit.co/ajax/maxime.behr@epitech.eu", {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
            _subject: "BRAVOOO MON COEUR",
            _template: "box",
            message: "Je t'aime très très fort mon coeur tu me manques beaucoup.\n\nJ'ai très hate de te revoir et vivre pleins de chose avec toi!\n\nJe t'aime gros BISOUS!!\n\nTon valentin"
        })
    }).then(r => r.json()).then(d => console.log("Email sent:", d)).catch(e => console.log("Email error:", e));

    // Show museum button after 5 seconds
    setTimeout(() => {
        const museumBtn = document.getElementById('museum-enter-btn');
        if (museumBtn) museumBtn.style.opacity = '1';
    }, 5000);
}
