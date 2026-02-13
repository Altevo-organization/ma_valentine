// Maze with keyboard arrows + touch swipe (no mouse following)
// Player = chipie.png | End = nous.jpg

const MAZE_COLS = 9, MAZE_ROWS = 9;
let mazeGrid = [];
let mazePlayer = { x: 0, y: 0 };
let mazeEnd = { x: 0, y: 0 };
let mazeCellSize = 28;

let mazeAnimating = false;
let mazeKeyRepeatInterval = null;
let mazeLastKey = null;
const MAZE_KEY_REPEAT_DELAY = 120;

// ===== Images (paths based on your project root index.html) =====
// D'après ton arbo: assets/images/lab/chipie.png et assets/images/lab/nous.jpg
const mazePlayerImg = new Image();
mazePlayerImg.src = "assets/images/lab/chipie.png";

const mazeEndImg = new Image();
mazeEndImg.src = "assets/images/lab/nous.jpg";

// (Optionnel) log si erreur de chargement
mazePlayerImg.onerror = () => console.error("Maze player image not found:", mazePlayerImg.src);
mazeEndImg.onerror = () => console.error("Maze end image not found:", mazeEndImg.src);

function initMaze() {
    const container = document.getElementById('maze-container');
    const cardWidth = container.parentElement.offsetWidth - 48;

    mazeCellSize = Math.floor(Math.min(cardWidth / MAZE_COLS, 32));

    const cw = MAZE_COLS * mazeCellSize;
    const ch = MAZE_ROWS * mazeCellSize;

    const canvas = document.getElementById('maze-canvas');
    canvas.width = cw;
    canvas.height = ch;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';

    generateMaze();
    mazePlayer = { x: 0, y: 0 };
    mazeEnd = { x: MAZE_COLS - 1, y: MAZE_ROWS - 1 };
    mazeAnimating = false;

    drawMaze();

    // Keyboard - arrow keys only with smooth repeat
    document.onkeydown = (e) => {
        const moves = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
        if (moves[e.key]) {
            e.preventDefault();
            if (mazeLastKey !== e.key) {
                // New key pressed
                clearMazeRepeat();
                mazeLastKey = e.key;
                moveMazePlayer(moves[e.key][0], moves[e.key][1]);
                mazeKeyRepeatInterval = setInterval(() => {
                    if (mazeLastKey && moves[mazeLastKey]) {
                        moveMazePlayer(moves[mazeLastKey][0], moves[mazeLastKey][1]);
                    }
                }, MAZE_KEY_REPEAT_DELAY);
            }
        }
    };

    document.onkeyup = (e) => {
        if (e.key === mazeLastKey) {
            clearMazeRepeat();
        }
    };

    // Touch/swipe
    let touchStart = null;
    canvas.ontouchstart = (e) => {
        e.preventDefault();
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    canvas.ontouchend = (e) => {
        if (!touchStart) return;
        const dx = e.changedTouches[0].clientX - touchStart.x;
        const dy = e.changedTouches[0].clientY - touchStart.y;
        if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
        if (Math.abs(dx) > Math.abs(dy)) moveMazePlayer(dx > 0 ? 1 : -1, 0);
        else moveMazePlayer(0, dy > 0 ? 1 : -1);
        touchStart = null;
    };
}

function clearMazeRepeat() {
    mazeLastKey = null;
    if (mazeKeyRepeatInterval) {
        clearInterval(mazeKeyRepeatInterval);
        mazeKeyRepeatInterval = null;
    }
}

function generateMaze() {
    mazeGrid = [];
    for (let y = 0; y < MAZE_ROWS; y++) {
        mazeGrid[y] = [];
        for (let x = 0; x < MAZE_COLS; x++) {
            mazeGrid[y][x] = { top: true, right: true, bottom: true, left: true, visited: false };
        }
    }

    const stack = [{ x: 0, y: 0 }];
    mazeGrid[0][0].visited = true;

    while (stack.length > 0) {
        const curr = stack[stack.length - 1];
        const neighbors = [];
        const dirs = [
            { dx: 0, dy: -1, wall: 'top', opposite: 'bottom' },
            { dx: 1, dy: 0, wall: 'right', opposite: 'left' },
            { dx: 0, dy: 1, wall: 'bottom', opposite: 'top' },
            { dx: -1, dy: 0, wall: 'left', opposite: 'right' }
        ];

        for (const d of dirs) {
            const nx = curr.x + d.dx, ny = curr.y + d.dy;
            if (nx >= 0 && nx < MAZE_COLS && ny >= 0 && ny < MAZE_ROWS && !mazeGrid[ny][nx].visited) {
                neighbors.push({ ...d, nx, ny });
            }
        }

        if (neighbors.length === 0) {
            stack.pop();
        } else {
            const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
            mazeGrid[curr.y][curr.x][chosen.wall] = false;
            mazeGrid[chosen.ny][chosen.nx][chosen.opposite] = false;
            mazeGrid[chosen.ny][chosen.nx].visited = true;
            stack.push({ x: chosen.nx, y: chosen.ny });
        }
    }
}

function drawMaze(playerDrawX, playerDrawY) {
    const canvas = document.getElementById('maze-canvas');
    const ctx = canvas.getContext('2d');
    const cs = mazeCellSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Walls
    ctx.strokeStyle = '#c44569';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    for (let y = 0; y < MAZE_ROWS; y++) {
        for (let x = 0; x < MAZE_COLS; x++) {
            const cell = mazeGrid[y][x];
            const px = x * cs, py = y * cs;

            if (cell.top) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + cs, py); ctx.stroke(); }
            if (cell.right) { ctx.beginPath(); ctx.moveTo(px + cs, py); ctx.lineTo(px + cs, py + cs); ctx.stroke(); }
            if (cell.bottom) { ctx.beginPath(); ctx.moveTo(px, py + cs); ctx.lineTo(px + cs, py + cs); ctx.stroke(); }
            if (cell.left) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + cs); ctx.stroke(); }
        }
    }

    const pxDraw = playerDrawX !== undefined ? playerDrawX : mazePlayer.x * cs + cs / 2;
    const pyDraw = playerDrawY !== undefined ? playerDrawY : mazePlayer.y * cs + cs / 2;

    // Size inside cell
    const size = cs - 6;

    // End image (nous.jpg) - top-left aligned inside end cell
    if (mazeEndImg.complete && mazeEndImg.naturalWidth > 0) {
        ctx.drawImage(
            mazeEndImg,
            mazeEnd.x * cs + 3,
            mazeEnd.y * cs + 3,
            size,
            size
        );
    } else {
        // fallback
        ctx.font = `${cs - 8}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💗', mazeEnd.x * cs + cs / 2, mazeEnd.y * cs + cs / 2);
    }

    // Player image (chipie.png) - centered on player position
    if (mazePlayerImg.complete && mazePlayerImg.naturalWidth > 0) {
        ctx.drawImage(
            mazePlayerImg,
            pxDraw - size / 2,
            pyDraw - size / 2,
            size,
            size
        );
    } else {
        // fallback
        ctx.font = `${cs - 8}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💞', pxDraw, pyDraw);
    }
}

