/**
 * TrigUI - Handles all UI rendering, MathQuill initialization, and user feedback display
 */
class TrigUI {
    constructor() {
        this.elements = {
            settingsScreen: document.getElementById('settings-screen'),
            gameScreen: document.getElementById('game-screen'),
            successScreen: document.getElementById('success-screen'),
            levelSelection: document.getElementById('level-selection-container'),
            streakCounter: document.getElementById('streak-counter'),
            timer: document.getElementById('timer'),
            diagramContainer: document.getElementById('diagram-container'),
            diagramCanvas: document.getElementById('quadrant-diagram'),
            questionText: document.getElementById('question-text'),
            inputContainer: document.getElementById('input-container'),
            mathquillInput: document.getElementById('mathquill-input'),
            feedbackMessage: document.getElementById('feedback-message'),
            timerPausedMessage: document.getElementById('timer-paused-message'),
            quitBtn: document.getElementById('quit-btn'),
            replayLevelBtn: document.getElementById('replay-level-btn'),
            playAgainBtn: document.getElementById('play-again-btn'),
            completedLevel: document.getElementById('completed-level'),
            finalTime: document.getElementById('final-time'),
            finalRating: document.getElementById('final-rating'),
            bestTimeMessage: document.getElementById('best-time-message'),
            ratingExplanation: document.getElementById('rating-explanation'),
        };

        this.diagramRenderer = new QuadrantDiagramRenderer(this.elements.diagramCanvas);
        this.mathField = null;
        this.onReplayLevel = null;
        this.onBackToLevels = null;
        this.setupSuccessScreenButtons();
    }

    showScreen(screenName) {
        ['settings', 'game', 'success'].forEach(s => {
            this.elements[`${s}Screen`].classList.toggle('hidden', s !== screenName);
        });
    }

    renderLevelGrid(levelGroups, onSelect) {
        this.elements.levelSelection.innerHTML = '';

        for (const groupName in levelGroups) {
            const title = this.createEl('h2', {
                className: 'level-section-title',
                textContent: groupName
            });

            const grid = this.createEl('div', { className: 'level-grid' });

            levelGroups[groupName].forEach(level => {
                const bestTime = StorageManager.getBestTime(level.key);
                const rating = bestTime ? StorageManager.getRating(bestTime) : null;
                const ratingClass = rating ? `rating-${rating.key}` : 'rating-none';

                const btn = this.createEl('div', {
                    className: `level-btn ${ratingClass}`
                });
                btn.dataset.levelKey = level.key;

                const levelTitle = this.createEl('div', {
                    className: 'level-title',
                    innerHTML: level.name
                });

                const bestTimeText = this.createEl('div', {
                    className: 'best-time',
                    textContent: bestTime
                        ? `Best: ${new Timer().formatTime(bestTime)}`
                        : 'No time set'
                });

                btn.append(levelTitle, bestTimeText);
                btn.addEventListener('click', () => {
                    const selectedLevel = Object.values(levelGroups)
                        .flat()
                        .find(l => l.key === btn.dataset.levelKey);
                    onSelect(selectedLevel);
                });

                grid.append(btn);
            });

            this.elements.levelSelection.append(title, grid);
        }
    }

