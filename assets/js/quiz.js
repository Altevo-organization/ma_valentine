// ===== QUIZ GAME =====

const quizData = [
    {
        question: "Quelle est ma qualite principale ?",
        options: [
            "Ma beauté fatale",
            "Mon humeur a tout épreuve",
            "Mon physique de mannequin",
            "mon talent pour le choux-fleur"
        ],
        correctIndex: 3
    },
    {
        question: "A quelle point je tiens a toi ?",
        options: [
            "M'en fou complet",
            "Mouais",
            "Quand elle ronfle pas ca va",
            "ENORMEMENT"
        ],
        correctIndex: 2
    },
    {
        question: "Qu'est ce que je préfère chez toi ?",
        options: [
            "tes fesses, ton fiak",
            "ton énorme cavu",
            "ce boule qui chamboule",
            "ta personnalité et tout ce qui fait toi"
        ],
        correctIndex: 3
    }
];

let currentQuiz = 0;

// ===== INIT =====
function initQuiz() {
    currentQuiz = 0;
    showQuizQuestion();
}

// ===== SHOW QUESTION =====
function showQuizQuestion() {
    const q = quizData[currentQuiz];

    // Progress dots
    document.getElementById('quiz-progress').innerHTML =
        quizData.map((_, i) =>
            `<div class="quiz-dot ${i < currentQuiz ? 'done' : ''}"></div>`
        ).join('');

    document.getElementById('quiz-question').textContent = q.question;

    document.getElementById('quiz-feedback').classList.remove('show');

    document.getElementById('quiz-options').innerHTML =
        q.options.map((opt, i) =>
            `<div class="quiz-option" onclick="selectQuizOption(this, ${i})">${opt}</div>`
        ).join('');
}

// ===== SELECT OPTION =====
function selectQuizOption(el, selectedIndex) {
    const correctIndex = quizData[currentQuiz].correctIndex;
    const options = document.querySelectorAll('.quiz-option');

    // Disable clicks
    options.forEach(o => o.style.pointerEvents = 'none');

    const feedbackElement = document.getElementById('quiz-feedback');

    if (selectedIndex === correctIndex) {
        el.classList.add('correct');

        const feedbacks = [
            "Evidemment ! Bonne reponse ! 🎉",
            "Parfait ! Tu me connais trop bien ! 😍",
            "100% correct ! 💫",
            "Bravo ! T'es trop forte ! 🏆"
        ];

        feedbackElement.textContent =
            feedbacks[Math.floor(Math.random() * feedbacks.length)];

    } else {
        el.classList.add('wrong');

        // Highlight correct answer
        options[correctIndex].classList.add('correct');

        feedbackElement.textContent = "Mmmm… pas tout à fait 😏";
    }

    feedbackElement.classList.add('show');

    // Mark progress dot
    const dots = document.querySelectorAll('.quiz-dot');
    if (dots[currentQuiz]) {
        dots[currentQuiz].classList.add('done');
    }

    // Next question
    setTimeout(() => {
        currentQuiz++;
        if (currentQuiz < quizData.length) {
            showQuizQuestion();
        } else {
            goToScreen('screen-catch'); // garde ton système existant
        }
    }, 1600);
}
