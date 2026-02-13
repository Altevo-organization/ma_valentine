// Navigation between screens
function goToScreen(id) {
    // Cleanup maze when leaving
    if (typeof clearMazeRepeat === 'function') clearMazeRepeat();
    document.onkeydown = null;
    document.onkeyup = null;

    // Cleanup museum when leaving it
    if (typeof museumActive !== 'undefined' && museumActive && id !== 'screen-museum') {
        disposeMuseum();
    }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    setTimeout(() => {
        document.getElementById(id).classList.add('active');
        const inits = {
            'screen-quiz': initQuiz,
            'screen-catch': initCatchGame,
            'screen-memory': initMemory,
            'screen-wheel': initWheel,
            'screen-puzzle': initPuzzle,
            'screen-maze': initMaze,
            'screen-ttt': initTTT,
            'screen-question': initQuestion,
            'screen-celebrate': initCelebration,
            'screen-museum': initMuseum
        };
        if (inits[id]) inits[id]();
    }, 300);
}
