/**
 * Quiz Anti-Cheating Module
 * Provides anti-cheating measures for quiz taking
 * Part of Phase 3 - Advanced Capabilities (v4.0)
 *
 * Uses global namespace pattern for offline-first compatibility
 */

window.QuizModules = window.QuizModules || {};

window.QuizModules.AntiCheat = (function() {
    'use strict';

    var config = {
        detectTabSwitch: true,
        detectCopyPaste: true,
        randomizeQuestions: true,
        randomizeOptions: true,
        fullscreenMode: false,
        maxTabSwitches: 3,
        logEvents: true
    };

    var tabSwitchCount = 0;
    var eventLog = [];
    var isActive = false;
    var warningElement = null;

    /**
     * Activate anti-cheating measures
     * @param {Object} options - Configuration options
     */
    function activate(options) {
        if (isActive) return;

        Object.assign(config, options || {});
        isActive = true;
        tabSwitchCount = 0;
        eventLog = [];

        if (config.detectTabSwitch) {
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('blur', handleWindowBlur);
        }

        if (config.detectCopyPaste) {
            document.addEventListener('copy', preventCopy);
            document.addEventListener('cut', preventCopy);
            document.addEventListener('contextmenu', preventContextMenu);
        }

        logEvent('Anti-cheat activated');
    }

    /**
     * Deactivate anti-cheating measures
     */
    function deactivate() {
        if (!isActive) return;

        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleWindowBlur);
        document.removeEventListener('copy', preventCopy);
        document.removeEventListener('cut', preventCopy);
        document.removeEventListener('contextmenu', preventContextMenu);

        if (warningElement && warningElement.parentNode) {
            warningElement.parentNode.removeChild(warningElement);
        }

        isActive = false;
        logEvent('Anti-cheat deactivated');
    }

    /**
     * Handle tab visibility change
     */
    function handleVisibilityChange() {
        if (document.hidden) {
            tabSwitchCount++;
            logEvent('Tab switch detected (count: ' + tabSwitchCount + ')');

            showWarning('You switched away from the quiz. (' + tabSwitchCount + '/' + config.maxTabSwitches + ' allowed)');

            if (tabSwitchCount >= config.maxTabSwitches) {
                logEvent('Max tab switches exceeded');
                if (config.onMaxSwitches) config.onMaxSwitches(tabSwitchCount);
            }
        }
    }

    /**
     * Handle window blur
     */
    function handleWindowBlur() {
        logEvent('Window lost focus');
    }

    /**
     * Prevent copy/cut
     * @param {Event} e
     */
    function preventCopy(e) {
        e.preventDefault();
        logEvent('Copy/cut attempt blocked');
        showWarning('Copying is disabled during the quiz.');
    }

    /**
     * Prevent context menu
     * @param {Event} e
     */
    function preventContextMenu(e) {
        e.preventDefault();
        logEvent('Right-click blocked');
    }

    /**
     * Show a warning overlay
     * @param {string} message
     */
    function showWarning(message) {
        if (warningElement && warningElement.parentNode) {
            warningElement.parentNode.removeChild(warningElement);
        }

        warningElement = document.createElement('div');
        warningElement.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#f8d7da;color:#721c24;padding:12px 20px;text-align:center;z-index:10001;font-weight:600;border-bottom:3px solid #dc3545;animation:toastSlideIn 0.3s ease;';
        warningElement.innerHTML = '<span style="margin-right:10px;">&#9888;</span>' + message;
        document.body.appendChild(warningElement);

        setTimeout(function() {
            if (warningElement && warningElement.parentNode) {
                warningElement.parentNode.removeChild(warningElement);
            }
        }, 5000);
    }

    /**
     * Randomize array order (Fisher-Yates shuffle)
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array (new array)
     */
    function shuffle(array) {
        var shuffled = array.slice();
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
        return shuffled;
    }

    /**
     * Randomize questions order
     * @param {Array} questions - Array of questions
     * @returns {Array} Randomized questions with updated positions
     */
    function randomizeQuestions(questions) {
        var shuffled = shuffle(questions);
        for (var i = 0; i < shuffled.length; i++) {
            shuffled[i] = Object.assign({}, shuffled[i], {
                position: i + 1,
                _originalPosition: shuffled[i].position || (i + 1)
            });
        }
        return shuffled;
    }

    /**
     * Randomize options for a question
     * @param {Object} question - Question object
     * @returns {Object} Question with randomized options
     */
    function randomizeOptions(question) {
        if (!question.options || typeof question.options !== 'object') return question;

        var entries = Object.entries(question.options);
        var shuffledEntries = shuffle(entries);
        var letters = ['A', 'B', 'C', 'D', 'E', 'F'];

        var newOptions = {};
        var newOptionsHtml = {};
        var answerMapping = {};

        for (var i = 0; i < shuffledEntries.length; i++) {
            var originalLetter = shuffledEntries[i][0];
            var newLetter = letters[i];
            newOptions[newLetter] = shuffledEntries[i][1];

            if (question.optionsHtml && question.optionsHtml[originalLetter]) {
                newOptionsHtml[newLetter] = question.optionsHtml[originalLetter];
            }

            answerMapping[originalLetter] = newLetter;
        }

        var newCorrect = answerMapping[question.correctAnswer] || question.correctAnswer;

        return Object.assign({}, question, {
            options: newOptions,
            optionsHtml: Object.keys(newOptionsHtml).length > 0 ? newOptionsHtml : question.optionsHtml,
            correctAnswer: newCorrect,
            _originalCorrectAnswer: question.correctAnswer,
            _answerMapping: answerMapping
        });
    }

    /**
     * Log an anti-cheat event
     * @param {string} event - Event description
     */
    function logEvent(event) {
        if (!config.logEvents) return;
        eventLog.push({
            timestamp: new Date().toISOString(),
            event: event
        });
    }

    /**
     * Get anti-cheat event log
     * @returns {Array} Event log
     */
    function getEventLog() {
        return eventLog.slice();
    }

    /**
     * Get tab switch count
     * @returns {number}
     */
    function getTabSwitchCount() {
        return tabSwitchCount;
    }

    /**
     * Check if anti-cheat is active
     * @returns {boolean}
     */
    function isAntiCheatActive() {
        return isActive;
    }

    // Register module
    if (window.QuizModules.Loader) {
        window.QuizModules.Loader.registerModule('AntiCheat', '4.0.0');
    }

    return {
        activate: activate,
        deactivate: deactivate,
        shuffle: shuffle,
        randomizeQuestions: randomizeQuestions,
        randomizeOptions: randomizeOptions,
        getEventLog: getEventLog,
        getTabSwitchCount: getTabSwitchCount,
        isActive: isAntiCheatActive,
        showWarning: showWarning
    };
})();
