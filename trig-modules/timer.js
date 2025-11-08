/**
 * Timer - Handles game timing with pause/resume functionality
 */
class Timer {
    constructor(displayElement) {
        this.display = displayElement;
        this.reset();
        this.isPaused = false;
    }

    reset() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.startTime = 0;
        this.seconds = 0;
        this.isPaused = false;
        if (this.display) {
            this.display.textContent = this.formatTime(0);
        }
    }

    start() {
        // Stop any existing interval
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        // Reset time values without affecting display
        this.startTime = Date.now();
        this.seconds = 0;
        this.isPaused = false;

        // Display 00:00
        if (this.display) {
            this.display.textContent = this.formatTime(0);
        }

        this.interval = setInterval(() => {
            this.seconds = Math.floor((Date.now() - this.startTime) / 1000);
            if (this.display) {
                this.display.textContent = this.formatTime(this.seconds);
            }
        }, 100);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    pause() {
        this.stop();
        this.isPaused = true;
    }

    resume() {
        if (this.isPaused && this.startTime) {
            const pausedSeconds = this.seconds;
            this.startTime = Date.now() - (pausedSeconds * 1000);
            this.isPaused = false;

            this.interval = setInterval(() => {
                this.seconds = Math.floor((Date.now() - this.startTime) / 1000);
                if (this.display) {
                    this.display.textContent = this.formatTime(this.seconds);
                }
            }, 100);
        }
    }

    getSeconds() {
        return this.seconds;
    }

    formatTime(sec) {
        const minutes = Math.floor(sec / 60).toString().padStart(2, '0');
        const seconds = (sec % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }
}
