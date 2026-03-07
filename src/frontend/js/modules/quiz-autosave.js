/**
 * Quiz Auto-Save Module
 * Provides auto-save drafts and unsaved changes warning
 * Part of Phase 1 - Core Modernization (v2.0)
 *
 * Uses global namespace pattern for offline-first compatibility
 */

window.QuizModules = window.QuizModules || {};

window.QuizModules.AutoSave = (function() {
    'use strict';

    var AUTOSAVE_KEY = 'quiz-autosave-draft';
    var AUTOSAVE_INTERVAL = 30000; // 30 seconds
    var intervalId = null;
    var hasUnsavedChanges = false;
    var lastSavedHash = '';
    var indicatorElement = null;

    /**
     * Initialize auto-save functionality
     * @param {Function} getStateCallback - Function to get current quiz state
     * @param {Function} restoreStateCallback - Function to restore quiz state
     */
    function init(getStateCallback, restoreStateCallback) {
        if (!getStateCallback) return;

        // Set up auto-save interval
        intervalId = setInterval(function() {
            autoSave(getStateCallback);
        }, AUTOSAVE_INTERVAL);

        // Set up beforeunload warning
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Track changes
        document.addEventListener('input', markDirty);
        document.addEventListener('change', markDirty);

        // Create unsaved indicator
        createIndicator();

        // Check for existing draft
        checkForDraft(restoreStateCallback);
    }

    /**
     * Create the unsaved changes indicator
     */
    function createIndicator() {
        if (indicatorElement) return;

        indicatorElement = document.createElement('div');
        indicatorElement.className = 'unsaved-indicator';
        indicatorElement.setAttribute('role', 'status');
        indicatorElement.setAttribute('aria-live', 'polite');
        indicatorElement.textContent = 'Unsaved changes';
        document.body.appendChild(indicatorElement);
    }

    /**
     * Mark the quiz as having unsaved changes
     */
    function markDirty() {
        if (!hasUnsavedChanges) {
            hasUnsavedChanges = true;
            if (indicatorElement) {
                indicatorElement.classList.add('visible');
            }
        }
    }

    /**
     * Mark the quiz as saved (clean)
     */
    function markClean() {
        hasUnsavedChanges = false;
        if (indicatorElement) {
            indicatorElement.classList.remove('visible');
        }
    }

    /**
     * Auto-save current state
     * @param {Function} getStateCallback
     */
    function autoSave(getStateCallback) {
        if (!hasUnsavedChanges) return;

        try {
            var state = getStateCallback();
            if (!state) return;

            var stateStr = JSON.stringify(state);
            var hash = simpleHash(stateStr);

            // Only save if state has changed
            if (hash === lastSavedHash) return;

            var saveData = {
                state: state,
                timestamp: new Date().toISOString(),
                hash: hash
            };

            var storage = window.QuizModules.Security ? window.QuizModules.Security.safeStorage : localStorage;
            var success;
            if (typeof storage.setItem === 'function') {
                success = storage.setItem(AUTOSAVE_KEY, JSON.stringify(saveData));
            } else {
                try {
                    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(saveData));
                    success = true;
                } catch (e) { success = false; }
            }

            if (success !== false) {
                lastSavedHash = hash;
                console.log('[AutoSave] Draft saved at', new Date().toLocaleTimeString());
            }
        } catch (e) {
            console.warn('[AutoSave] Failed:', e);
        }
    }

    /**
     * Check for existing draft
     * @param {Function} restoreCallback
     */
    function checkForDraft(restoreCallback) {
        try {
            var storage = window.QuizModules.Security ? window.QuizModules.Security.safeStorage : localStorage;
            var saved = typeof storage.getItem === 'function' ? storage.getItem(AUTOSAVE_KEY) : localStorage.getItem(AUTOSAVE_KEY);
            if (!saved) return;

            var draft = JSON.parse(saved);
            if (!draft || !draft.state) return;

            var age = Date.now() - new Date(draft.timestamp).getTime();
            if (age > 24 * 60 * 60 * 1000) {
                // Draft is older than 24 hours, discard
                clearDraft();
                return;
            }

            var timeAgo = formatTimeAgo(draft.timestamp);

            // Show restore prompt
            if (window.QuizModules.Toast) {
                var toast = window.QuizModules.Toast.show(
                    'Draft found from ' + timeAgo + '. Click to restore.',
                    'info',
                    10000
                );
                if (toast) {
                    toast.style.cursor = 'pointer';
                    toast.addEventListener('click', function() {
                        if (restoreCallback) restoreCallback(draft.state);
                        window.QuizModules.Toast.dismiss(toast);
                        markClean();
                    });
                }
            }
        } catch (e) {
            console.warn('[AutoSave] Failed to check draft:', e);
        }
    }

    /**
     * Clear saved draft
     */
    function clearDraft() {
        try {
            var storage = window.QuizModules.Security ? window.QuizModules.Security.safeStorage : localStorage;
            if (typeof storage.removeItem === 'function') {
                storage.removeItem(AUTOSAVE_KEY);
            } else {
                localStorage.removeItem(AUTOSAVE_KEY);
            }
        } catch (e) { /* ignore */ }
    }

    /**
     * Handle beforeunload event
     * @param {Event} e
     */
    function handleBeforeUnload(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    }

    /**
     * Simple string hash for change detection
     * @param {string} str
     * @returns {string}
     */
    function simpleHash(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0;
        }
        return hash.toString(36);
    }

    /**
     * Format timestamp as "X ago"
     * @param {string} timestamp
     * @returns {string}
     */
    function formatTimeAgo(timestamp) {
        var diff = Date.now() - new Date(timestamp).getTime();
        var minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'just now';
        if (minutes < 60) return minutes + ' minute' + (minutes > 1 ? 's' : '') + ' ago';
        var hours = Math.floor(minutes / 60);
        if (hours < 24) return hours + ' hour' + (hours > 1 ? 's' : '') + ' ago';
        return 'over a day ago';
    }

    /**
     * Destroy auto-save (cleanup)
     */
    function destroy() {
        if (intervalId) clearInterval(intervalId);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('input', markDirty);
        document.removeEventListener('change', markDirty);
        if (indicatorElement && indicatorElement.parentNode) {
            indicatorElement.parentNode.removeChild(indicatorElement);
        }
    }

    /**
     * Check if there are unsaved changes
     * @returns {boolean}
     */
    function isDirty() {
        return hasUnsavedChanges;
    }

    // Register module
    if (window.QuizModules.Loader) {
        window.QuizModules.Loader.registerModule('AutoSave', '2.0.0');
    }

    return {
        init: init,
        markDirty: markDirty,
        markClean: markClean,
        clearDraft: clearDraft,
        isDirty: isDirty,
        destroy: destroy
    };
})();
