/**
 * StorageManager - Handles localStorage operations for progress tracking
 */
class StorageManager {
    static saveBestTime(levelKey, time) {
        try {
            localStorage.setItem(`${CONFIG.STORAGE_PREFIX}${levelKey}`, time);
        } catch (error) {
            console.error('Error saving best time:', error);
        }
    }

    static getBestTime(levelKey) {
        try {
            const time = localStorage.getItem(`${CONFIG.STORAGE_PREFIX}${levelKey}`);
            return time ? parseInt(time, 10) : null;
        } catch (error) {
            console.error('Error retrieving best time:', error);
            return null;
        }
    }

    static getRating(time) {
        const avgTime = time / CONFIG.REQUIRED_STREAK;
        return CONFIG.RATING_THRESHOLDS.find(r => avgTime <= r.maxAvg);
    }

    static clearAllData() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(CONFIG.STORAGE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Error clearing data:', error);
        }
    }
}