    displayQuestion(question, levelType) {
        this.elements.questionText.innerHTML = '';

        // Show/hide diagram based on question type
        if ((levelType === 'quadrant' || levelType === 'equivalent' || levelType === 'reference_angles' || levelType === 'reference_angles_rad') && question.angleDeg) {
            this.elements.diagramContainer.classList.remove('hidden');
            // Use reference angle diagram for reference_angles and reference_angles_rad, regular diagram for others
            if (levelType === 'reference_angles' || levelType === 'reference_angles_rad') {
                this.diagramRenderer.drawReferenceAngleDiagram(question.angleDeg);
            } else {
                this.diagramRenderer.draw(question.angleDeg, question.quadrant);
            }
        } else {
            this.elements.diagramContainer.classList.add('hidden');
        }

        // Adjust input width based on question type
        this.adjustInputWidth(question.type);

        // Handle multi-line format (for reference angles with newlines)
        if (question.format.includes('\n')) {
            // Split by double newlines to create paragraph breaks
            const paragraphs = question.format.split('\n\n').filter(p => p.trim());

            // Create container to allow vertical stacking
            const multilineContainer = document.createElement('div');
            multilineContainer.style.display = 'flex';
            multilineContainer.style.flexDirection = 'column';
            multilineContainer.style.alignItems = 'flex-start';
            multilineContainer.style.gap = '1rem';
            multilineContainer.style.marginLeft = '2rem';

            paragraphs.forEach((paragraph) => {
                // Create a div for each paragraph
                const paraDiv = document.createElement('div');

                const parts = paragraph.split('\\_\\_\\_');

                if (parts.length === 2) {
                    // Paragraph with input blank
                    const firstPart = document.createElement('span');
                    this.renderMath(parts[0], firstPart);

                    const inputWrapper = document.createElement('span');
                    inputWrapper.style.marginLeft = '0.5rem';
                    inputWrapper.style.marginRight = '0.5rem';
                    inputWrapper.appendChild(this.elements.mathquillInput);

                    const secondPart = document.createElement('span');
                    this.renderMath(parts[1], secondPart);

                    paraDiv.appendChild(firstPart);
                    paraDiv.appendChild(inputWrapper);
                    paraDiv.appendChild(secondPart);
                } else {
                    // Regular paragraph without input
                    const paraPart = document.createElement('span');
                    this.renderMath(paragraph, paraPart);
                    paraDiv.appendChild(paraPart);
                }

                multilineContainer.appendChild(paraDiv);
            });

            this.elements.questionText.appendChild(multilineContainer);
        } else {
            // Single-line format (original behavior)
            const parts = question.format.split('\\_\\_\\_');

            if (parts.length === 2) {
                // Create first part using MathQuill rendering
                const firstPart = document.createElement('span');
                this.renderMath(parts[0], firstPart);

                // Create input container
                const inputWrapper = document.createElement('span');
                inputWrapper.appendChild(this.elements.mathquillInput);

                // Create second part using MathQuill rendering
                const secondPart = document.createElement('span');
                this.renderMath(parts[1], secondPart);

                // Append all parts to question text
                this.elements.questionText.appendChild(firstPart);
                this.elements.questionText.appendChild(inputWrapper);
                this.elements.questionText.appendChild(secondPart);
            } else {
                // Fallback for questions without blanks
                this.renderMath(question.format, this.elements.questionText);
            }
        }

        // Initialize MathQuill input
        this.initializeMathQuill();

        // Enable input for new question
        this.enableInput();
    }

    renderMath(latex, container) {
        // Clear container first
        container.innerHTML = '';

        // Check if MathQuill is loaded
        if (typeof MathQuill === 'undefined') {
            console.error('MathQuill not loaded');
            container.textContent = latex;
            return;
        }

        // Initialize MathQuill for rendering (read-only mode)
        const MQ = MathQuill.getInterface(2);
        const mathField = MQ.StaticMath(container);
        mathField.latex(latex);
    }

    initializeMathQuill() {
        // Clear previous MathQuill instance
        if (this.mathField) {
            this.mathField.revert();
        }

        // Initialize new MathQuill instance
        const MQ = MathQuill.getInterface(2);
        this.mathField = MQ.MathField(this.elements.mathquillInput, {
            spaceBehavesLikeTab: true,
            leftRightIntoCmdGoes: 'up',
            restrictMismatchedBrackets: true,
            sumStartsWithNEquals: true,
            supSubsRequireOperand: true,
            charsThatBreakOutOfSupSub: '+-=<>',
            autoSubscriptNumerals: true,
            autoCommands: 'pi theta alpha beta gamma delta epsilon zeta eta mu nu xi rho sigma tau phi chi psi omega sqrt sum prod int frac',
            autoOperatorNames: 'sin cos tan cot sec csc sinh cosh tanh coth sech csch arcsin arccos arctan arccot arcsec arccsc',
        });

        // Reset input styling
        this.elements.mathquillInput.classList.remove('correct', 'incorrect');

        // Focus the input
        this.mathField.focus();
    }

    addAutoParentheses(latex) {
        const trigFunctions = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc'];

        let result = latex;

        for (const func of trigFunctions) {
            // Match patterns like \sin30, \cos60, -\tan45, etc.
            const pattern = new RegExp(`(\\\\${func})([0-9]+(?:\\.[0-9]+)?|\\\\pi|\\\\frac\\{[^}]+\\}\\{[^}]+\\})(?!\\()`, 'g');
            result = result.replace(pattern, `$1\\left($2\\right)`);

            // Also handle cases without backslash
            const simplePattern = new RegExp(`(${func})([0-9]+(?:\\.[0-9]+)?|pi|frac\\{[^}]+\\}\\{[^}]+\\})(?!\\()`, 'g');
            result = result.replace(simplePattern, `$1($2)`);
        }

        return result;
    }

    adjustInputWidth(questionType) {
        const inputElement = this.elements.mathquillInput;

        if (questionType === 'equivalent') {
            // Make wider for equivalent expressions
            inputElement.style.minWidth = '200px';
            inputElement.style.width = '200px';
        } else {
            // Default width for other question types
            inputElement.style.minWidth = '120px';
            inputElement.style.width = '120px';
        }
    }

    getUserAnswer() {
        if (!this.mathField) return '';
        const rawLatex = this.mathField.latex().trim();
        return this.addAutoParentheses(rawLatex);
    }

    clearInput() {
        if (this.mathField) {
            this.mathField.latex('');
            this.mathField.focus();
        }
        this.elements.mathquillInput.classList.remove('correct', 'incorrect');
    }

