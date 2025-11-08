/**
 * AnswerChecker - Handles answer validation with support for exact values and equivalent expressions
 */
class AnswerChecker {
    constructor() {
        this.tolerance = 1e-10;
    }

    checkAnswer(userLatex, correctAnswer, questionType) {
        try {
            // Handle special cases first
            if (this.handleSpecialCases(userLatex, correctAnswer)) {
                return true;
            }

            // Convert both answers to comparable forms
            const userValue = this.latexToValue(userLatex);
            const correctValue = this.latexToValue(correctAnswer);

            // For exact comparisons (like fractions, radians)
            if (questionType === 'exact_value' || questionType === 'exact_angle' ||
                questionType === 'conversion_d2r' || questionType === 'conversion_r2d' ||
                questionType === 'equivalent' || questionType === 'quadrant' ||
                questionType === 'simplify_fractions' || questionType === 'reference_angles' ||
                questionType === 'reference_angles_rad') {
                const result = this.compareExact(userValue, correctValue, userLatex, correctAnswer);
                return result;
            }

            // For approximate comparisons
            if (typeof userValue === 'number' && typeof correctValue === 'number') {
                const diff = Math.abs(userValue - correctValue);
                const result = diff < this.tolerance;
                return result;
            }

            return false;

        } catch (error) {
            console.error('Answer check error:', error);
            return false;
        }
    }

    handleSpecialCases(userLatex, correctAnswer) {
        // Handle undefined/infinity cases
        if (correctAnswer === 'undefined') {
            return userLatex.includes('undefined') || userLatex.includes('\\text{undefined}');
        }

        // Handle exact string matches
        if (userLatex === correctAnswer) {
            return true;
        }

        return false;
    }

    normalizeEquivalentExpression(expr) {
        // Remove backslashes and normalize function expressions
        let normalized = expr
            .replace(/\\/g, '')
            .replace(/\{([^}]+)\}/g, '($1)')  // Convert {30} to (30)
            .replace(/\s+/g, '')
            .toLowerCase();

        // Handle expressions like "sin(30)" or "-cos(45)"
        const match = normalized.match(/^(-?)(sin|cos|tan|cot|sec|csc)\(([^)]+)\)$/);
        if (match) {
            const [, sign, func, angle] = match;
            return `${sign}${func}(${angle})`;
        }

        return normalized;
    }

    latexToValue(latex) {
        try {
            // Handle common LaTeX expressions
            let expr = latex
                .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
                .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
                .replace(/\\pi/g, 'pi')
                .replace(/\\theta/g, 'theta')
                .replace(/\\circ/g, '')
                .replace(/°/g, '')
                .replace(/\\text\{([^}]+)\}/g, '$1')
                .replace(/\\left\(/g, '(')
                .replace(/\\right\)/g, ')')
                .replace(/\\sin/g, 'sin')
                .replace(/\\cos/g, 'cos')
                .replace(/\\tan/g, 'tan')
                .replace(/\\cot/g, 'cot')
                .replace(/\\sec/g, 'sec')
                .replace(/\\csc/g, 'csc')
                .replace(/\s+/g, '');

            // For equivalent expressions, return the normalized string instead of evaluating
            if (expr.includes('sin') || expr.includes('cos') || expr.includes('tan') ||
                expr.includes('cot') || expr.includes('sec') || expr.includes('csc')) {
                const normalized = this.normalizeEquivalentExpression(expr);
                return normalized;
            }

            // Try to evaluate with math.js
            const scope = { pi: Math.PI, e: Math.E };
            const result = math.evaluate(expr, scope);
            return result;

        } catch (error) {
            // If evaluation fails, return the normalized string for comparison
            const normalized = this.normalizeEquivalentExpression(latex);
            return normalized;
        }
    }

    compareExact(userValue, correctValue, userLatex, correctLatex) {
        // For equivalent expressions, compare the normalized forms
        if (typeof userValue === 'string' && typeof correctValue === 'string') {
            const isEqual = userValue === correctValue;

            if (isEqual) {
                return true;
            }

            // Try trimmed comparison as fallback
            const trimmedEqual = userValue.trim() === correctValue.trim();
            if (trimmedEqual) {
                return true;
            }
        }

        // Try numeric comparison
        if (typeof userValue === 'number' && typeof correctValue === 'number') {
            const diff = Math.abs(userValue - correctValue);
            const result = diff < this.tolerance;
            if (result) {
                return true;
            }
        }

        // Then try normalized LaTeX comparison
        const normalizedUser = this.normalizeLaTeX(userLatex);
        const normalizedCorrect = this.normalizeLaTeX(correctLatex);

        if (normalizedUser === normalizedCorrect) {
            return true;
        }

        // Try equivalent forms
        const equivalentResult = this.checkEquivalentForms(normalizedUser, normalizedCorrect);
        return equivalentResult;
    }

    normalizeLaTeX(latex) {
        return latex
            .replace(/\s+/g, '')
            .replace(/\\frac\{1\}\{\\sqrt\{2\}\}/g, '\\frac{\\sqrt{2}}{2}')
            .replace(/\\frac\{\\sqrt\{2\}\}\{2\}/g, '\\frac{1}{\\sqrt{2}}')
            .replace(/\{1\}/g, '1')
            .replace(/\{2\}/g, '2')
            .replace(/\{3\}/g, '3');
    }

    checkEquivalentForms(user, correct) {
        // Define equivalent expressions
        const equivalents = [
            ['\\frac{1}{\\sqrt{2}}', '\\frac{\\sqrt{2}}{2}'],
            ['\\frac{1}{\\sqrt{3}}', '\\frac{\\sqrt{3}}{3}'],
            ['-\\frac{1}{2}', '-0.5'],
            ['\\frac{1}{2}', '0.5'],
            ['0', '0.0'],
            ['1', '1.0'],
        ];

        for (const [form1, form2] of equivalents) {
            if ((user === form1 && correct === form2) || (user === form2 && correct === form1)) {
                return true;
            }
        }

        return false;
    }
}
