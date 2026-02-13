// ===== Memory card game (PHOTOS) =====

// Mets ici tes chemins EXACTS (respecte .JPG/.PNG)
const memoryImages = [
  'assets/images/memory/memory1.JPG',
  'assets/images/memory/memory2.JPG',
  'assets/images/memory/memory3.PNG',
  'assets/images/memory/memory4.JPG',
  'assets/images/memory/memory5.JPG',
  'assets/images/memory/memory6.JPG',
];

let memoryCards = [], memoryFlipped = [], memoryMatched = 0, memoryMoves = 0, memoryLocked = false;

function initMemory() {
  memoryMatched = 0;
  memoryMoves = 0;
  memoryFlipped = [];
  memoryLocked = false;
  document.getElementById('memory-moves').textContent = 'Coups : 0';

  // Ici on prend les 6 images (tu peux random si tu veux)
  const chosen = memoryImages.slice(0, 6);

  // Duplique pour faire des paires, puis mélange
  memoryCards = [...chosen, ...chosen].sort(() => Math.random() - 0.5);

  const grid = document.getElementById('memory-grid');
  grid.style.gridTemplateColumns = 'repeat(4, 1fr)';

  grid.innerHTML = memoryCards.map((src, i) => `
  <div class="memory-card" onclick="flipMemory(${i})" data-index="${i}">
    <div class="memory-inner">
      <div class="memory-front">?</div>
      <div class="memory-back">
        <img src="${src}" alt="memory ${i}" draggable="false">
      </div>
    </div>
  </div>
`).join('');

}

function flipMemory(index) {
  if (memoryLocked) return;

  const cards = document.querySelectorAll('.memory-card');
  const card = cards[index];
  if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

  card.classList.add('flipped');
  memoryFlipped.push(index);

  if (memoryFlipped.length === 2) {
    memoryMoves++;
    document.getElementById('memory-moves').textContent = `Coups : ${memoryMoves}`;
    memoryLocked = true;

    const [a, b] = memoryFlipped;

    // Comparaison = même chemin image => paire
    if (memoryCards[a] === memoryCards[b]) {
      cards[a].classList.add('matched');
      cards[b].classList.add('matched');
      memoryMatched += 2;
      memoryFlipped = [];
      memoryLocked = false;

      if (memoryMatched === memoryCards.length) {
        setTimeout(() => goToScreen('screen-wheel'), 1000);
      }
    } else {
      setTimeout(() => {
        cards[a].classList.remove('flipped');
        cards[b].classList.remove('flipped');
        memoryFlipped = [];
        memoryLocked = false;
      }, 800);
    }
  }
}