    highlightInput(isCorrect) {
        this.elements.mathquillInput.classList.remove('correct', 'incorrect');
        this.elements.mathquillInput.classList.add(isCorrect ? 'correct' : 'incorrect');
    }

    disableInput() {
        if (this.mathField) {
            this.mathField.config({ disabled: true });
        }
    }

    enableInput() {
        if (this.mathField) {
            this.mathField.config({ disabled: false });
        }
    }

    updateStreak(streak) {
        this.elements.streakCounter.textContent = streak;

        // Add animation for streak milestones
        if (streak > 0 && streak % 5 === 0) {
            this.elements.streakCounter.parentElement.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                this.elements.streakCounter.parentElement.style.animation = '';
            }, 500);
        }
    }

    showFeedback(isCorrect, message, correctAnswer = null) {
        this.elements.feedbackMessage.innerHTML = '';
        this.elements.feedbackMessage.className = `feedback ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`;

        // Handle correct answer display (second incorrect attempt)
        if (correctAnswer) {
            const answerLine = document.createElement('div');

            // Text label
            const textPart = document.createElement('span');
            textPart.className = 'font-semibold';
            textPart.textContent = '';
            answerLine.appendChild(textPart);

            // Container for LaTeX
            const answerSpan = document.createElement('span');
            answerSpan.className = 'inline-block';
            answerLine.appendChild(answerSpan);

            this.elements.feedbackMessage.appendChild(answerLine);

            // Render LaTeX using MathQuill
            this.renderMath(correctAnswer, answerSpan);
        } else if (message) {
            // For correct or first incorrect feedback (simple text)
            this.elements.feedbackMessage.textContent = message;
        }
    }

    clearFeedback() {
        this.elements.feedbackMessage.innerHTML = '';
        this.elements.feedbackMessage.className = 'feedback';
    }

    showTimerPausedMessage() {
        if (this.elements.timerPausedMessage) {
            this.elements.timerPausedMessage.classList.remove('hidden');
        }
    }

    hideTimerPausedMessage() {
        if (this.elements.timerPausedMessage) {
            this.elements.timerPausedMessage.classList.add('hidden');
        }
    }

    setSuccessScreenCallbacks(onReplayLevel, onBackToLevels) {
        this.onReplayLevel = onReplayLevel;
        this.onBackToLevels = onBackToLevels;
    }

    setupSuccessScreenButtons() {
        // Replay Level button click handler
        if (this.elements.replayLevelBtn) {
            this.elements.replayLevelBtn.addEventListener('click', () => {
                if (this.onReplayLevel) {
                    this.onReplayLevel();
                }
            });
        }

        // Back to Levels button click handler
        if (this.elements.playAgainBtn) {
            this.elements.playAgainBtn.addEventListener('click', () => {
                if (this.onBackToLevels) {
                    this.onBackToLevels();
                }
            });
        }

        // Keyboard shortcuts for success screen
        this.handleSuccessScreenKey = (e) => {
            // Only handle keys if success screen is visible
            if (this.elements.successScreen.classList.contains('hidden')) {
                return;
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.onReplayLevel) {
                    this.onReplayLevel();  // Replay Level
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                if (this.onBackToLevels) {
                    this.onBackToLevels();  // Back to Levels
                }
            }
        };
        document.addEventListener('keydown', this.handleSuccessScreenKey);
    }

    showSuccess(levelName, time, rating, isNewBest, previousBest) {
        this.elements.completedLevel.textContent = levelName;
        this.elements.finalTime.textContent = new Timer().formatTime(time);
        this.elements.finalRating.textContent = rating.name;
        this.elements.ratingExplanation.textContent =
            `(Avg time per question: < ${rating.maxAvg}s)`;

        if (isNewBest) {
            this.elements.bestTimeMessage.textContent = previousBest
                ? `New personal best! Beat your old time of ${new Timer().formatTime(previousBest)}.`
                : `You've set your first record!`;
        } else {
            this.elements.bestTimeMessage.textContent =
                `Your best time is still ${new Timer().formatTime(previousBest)}.`;
        }

        this.showScreen('success');
    }

    // Helper method for creating DOM elements
    createEl(tag, options = {}) {
        const el = document.createElement(tag);
        if (options.className) el.className = options.className;
        if (options.id) el.id = options.id;
        if (options.textContent) el.textContent = options.textContent;
        if (options.innerHTML) el.innerHTML = options.innerHTML;
        if (options.type) el.type = options.type;
        if (options.placeholder) el.placeholder = options.placeholder;
        if (options.step) el.step = options.step;
        if (options.style) Object.assign(el.style, options.style);
        if (options.autocomplete) el.autocomplete = options.autocomplete;
        if (options.disabled) el.disabled = options.disabled;
        return el;
    }
}
