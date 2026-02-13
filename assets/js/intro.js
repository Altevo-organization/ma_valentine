// Typewriter intro animation
const introMessage = "Paupau... j'ai quelque chose de tres important a te demander";
let introIndex = 0;
const introText = document.getElementById('intro-text');

function typeWriter() {
    if (introIndex < introMessage.length) {
        introText.textContent += introMessage.charAt(introIndex);
        introIndex++;
        setTimeout(typeWriter, 55);
    } else {
        setTimeout(() => document.getElementById('intro-sub').style.opacity = '1', 400);
        setTimeout(() => document.getElementById('intro-btn').style.opacity = '1', 900);
        setTimeout(() => document.getElementById('intro-hint').style.opacity = '1', 1300);
    }
}
setTimeout(typeWriter, 800);
