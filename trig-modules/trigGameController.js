/**
 * TrigGameController - Main game orchestrator managing game flow and user interactions
 */
class TrigGameController {
    constructor() {
        this.state = new GameState();
        this.ui = new TrigUI();
        this.timer = new Timer(this.ui.elements.timer);
        this.questionGen = new TrigQuestionGenerator();
        this.confetti = new Confetti('confetti-canvas');
        this.answerChecker = new AnswerChecker();

        this.setupEventListeners();
        this.initialize();
    }

    initialize() {
        this.ui.renderLevelGrid(CONFIG.LEVEL_GROUPS, (level) => this.startGame(level));
        this.ui.setSuccessScreenCallbacks(
            () => this.replayCurrentLevel(),
            () => this.quitGame()
        );
        this.ui.showScreen('settings');
    }

    setupEventListeners() {
        // Button listeners
        this.ui.elements.quitBtn.addEventListener('click', () => this.quitGame());
        this.ui.elements.playAgainBtn.addEventListener('click', () => this.quitGame());

        // Keyboard listeners
        document.addEventListener('keydown', (e) => this.handleKeypress(e));
    }

    handleKeypress(e) {
        // Only handle keypresses during game
        if (this.ui.elements.gameScreen.classList.contains('hidden')) {
            return;
        }

        // Escape key to quit
        if (e.key === 'Escape') {
            this.quitGame();
            return;
        }

        // Enter key to submit answer
        if (e.key === 'Enter' && !this.state.isAnswering) {
            e.preventDefault();
            this.checkAnswer();
        }
    }

    startGame(level) {
        this.state.setLevel(level);
        this.ui.showScreen('game');
        this.ui.updateStreak(0);
        this.ui.hideTimerPausedMessage();
        this.timer.start();
        this.generateQuestion();
    }

    generateQuestion() {
        this.ui.clearFeedback();
        this.state.setAnswering(false);

        try {
            const question = this.questionGen.generate(this.state.currentLevel);

            if (question.error) {
                console.error('Question generation failed');
                this.ui.showFeedback(false, 'Error generating question');
                setTimeout(() => this.generateQuestion(), 1000);
                return;
            }

            this.state.setQuestion(question);

            this.ui.displayQuestion(
                question,
                this.state.currentLevel.type
            );

        } catch (error) {
            console.error('Error in generateQuestion:', error, error.stack);
            this.ui.showFeedback(false, 'Error generating question');
            setTimeout(() => this.generateQuestion(), 1000);
        }
    }

    checkAnswer() {
        if (this.state.isAnswering) return;

        const userAnswer = this.ui.getUserAnswer();
        if (!userAnswer || userAnswer.trim() === '') {
            this.ui.showFeedback(false, 'Please enter an answer');
            return;
        }

        this.state.setAnswering(true);
        this.ui.disableInput();

        const isCorrect = this.answerChecker.checkAnswer(
            userAnswer,
            this.state.currentAnswer,
            this.state.currentQuestion.type
        );

        if (isCorrect) {
            this.handleCorrectAnswer();
        } else {
            this.handleIncorrectAnswer();
        }
    }

    handleCorrectAnswer() {
        const newStreak = this.state.incrementStreak();
        this.ui.updateStreak(newStreak);

        this.ui.highlightInput(true);

        const feedback = CONFIG.POSITIVE_FEEDBACK[
            Math.floor(Math.random() * CONFIG.POSITIVE_FEEDBACK.length)
        ];
        this.ui.showFeedback(true, feedback);

        this.confetti.trigger(CONFIG.CONFETTI.CORRECT);

        if (this.state.isComplete()) {
            setTimeout(() => this.showSuccess(), CONFIG.FEEDBACK_DELAY_CORRECT);
        } else {
            setTimeout(() => this.generateQuestion(), CONFIG.FEEDBACK_DELAY_CORRECT);
        }
    }

    handleIncorrectAnswer() {
        const incorrectCount = this.state.incrementIncorrectCount();

        if (this.state.isSecondIncorrectAttempt()) {
            // Second incorrect attempt - show answer and reset timer
            this.state.resetStreak();
            this.ui.updateStreak(0);

            this.ui.highlightInput(false);

            // Show correct answer
            this.ui.showFeedback(false, null, this.state.currentAnswer);

            // Reset and pause timer
            this.timer.reset();
            this.timer.pause();
            this.ui.showTimerPausedMessage();

            // Clear the answer input
            this.ui.clearInput();

            // Setup keystroke listener for advancing
            const moveToNextQuestion = (e) => {
                // Filter for valid keys (not meta/modifier keys)
                if (e.key.length === 1 || e.key === 'Enter' ||
                    e.key === 'Backspace' || e.key === 'Delete') {

                    // Remove listener immediately (one-time use)
                    document.removeEventListener('keydown', moveToNextQuestion);

                    // Execute transition sequence
                    this.ui.hideTimerPausedMessage();
                    this.state.setAnswering(false);
                    this.timer.start();  // Restart timer from 0:00
                    this.generateQuestion();
                }
            };

            // Attach listener to document (global)
            document.addEventListener('keydown', moveToNextQuestion);
        } else {
            // First incorrect attempt - show hint and let user try again
            this.ui.highlightInput(false);
            this.ui.showFeedback(false, 'Not quite right, try again!');

            // Don't reset timer, just re-enable input
            setTimeout(() => {
                this.ui.clearFeedback();
                this.state.setAnswering(false);
                this.ui.enableInput();
            }, CONFIG.FEEDBACK_DELAY_INCORRECT);
        }
    }

    showSuccess() {
        this.timer.stop();
        const time = this.timer.getSeconds();
        const previousBest = StorageManager.getBestTime(this.state.currentLevel.key);
        const isNewBest = !previousBest || time < previousBest;

        if (isNewBest) {
            StorageManager.saveBestTime(this.state.currentLevel.key, time);
            this.confetti.trigger(CONFIG.CONFETTI.SUCCESS);
        }

        const rating = StorageManager.getRating(time);

        this.ui.showSuccess(
            this.state.currentLevel.name,
            time,
            rating,
            isNewBest,
            previousBest
        );
    }

    replayCurrentLevel() {
        if (this.state.currentLevel) {
            this.startGame(this.state.currentLevel);
        } else {
            this.quitGame();
        }
    }

    quitGame() {
        this.timer.stop();
        this.state.reset();
        this.ui.hideTimerPausedMessage();
        this.initialize();
    }
}
