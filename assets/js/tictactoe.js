// Tic-tac-toe - easy AI, player must win to advance
let tttBoard = [], tttGameOver = false, tttPlayerTurn = true;
const TTT_PLAYER = '\uD83D\uDC96';
const TTT_AI = '\uD83D\uDC8C';

function initTTT() {
    tttBoard = ['', '', '', '', '', '', '', '', ''];
    tttGameOver = false;
    tttPlayerTurn = true;
    document.getElementById('ttt-status').textContent = 'A toi de jouer !';
    renderTTT();
}

function renderTTT() {
    document.getElementById('ttt-grid').innerHTML = tttBoard.map((cell, i) =>
        `<div class="ttt-cell ${cell ? 'taken' : ''}" onclick="tttPlay(${i})">${cell}</div>`
    ).join('');
}

// Check win on a given board
function checkTTTWinBoard(symbol, board) {
    const lines = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    for (const line of lines) {
        if (line.every(i => board[i] === symbol)) return line;
    }
    return null;
}

function checkTTTWin(symbol) {
    return checkTTTWinBoard(symbol, tttBoard);
}

function highlightTTTWin(line) {
    const cells = document.querySelectorAll('.ttt-cell');
    line.forEach(i => cells[i].classList.add('win-cell'));
}

// Easy AI: mostly random, occasionally blocks
function tttAIMove() {
    const empty = [];
    for (let i = 0; i < 9; i++) {
        if (tttBoard[i] === '') empty.push(i);
    }
    if (empty.length === 0) return;

    // 30% chance to try to block player's winning move
    if (Math.random() < 0.3) {
        for (const i of empty) {
            tttBoard[i] = TTT_PLAYER;
            if (checkTTTWinBoard(TTT_PLAYER, tttBoard)) {
                tttBoard[i] = TTT_AI;
                return;
            }
            tttBoard[i] = '';
        }
    }

    // Otherwise play random
    const move = empty[Math.floor(Math.random() * empty.length)];
    tttBoard[move] = TTT_AI;
}

function tttPlay(index) {
    if (tttBoard[index] || tttGameOver || !tttPlayerTurn) return;
    tttBoard[index] = TTT_PLAYER;
    tttPlayerTurn = false;
    renderTTT();

    const playerWin = checkTTTWin(TTT_PLAYER);
    if (playerWin) {
        tttGameOver = true;
        highlightTTTWin(playerWin);
        document.getElementById('ttt-status').textContent = "Bravo, tu as gagne ! \uD83D\uDC96";
        confetti({ particleCount: 80, spread: 100, origin: { y: 0.6 } });
        setTimeout(() => goToScreen('screen-question'), 2000);
        return;
    }

    if (tttBoard.every(c => c)) {
        tttGameOver = true;
        document.getElementById('ttt-status').textContent = "Egalite ! Encore un essai 😏";
        setTimeout(() => initTTT(), 2000);
        return;
    }

    // AI plays
    setTimeout(() => {
        tttAIMove();
        renderTTT();

        const aiWin = checkTTTWin(TTT_AI);
        if (aiWin) {
            tttGameOver = true;
            highlightTTTWin(aiWin);
            document.getElementById('ttt-status').textContent = "Perdu ! On recommence \uD83D\uDE0F";
            setTimeout(() => initTTT(), 2500);
            return;
        }

        if (tttBoard.every(c => c)) {
            tttGameOver = true;
            document.getElementById('ttt-status').textContent = "Egalite ! Encore un essai 😏";
            setTimeout(() => initTTT(), 2000);
            return;
        }

        tttPlayerTurn = true;
        document.getElementById('ttt-status').textContent = "A toi ! \uD83D\uDC96";
    }, 600);
}
