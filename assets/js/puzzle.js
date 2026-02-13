// ===== Puzzle game - spell "PAUPAU ET MAXOU" (hard mode) =====

const PUZZLE_WORD = "PAUPAU ET MAXOU";

// Structure = slots (lettres) + espaces fixes
const PUZZLE_STRUCTURE = PUZZLE_WORD.split(''); // inclut l'espace

// Lettres à placer (sans les espaces)
const PUZZLE_TARGET_LETTERS = PUZZLE_STRUCTURE.filter(c => c !== ' ');

// Lettres pièges (tu peux en ajouter/enlever)
const PUZZLE_DECOYS = [
  'E','T','A','U','P','M','O','X', // doublons trompeurs
  'R','S','L','N','I','C','D'
];

let puzzleAnswer = [];
let puzzleLettersState = [];

function initPuzzle() {
  puzzleAnswer = [];

  // On prépare la banque de lettres cliquables = bonnes lettres + pièges
  const bank = [...PUZZLE_TARGET_LETTERS, ...PUZZLE_DECOYS];

  // On crée l’état
  puzzleLettersState = bank.map((letter, i) => ({
    letter,
    id: i,      // id unique (important car il y a des doublons)
    used: false
  }));

  // Shuffle
  puzzleLettersState.sort(() => Math.random() - 0.5);

  const hint = document.getElementById('puzzle-hint');
  hint.textContent = "Indice : non je déconne)";
  hint.style.color = '#999';
  hint.style.fontWeight = '';
  hint.style.fontSize = '13px';

  renderPuzzle();
}

function renderPuzzle() {
  // Slots
  let slotHTML = '';
  PUZZLE_STRUCTURE.forEach((char, i) => {
    if (char === ' ') {
      slotHTML += '<div class="puzzle-slot space"></div>';
    } else {
      const filled = puzzleAnswer[i] || '';
      slotHTML += `<div class="puzzle-slot ${filled ? 'filled' : ''}" onclick="removePuzzleLetter(${i})">${filled}</div>`;
    }
  });

  document.getElementById('puzzle-slots').innerHTML = slotHTML;

  // Lettres (toutes cliquables, y compris doublons)
  document.getElementById('puzzle-letters').innerHTML = puzzleLettersState.map(l =>
    `<div class="puzzle-letter ${l.used ? 'used' : ''}" onclick="pickPuzzleLetter(${l.id})">${l.letter}</div>`
  ).join('');
}

function pickPuzzleLetter(letterId) {
  const obj = puzzleLettersState.find(l => l.id === letterId);
  if (!obj || obj.used) return;

  // Trouve le premier slot vide (non espace)
  for (let i = 0; i < PUZZLE_STRUCTURE.length; i++) {
    if (PUZZLE_STRUCTURE[i] === ' ') {
      puzzleAnswer[i] = ' ';
      continue;
    }
    if (!puzzleAnswer[i]) {
      puzzleAnswer[i] = obj.letter;
      obj.used = true;
      break;
    }
  }

  renderPuzzle();
}

function removePuzzleLetter(slotIndex) {
  if (PUZZLE_STRUCTURE[slotIndex] === ' ') return;

  const removed = puzzleAnswer[slotIndex];
  if (!removed) return;

  puzzleAnswer[slotIndex] = '';

  // IMPORTANT: comme il y a des doublons, on libère la PREMIERE lettre "used" qui correspond
  const obj = puzzleLettersState.find(l => l.letter === removed && l.used);
  if (obj) obj.used = false;

  renderPuzzle();
}

function resetPuzzle() {
  initPuzzle();
}

function validatePuzzle() {
  // Recompose la phrase actuelle
  const current = PUZZLE_STRUCTURE.map((c, i) => (c === ' ') ? ' ' : (puzzleAnswer[i] || '')).join('');

  const h = document.getElementById('puzzle-hint');

  if (current === PUZZLE_WORD) {
    h.textContent = "OUI !! PAUPAU ET MAXOU 💖💖💖";
    h.style.color = '#ff4d6d';
    h.style.fontWeight = '600';
    h.style.fontSize = '16px';
    confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
    setTimeout(() => goToScreen('screen-maze'), 1600);
  } else {
    h.textContent = "Pas encore… cherche bien 😈";
    h.style.color = '#ff6b6b';
    h.style.fontWeight = '500';
    h.style.fontSize = '14px';
    setTimeout(() => initPuzzle(), 1500);
  }
}
