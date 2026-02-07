/**
 * RatingUtils - Rating calculation with level difficulty modifiers
 */
class RatingUtils {
    /**
     * Calculate the rating for a completed level.
     * Harder levels have higher multipliers, making thresholds more forgiving.
     *
     * @param {number} totalTime - Total elapsed time in seconds
     * @param {string} levelKey - The level's identifier (e.g. 'quad_rad')
     * @param {number} [questionCount] - Number of questions answered (defaults to REQUIRED_STREAK)
     * @returns {{ maxAvg: number, name: string, key: string }} The rating object
     */
    static getRating(totalTime, levelKey, questionCount = CONFIG.REQUIRED_STREAK) {
        const avgTime = RatingUtils.calculateAverageTime(totalTime, questionCount);
        const adjustedAvgTime = RatingUtils.applyDifficultyMultiplier(avgTime, levelKey);
        return CONFIG.RATING_THRESHOLDS.find(r => adjustedAvgTime <= r.maxAvg);
    }

    /**
     * Calculate average time per question.
     * @param {number} totalTime - Total elapsed time in seconds
     * @param {number} questionCount - Number of questions answered
     * @returns {number} Average time per question in seconds
     */
    static calculateAverageTime(totalTime, questionCount) {
        return totalTime / questionCount;
    }

    /**
     * Apply difficulty multiplier to an average time.
     * Dividing by the multiplier means harder levels (higher multiplier) produce
     * a smaller adjusted time, making it easier to earn top ratings.
     *
     * @param {number} avgTime - Average time per question in seconds
     * @param {string} levelKey - The level's identifier
     * @returns {number} Adjusted average time
     */
    static applyDifficultyMultiplier(avgTime, levelKey) {
        const multiplier = CONFIG.LEVEL_DIFFICULTY_MULTIPLIERS[levelKey]
            ?? CONFIG.LEVEL_DIFFICULTY_MULTIPLIERS['default']
            ?? 1.0;
        return avgTime / multiplier;
    }

    /**
     * Calculate the total time target needed to achieve the next better rating.
     * Reverses the formula: targetTime = nextRating.maxAvg * multiplier * questionCount
     *
     * @param {string} currentRatingKey - The current rating key (e.g. 'expert')
     * @param {string} levelKey - The level's identifier
     * @param {number} [questionCount] - Number of questions (defaults to REQUIRED_STREAK)
     * @returns {{ targetTime: number, nextRating: object } | null} Target info, or null if already at best rating
     */
    static getNextRatingTarget(currentRatingKey, levelKey, questionCount = CONFIG.REQUIRED_STREAK) {
        const thresholds = CONFIG.RATING_THRESHOLDS;
        const currentIndex = thresholds.findIndex(r => r.key === currentRatingKey);

        // Already at the best rating or not found
        if (currentIndex <= 0) return null;

        const nextRating = thresholds[currentIndex - 1];
        const multiplier = CONFIG.LEVEL_DIFFICULTY_MULTIPLIERS[levelKey]
            ?? CONFIG.LEVEL_DIFFICULTY_MULTIPLIERS['default']
            ?? 1.0;
        const targetTime = nextRating.maxAvg * multiplier * questionCount;

        return { targetTime, nextRating };
    }

    /**
     * Map a rating key to emoji and CSS class for UI display.
     * @param {string} ratingKey - The rating key (e.g. 'mastery')
     * @returns {{ emoji: string, class: string }}
     */
    static toProgressUIFormat(ratingKey) {
        const map = {
            'true-mastery': { emoji: '💖', class: 'rating-true-mastery' },
            'mastery':      { emoji: '⚡', class: 'rating-mastery' },
            'expert':       { emoji: '🎯', class: 'rating-expert' },
            'pro':          { emoji: '👍', class: 'rating-pro' },
            'apprentice':   { emoji: '📚', class: 'rating-apprentice' }
        };
        return map[ratingKey] || { emoji: '', class: 'rating-none' };
    }
}
