/**
 * Quiz Question Bank Module
 * Provides question bank with tagging, search, and reuse across quizzes
 * Part of Phase 2 - Platform Features (v3.0)
 *
 * Uses global namespace pattern for offline-first compatibility
 */

window.QuizModules = window.QuizModules || {};

window.QuizModules.QuestionBank = (function() {
    'use strict';

    var STORAGE_KEY = 'quiz-question-bank';
    var bank = [];

    /**
     * Initialize the question bank from localStorage
     */
    function init() {
        try {
            var storage = window.QuizModules.Security ? window.QuizModules.Security.safeStorage : localStorage;
            var saved = typeof storage.getItem === 'function' ? storage.getItem(STORAGE_KEY) : localStorage.getItem(STORAGE_KEY);
            if (saved) bank = JSON.parse(saved);
        } catch (e) {
            console.warn('Failed to load question bank:', e);
            bank = [];
        }
    }

    /**
     * Save bank to localStorage
     */
    function save() {
        try {
            var data = JSON.stringify(bank);
            var storage = window.QuizModules.Security ? window.QuizModules.Security.safeStorage : localStorage;
            if (typeof storage.setItem === 'function') {
                storage.setItem(STORAGE_KEY, data);
            } else {
                localStorage.setItem(STORAGE_KEY, data);
            }
        } catch (e) {
            console.error('Failed to save question bank:', e);
        }
    }

    /**
     * Add a question to the bank
     * @param {Object} question - Question object
     * @param {Array} tags - Tags for categorization
     * @returns {Object} Banked question with metadata
     */
    function addQuestion(question, tags) {
        var bankItem = {
            id: 'bank-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            question: Object.assign({}, question),
            tags: tags || [],
            category: question.category || 'General',
            difficulty: question.difficulty || 'easy',
            createdAt: new Date().toISOString(),
            usageCount: 0,
            lastUsed: null
        };

        // Add default tags from question properties
        if (question.category && bankItem.tags.indexOf(question.category) === -1) {
            bankItem.tags.push(question.category);
        }
        if (question.difficulty && bankItem.tags.indexOf(question.difficulty) === -1) {
            bankItem.tags.push(question.difficulty);
        }

        bank.push(bankItem);
        save();
        return bankItem;
    }

    /**
     * Add multiple questions from a quiz to the bank
     * @param {Array} questions - Array of question objects
     * @param {string} quizName - Source quiz name (added as tag)
     * @returns {number} Number of questions added
     */
    function addFromQuiz(questions, quizName) {
        var added = 0;
        for (var i = 0; i < questions.length; i++) {
            var tags = quizName ? [quizName] : [];
            // Check for duplicates by question text
            var isDuplicate = bank.some(function(item) {
                return item.question.question === questions[i].question;
            });
            if (!isDuplicate) {
                addQuestion(questions[i], tags);
                added++;
            }
        }
        return added;
    }

    /**
     * Remove a question from the bank
     * @param {string} bankId - Bank item ID
     */
    function removeQuestion(bankId) {
        bank = bank.filter(function(item) { return item.id !== bankId; });
        save();
    }

    /**
     * Search questions by text, tags, difficulty, or category
     * @param {Object} criteria - Search criteria
     * @returns {Array} Matching questions
     */
    function search(criteria) {
        criteria = criteria || {};
        return bank.filter(function(item) {
            // Text search
            if (criteria.text) {
                var searchText = criteria.text.toLowerCase();
                var questionText = (item.question.question || '').toLowerCase();
                if (questionText.indexOf(searchText) === -1) return false;
            }

            // Tag filter
            if (criteria.tags && criteria.tags.length > 0) {
                var hasTag = criteria.tags.some(function(tag) {
                    return item.tags.indexOf(tag) !== -1;
                });
                if (!hasTag) return false;
            }

            // Difficulty filter
            if (criteria.difficulty && item.difficulty !== criteria.difficulty) return false;

            // Category filter
            if (criteria.category && item.category !== criteria.category) return false;

            return true;
        });
    }

    /**
     * Get all unique tags in the bank
     * @returns {Array} Sorted array of unique tags
     */
    function getAllTags() {
        var tagSet = {};
        for (var i = 0; i < bank.length; i++) {
            for (var j = 0; j < bank[i].tags.length; j++) {
                tagSet[bank[i].tags[j]] = true;
            }
        }
        return Object.keys(tagSet).sort();
    }

    /**
     * Get all unique categories
     * @returns {Array} Sorted array of unique categories
     */
    function getAllCategories() {
        var cats = {};
        for (var i = 0; i < bank.length; i++) {
            cats[bank[i].category] = true;
        }
        return Object.keys(cats).sort();
    }

    /**
     * Get random questions from the bank
     * @param {number} count - Number of questions to get
     * @param {Object} filters - Optional filters (difficulty, category, tags)
     * @returns {Array} Random selection of questions
     */
    function getRandomQuestions(count, filters) {
        var pool = filters ? search(filters) : bank.slice();
        var shuffled = pool.sort(function() { return Math.random() - 0.5; });
        return shuffled.slice(0, count).map(function(item) {
            item.usageCount++;
            item.lastUsed = new Date().toISOString();
            return Object.assign({}, item.question);
        });
    }

    /**
     * Get statistics about the question bank
     * @returns {Object} Bank statistics
     */
    function getStats() {
        var difficulties = {};
        var categories = {};

        for (var i = 0; i < bank.length; i++) {
            var d = bank[i].difficulty || 'easy';
            difficulties[d] = (difficulties[d] || 0) + 1;
            var c = bank[i].category || 'General';
            categories[c] = (categories[c] || 0) + 1;
        }

        return {
            totalQuestions: bank.length,
            byDifficulty: difficulties,
            byCategory: categories,
            totalTags: getAllTags().length
        };
    }

    /**
     * Export bank to JSON
     * @returns {string} JSON string
     */
    function exportBank() {
        return JSON.stringify(bank, null, 2);
    }

    /**
     * Import bank from JSON
     * @param {string} json - JSON string
     * @returns {number} Number of questions imported
     */
    function importBank(json) {
        try {
            var imported = JSON.parse(json);
            if (!Array.isArray(imported)) return 0;

            var count = 0;
            for (var i = 0; i < imported.length; i++) {
                if (imported[i].question) {
                    bank.push(imported[i]);
                    count++;
                }
            }
            save();
            return count;
        } catch (e) {
            console.error('Import failed:', e);
            return 0;
        }
    }

    /**
     * Generate question bank UI HTML
     * @param {Object} options - Display options
     * @returns {string} HTML string
     */
    function generateBankUI(options) {
        options = options || {};
        var stats = getStats();
        var items = options.searchCriteria ? search(options.searchCriteria) : bank;

        var html = '<div id="question-bank-panel" style="padding: 20px;">';

        // Header and stats
        html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">';
        html += '<h3 style="margin: 0; color: #2c3e50;">Question Bank (' + stats.totalQuestions + ' questions)</h3>';
        html += '<div style="display: flex; gap: 8px;">';
        html += '<button onclick="window.QuizModules.QuestionBank.exportToFile()" style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; width: auto;">Export</button>';
        html += '</div></div>';

        // Search bar
        html += '<div style="margin-bottom: 15px;">';
        html += '<input type="text" id="bank-search" placeholder="Search questions..." oninput="window.QuizModules.QuestionBank.handleSearch(this.value)" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">';
        html += '</div>';

        // Filter chips
        var tags = getAllTags();
        if (tags.length > 0) {
            html += '<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 15px;">';
            for (var i = 0; i < Math.min(tags.length, 20); i++) {
                html += '<span onclick="window.QuizModules.QuestionBank.filterByTag(\'' + tags[i] + '\')" style="background: #e3f2fd; color: #1976d2; padding: 4px 10px; border-radius: 15px; font-size: 12px; cursor: pointer;">' + tags[i] + '</span>';
            }
            html += '</div>';
        }

        // Question list
        html += '<div id="bank-question-list">';
        for (var j = 0; j < items.length; j++) {
            var item = items[j];
            html += '<div style="padding: 12px; margin-bottom: 8px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #3498db;">';
            html += '<div style="display: flex; justify-content: space-between; align-items: flex-start;">';
            html += '<div style="flex: 1;"><strong>' + (item.question.question || '').substring(0, 100) + '</strong>';
            html += '<div style="margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap;">';
            for (var k = 0; k < item.tags.length; k++) {
                html += '<span style="background: #e9ecef; padding: 2px 8px; border-radius: 10px; font-size: 11px;">' + item.tags[k] + '</span>';
            }
            html += '</div></div>';
            html += '<button onclick="window.QuizModules.QuestionBank.useQuestion(\'' + item.id + '\')" style="background: #27ae60; color: white; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-size: 12px; width: auto; white-space: nowrap; margin-left: 10px;">Use</button>';
            html += '</div></div>';
        }
        if (items.length === 0) {
            html += '<p style="text-align: center; color: #7f8c8d; padding: 20px;">No questions in bank. Add questions from your quizzes!</p>';
        }
        html += '</div></div>';

        return html;
    }

    /**
     * Export bank to downloadable file
     */
    function exportToFile() {
        var json = exportBank();
        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'question-bank-' + new Date().toISOString().split('T')[0] + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Placeholder handlers for UI interaction
    function handleSearch() { /* Implemented by UI integration */ }
    function filterByTag() { /* Implemented by UI integration */ }
    function useQuestion() { /* Implemented by UI integration */ }

    // Initialize on load
    init();

    // Register module
    if (window.QuizModules.Loader) {
        window.QuizModules.Loader.registerModule('QuestionBank', '3.0.0');
    }

    return {
        init: init,
        addQuestion: addQuestion,
        addFromQuiz: addFromQuiz,
        removeQuestion: removeQuestion,
        search: search,
        getAllTags: getAllTags,
        getAllCategories: getAllCategories,
        getRandomQuestions: getRandomQuestions,
        getStats: getStats,
        exportBank: exportBank,
        importBank: importBank,
        generateBankUI: generateBankUI,
        exportToFile: exportToFile,
        handleSearch: handleSearch,
        filterByTag: filterByTag,
        useQuestion: useQuestion,
        getBank: function() { return bank.slice(); }
    };
})();
