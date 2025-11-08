/**
 * GameState - Manages game state including level, questions, streaks, and incorrect attempts
 */
class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.currentLevel = null;
        this.currentQuestion = null;
        this.currentAnswer = null;
        this.correctStreak = 0;
        this.totalQuestions = 0;
        this.isAnswering = false;
        this.incorrectCount = 0;  // Track attempts for current question
    }

    setLevel(level) {
        this.reset();
        this.currentLevel = level;
    }

    setQuestion(question) {
        this.currentQuestion = question;
        this.currentAnswer = question.answer;
        this.incorrectCount = 0;  // Reset incorrect count for new question
    }

    incrementStreak() {
        this.correctStreak++;
        this.totalQuestions++;
        return this.correctStreak;
    }

    resetStreak() {
        this.correctStreak = 0;
    }

    incrementIncorrectCount() {
        this.incorrectCount++;
        return this.incorrectCount;
    }

    resetIncorrectCount() {
        this.incorrectCount = 0;
    }

    isSecondIncorrectAttempt() {
        return this.incorrectCount >= 2;
    }

    isComplete() {
        return this.correctStreak >= CONFIG.REQUIRED_STREAK;
    }

    setAnswering(value) {
        this.isAnswering = value;
    }
}
