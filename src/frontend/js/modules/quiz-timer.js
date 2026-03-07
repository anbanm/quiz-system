/**
 * Quiz Timer Module
 * Provides countdown timer functionality for quiz taking
 * Part of Phase 1 - Core Modernization (v2.0)
 *
 * Uses global namespace pattern for offline-first compatibility
 */

window.QuizModules = window.QuizModules || {};

window.QuizModules.Timer = (function() {
    'use strict';

    let timerInterval = null;
    let remainingSeconds = 0;
    let totalSeconds = 0;
    let isPaused = false;
    let onTimeUp = null;
    let onTick = null;
    let timerElement = null;
    let startTime = null;
    let elapsedSeconds = 0;
    let isCountUp = false;

    /**
     * Create and inject timer UI
     * @param {HTMLElement} parentElement - Where to insert the timer
     * @returns {HTMLElement} Timer element
     */
    function createTimerUI(parentElement) {
        if (timerElement) return timerElement;

        timerElement = document.createElement('div');
        timerElement.id = 'quiz-timer';
        timerElement.setAttribute('role', 'timer');
        timerElement.setAttribute('aria-live', 'polite');
        timerElement.style.cssText = `
            position: sticky;
            top: 0;
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 100;
            margin-bottom: 20px;
            font-family: 'Courier New', monospace;
        `;

        timerElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span id="timer-icon" style="font-size: 20px;">&#9202;</span>
                <span id="timer-display" style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">00:00</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <div id="timer-progress-bar" style="width: 150px; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden;">
                    <div id="timer-progress" style="width: 100%; height: 100%; background: #2ecc71; border-radius: 3px; transition: width 1s linear;"></div>
                </div>
                <button id="timer-pause-btn" onclick="window.QuizModules.Timer.togglePause()" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 12px;
                    width: auto;
                    min-width: 60px;
                " title="Pause/Resume timer">Pause</button>
            </div>
        `;

        if (parentElement) {
            parentElement.insertBefore(timerElement, parentElement.firstChild);
        }

        return timerElement;
    }

    /**
     * Start a countdown timer
     * @param {number} seconds - Total seconds for countdown
     * @param {Object} options - Timer options
     */
    function startCountdown(seconds, options) {
        options = options || {};
        totalSeconds = seconds;
        remainingSeconds = seconds;
        isPaused = false;
        isCountUp = false;
        onTimeUp = options.onTimeUp || null;
        onTick = options.onTick || null;
        startTime = Date.now();

        if (options.parentElement) {
            createTimerUI(options.parentElement);
        }

        clearInterval(timerInterval);
        timerInterval = setInterval(tick, 1000);
        updateDisplay();
    }

    /**
     * Start a count-up timer (elapsed time tracking)
     * @param {Object} options - Timer options
     */
    function startCountUp(options) {
        options = options || {};
        elapsedSeconds = 0;
        isPaused = false;
        isCountUp = true;
        onTick = options.onTick || null;
        startTime = Date.now();

        if (options.parentElement) {
            createTimerUI(options.parentElement);
            // Hide progress bar for count-up
            var progressBar = document.getElementById('timer-progress-bar');
            if (progressBar) progressBar.style.display = 'none';
        }

        clearInterval(timerInterval);
        timerInterval = setInterval(tickUp, 1000);
        updateDisplay();
    }

    /**
     * Countdown tick
     */
    function tick() {
        if (isPaused) return;

        remainingSeconds--;

        if (remainingSeconds <= 0) {
            remainingSeconds = 0;
            stop();
            updateDisplay();
            if (onTimeUp) onTimeUp();
            return;
        }

        updateDisplay();

        // Visual warnings
        if (remainingSeconds <= 60 && timerElement) {
            timerElement.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
            var display = document.getElementById('timer-display');
            if (display) display.style.animation = 'timerPulse 1s ease infinite';
        } else if (remainingSeconds <= 300 && timerElement) {
            timerElement.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
        }

        if (onTick) onTick(remainingSeconds);
    }

    /**
     * Count-up tick
     */
    function tickUp() {
        if (isPaused) return;
        elapsedSeconds++;
        updateDisplay();
        if (onTick) onTick(elapsedSeconds);
    }

    /**
     * Update the timer display
     */
    function updateDisplay() {
        var display = document.getElementById('timer-display');
        var progress = document.getElementById('timer-progress');

        if (display) {
            var seconds = isCountUp ? elapsedSeconds : remainingSeconds;
            display.textContent = formatTime(seconds);
        }

        if (progress && !isCountUp && totalSeconds > 0) {
            var pct = (remainingSeconds / totalSeconds) * 100;
            progress.style.width = pct + '%';

            if (pct <= 10) progress.style.background = '#e74c3c';
            else if (pct <= 30) progress.style.background = '#f39c12';
            else progress.style.background = '#2ecc71';
        }
    }

    /**
     * Format seconds into MM:SS or HH:MM:SS
     * @param {number} totalSec - Total seconds
     * @returns {string} Formatted time string
     */
    function formatTime(totalSec) {
        var hours = Math.floor(totalSec / 3600);
        var minutes = Math.floor((totalSec % 3600) / 60);
        var secs = totalSec % 60;

        if (hours > 0) {
            return pad(hours) + ':' + pad(minutes) + ':' + pad(secs);
        }
        return pad(minutes) + ':' + pad(secs);
    }

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    /**
     * Toggle pause/resume
     */
    function togglePause() {
        isPaused = !isPaused;
        var btn = document.getElementById('timer-pause-btn');
        if (btn) btn.textContent = isPaused ? 'Resume' : 'Pause';
    }

    /**
     * Stop the timer
     */
    function stop() {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    /**
     * Reset the timer
     */
    function reset() {
        stop();
        remainingSeconds = totalSeconds;
        elapsedSeconds = 0;
        isPaused = false;
        updateDisplay();
    }

    /**
     * Get elapsed time in seconds
     * @returns {number} Elapsed seconds
     */
    function getElapsed() {
        if (isCountUp) return elapsedSeconds;
        return totalSeconds - remainingSeconds;
    }

    /**
     * Get remaining time in seconds
     * @returns {number} Remaining seconds
     */
    function getRemaining() {
        return remainingSeconds;
    }

    /**
     * Check if timer is running
     * @returns {boolean}
     */
    function isRunning() {
        return timerInterval !== null && !isPaused;
    }

    /**
     * Remove timer UI
     */
    function destroy() {
        stop();
        if (timerElement && timerElement.parentNode) {
            timerElement.parentNode.removeChild(timerElement);
        }
        timerElement = null;
    }

    // Register module
    if (window.QuizModules.Loader) {
        window.QuizModules.Loader.registerModule('Timer', '2.0.0');
    }

    return {
        createTimerUI: createTimerUI,
        startCountdown: startCountdown,
        startCountUp: startCountUp,
        togglePause: togglePause,
        stop: stop,
        reset: reset,
        getElapsed: getElapsed,
        getRemaining: getRemaining,
        isRunning: isRunning,
        destroy: destroy,
        formatTime: formatTime
    };
})();
