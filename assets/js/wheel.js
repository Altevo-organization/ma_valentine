// ===== Wheel of fortune =====

const wheelItems = [
    "Un gros calin 🌟",
    "Un resto a deux 🤗",
    "Papouille illimité sans raler 😘",
    "Une journée shopping 🤪",
    "Un rdv chez le coiffeur 💎",
    "Un GROS BISOUS 💕",
    "Un long massage 💆",
    "Un jouet pour chipie 👑"
];

const wheelColors = ['#ff4d6d', '#ff758f', '#fbc2eb', '#a18cd1', '#ff9a9e', '#ffd700', '#ff6b81', '#c471ed'];

let wheelAngle = 0;
let wheelSpinning = false;
let wheelSpinCount = 0;

const WHEEL_SPINS_NEEDED = 3;

function initWheel() {
    wheelSpinCount = 0;
    wheelSpinning = false;
    wheelAngle = 0;

    document.getElementById('wheel-result').classList.remove('show');
    document.getElementById('wheel-spins').textContent = `Tourne ${WHEEL_SPINS_NEEDED} fois pour continuer !`;
    document.getElementById('wheel-spin-btn').style.display = '';

    drawWheel(0);
}

function drawWheel(rotationRad) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const r = W / 2 - 4;

    const sliceAngle = (2 * Math.PI) / wheelItems.length;

    ctx.clearRect(0, 0, W, H);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotationRad);

    wheelItems.forEach((item, i) => {
        const start = i * sliceAngle;
        const end = start + sliceAngle;

        // slice
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, start, end);
        ctx.closePath();

        ctx.fillStyle = wheelColors[i % wheelColors.length];
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // text
        ctx.save();
        ctx.rotate(start + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Poppins, sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 3;

        const text = item.length > 18 ? item.substring(0, 16) + '...' : item;
        ctx.fillText(text, r - 12, 4);

        ctx.restore();
    });

    ctx.restore();
}

function spinWheel() {
    if (wheelSpinning) return;

    wheelSpinning = true;
    document.getElementById('wheel-result').classList.remove('show');

    const spinAmount = Math.random() * 360 + 720 + (Math.random() * 360); // deg
    const targetAngle = wheelAngle + spinAmount;
    const startAngle = wheelAngle;

    const startTime = Date.now();
    const spinDuration = 3000 + Math.random() * 1000;

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);

        // ease out
        const eased = 1 - Math.pow(1 - progress, 3);

        const currentAngle = startAngle + (targetAngle - startAngle) * eased;
        drawWheel((currentAngle * Math.PI) / 180);

        if (progress < 1) {
            requestAnimationFrame(animate);
            return;
        }

        // FIN
        wheelAngle = targetAngle % 360;
        wheelSpinning = false;
        wheelSpinCount++;

        // ===== CORRECT INDEX CALC (matches what you see) =====
        const sliceRad = (2 * Math.PI) / wheelItems.length;
        const rotRad = (wheelAngle % 360) * Math.PI / 180;

        // Pointeur en haut (12h)
        const pointerRad = -Math.PI / 2;

        // angle sous le pointeur en retirant la rotation
        let a = pointerRad - rotRad;

        // normalize 0..2PI
        a = (a % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

        const idx = Math.floor(a / sliceRad) % wheelItems.length;
        // ================================================

        const resultEl = document.getElementById('wheel-result');
        resultEl.textContent = wheelItems[idx];
        resultEl.classList.add('show');

        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });

        document.getElementById('wheel-spins').textContent =
            wheelSpinCount >= WHEEL_SPINS_NEEDED
                ? "C'est parti pour la suite !"
                : `Encore ${WHEEL_SPINS_NEEDED - wheelSpinCount} tour(s) !`;

        if (wheelSpinCount >= WHEEL_SPINS_NEEDED) {
            document.getElementById('wheel-spin-btn').style.display = 'none';
            setTimeout(() => goToScreen('screen-puzzle'), 1800);
        }
    }

    requestAnimationFrame(animate);
}