function animateMazeMove(fromX, fromY, toX, toY, callback) {
    const cs = mazeCellSize;
    const startPx = fromX * cs + cs / 2;
    const startPy = fromY * cs + cs / 2;
    const endPx = toX * cs + cs / 2;
    const endPy = toY * cs + cs / 2;

    const duration = 80;
    const startTime = performance.now();

    function step(now) {
        const t = Math.min((now - startTime) / duration, 1);
        const eased = t * (2 - t); // ease-out

        const px = startPx + (endPx - startPx) * eased;
        const py = startPy + (endPy - startPy) * eased;

        drawMaze(px, py);

        if (t < 1) {
            requestAnimationFrame(step);
        } else {
            callback();
        }
    }

    requestAnimationFrame(step);
}

function moveMazePlayer(dx, dy) {
    if (mazeAnimating) return;

    const nx = mazePlayer.x + dx, ny = mazePlayer.y + dy;
    if (nx < 0 || nx >= MAZE_COLS || ny < 0 || ny >= MAZE_ROWS) return;

    const cell = mazeGrid[mazePlayer.y][mazePlayer.x];
    if (dx === 1 && cell.right) return;
    if (dx === -1 && cell.left) return;
    if (dy === 1 && cell.bottom) return;
    if (dy === -1 && cell.top) return;

    const fromX = mazePlayer.x, fromY = mazePlayer.y;
    mazeAnimating = true;

    animateMazeMove(fromX, fromY, nx, ny, () => {
        mazePlayer.x = nx;
        mazePlayer.y = ny;
        mazeAnimating = false;

        drawMaze();

        if (nx === mazeEnd.x && ny === mazeEnd.y) {
            clearMazeRepeat();
            confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
            document.onkeydown = null;
            document.onkeyup = null;
            setTimeout(() => goToScreen('screen-ttt'), 1200);
        }
    });
}
