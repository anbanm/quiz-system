/**
 * Quiz Utility Functions Module
 * Contains all utility functions extracted from quiz-generator.js
 * Part of the modular refactoring - Phase 1
 * 
 * Uses global namespace pattern for offline-first compatibility
 */

// Create namespace if it doesn't exist
window.QuizModules = window.QuizModules || {};

// Define the utilities module
window.QuizModules.Utils = (function() {
    'use strict';
    
    /**
     * Converts Quill Delta format to HTML
     * @param {Object} delta - Quill Delta object with ops array
     * @returns {string} HTML string representation
     */
    function deltaToHtml(delta) {
        if (!delta || !delta.ops) return '';
        
        let html = '';
        
        for (const op of delta.ops) {
            if (typeof op.insert === 'string') {
                let text = op.insert.replace(/\n/g, ''); // Remove newlines
                
                if (op.attributes) {
                    if (op.attributes.bold) text = `<strong>${text}</strong>`;
                    if (op.attributes.italic) text = `<em>${text}</em>`;
                    if (op.attributes.underline) text = `<u>${text}</u>`;
                    if (op.attributes.script === 'sub') text = `<sub>${text}</sub>`;
                    if (op.attributes.script === 'super') text = `<sup>${text}</sup>`;
                }
                
                html += text;
            }
        }
        
        return html.trim();
    }
    
    /**
     * Converts internal answer format (option1, option2, etc.) to letter format (A, B, etc.)
     * @param {string} internalAnswer - Internal format like 'option1'
     * @returns {string} Letter format like 'A'
     */
    function convertInternalToLetter(internalAnswer) {
        const mapping = {
            'option1': 'A',
            'option2': 'B', 
            'option3': 'C',
            'option4': 'D',
            'option5': 'E',
            'option6': 'F'
        };
        return mapping[internalAnswer] || 'A';
    }
    
    /**
     * Converts letter answer format (A, B, etc.) to internal format (option1, option2, etc.)
     * @param {string} letter - Letter format like 'A'
     * @returns {string} Internal format like 'option1'
     */
    function convertLetterToInternal(letter) {
        const mapping = {
            'A': 'option1',
            'B': 'option2',
            'C': 'option3', 
            'D': 'option4',
            'E': 'option5',
            'F': 'option6'
        };
        return mapping[letter] || 'option1';
    }
    
    /**
     * Gets letter representation for a numeric index
     * @param {number} index - Zero-based index
     * @returns {string} Letter (A for 0, B for 1, etc.)
     */
    function getLetterForIndex(index) {
        return String.fromCharCode(65 + index); // A=65, B=66, etc.
    }
    
    /**
     * Creates backward compatible question format
     * Converts between old format (option1, option2) and new format (options.A, options.B)
     * @param {Object} question - Question object in either format
     * @returns {Object} Question object with both formats for compatibility
     */
    function createBackwardCompatibleQuestion(question) {
        // Convert new format to old format for backward compatibility
        if (question.options && question.questionType) {
            // New format - convert to old for internal use
            const options = question.options;
            return {
                ...question,
                option1: options.A || '',
                option2: options.B || '',
                option3: options.C || '',
                option4: options.D || '',
                option5: options.E || '',
                option6: options.F || '',
                correctAnswer: convertLetterToInternal(question.correctAnswer)
            };
        } else if (question.option1) {
            // Old format - convert to new
            const optionCount = [question.option1, question.option2, question.option3, question.option4, question.option5, question.option6]
                .filter(opt => opt && opt.trim()).length;
            
            const options = {};
            if (question.option1) options.A = question.option1;
            if (question.option2) options.B = question.option2;
            if (question.option3) options.C = question.option3;
            if (question.option4) options.D = question.option4;
            if (question.option5) options.E = question.option5;
            if (question.option6) options.F = question.option6;
            
            return {
                ...question,
                questionType: question.questionType || "multiple-choice",
                optionCount: optionCount,
                options: options,
                correctAnswer: convertInternalToLetter(question.correctAnswer)
            };
        }
        return question;
    }
    
    /**
     * Extracts image extension from image path or data URL
     * @param {string} imagePath - Image path or data URL
     * @returns {string} Image extension (jpg, png, gif, webp)
     */
    function getImageExtension(imagePath) {
        if (!imagePath) return 'jpg';
        if (imagePath.startsWith('data:image/')) {
            const match = imagePath.match(/data:image\/([^;]+)/);
            let ext = match ? match[1] : 'jpg';
            // Convert jpeg to jpg for consistency
            return ext === 'jpeg' ? 'jpg' : ext;
        }
        const ext = imagePath.split('.').pop().toLowerCase();
        // Convert jpeg to jpg for consistency
        const normalizedExt = ext === 'jpeg' ? 'jpg' : ext;
        return ['jpg', 'png', 'gif', 'webp'].includes(normalizedExt) ? normalizedExt : 'jpg';
    }
    
    /**
     * Generates a unique quiz ID
     * @returns {string} The generated quiz ID
     */
    function generateQuizId() {
        return 'quiz-' + Math.floor(Math.random() * 1000000);
    }
    
    /**
     * Gets color code for difficulty level
     * @param {string} difficulty - Difficulty level (easy, medium, hard)
     * @returns {string} Hex color code
     */
    function getDifficultyColor(difficulty) {
        switch(difficulty) {
            case 'easy': return '#27ae60';
            case 'medium': return '#f39c12';
            case 'hard': return '#e74c3c';
            default: return '#95a5a6';
        }
    }
    
    /**
     * Gets emoji/symbol for difficulty level
     * @param {string} difficulty - Difficulty level (easy, medium, hard)
     * @returns {string} Emoji or symbol
     */
    function getDifficultyEmoji(difficulty) {
        switch(difficulty) {
            case 'easy': return '✓';
            case 'medium': return '⚡';
            case 'hard': return '⭐';
            default: return '•';
        }
    }
    
    /**
     * Generates option display HTML
     * @param {Object} question - Question object
     * @returns {string} HTML string with formatted options
     */
    function generateOptionDisplayHTML(question) {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const optionCount = question.optionCount || 4;
        let html = '';
        
        for (let i = 0; i < optionCount; i++) {
            const letter = letters[i];
            const optionValue = question.options?.[letter] || question[`option${i+1}`] || '';
            html += `<span><strong>${letter})</strong> ${optionValue}</span>`;
        }
        
        return html;
    }
    
    // Register this module with the loader
    if (window.QuizModules.Loader) {
        window.QuizModules.Loader.registerModule('Utils', '1.4.0');
    }
    
    // Public API
    return {
        deltaToHtml: deltaToHtml,
        convertInternalToLetter: convertInternalToLetter,
        convertLetterToInternal: convertLetterToInternal,
        getLetterForIndex: getLetterForIndex,
        createBackwardCompatibleQuestion: createBackwardCompatibleQuestion,
        getImageExtension: getImageExtension,
        generateQuizId: generateQuizId,
        getDifficultyColor: getDifficultyColor,
        getDifficultyEmoji: getDifficultyEmoji,
        generateOptionDisplayHTML: generateOptionDisplayHTML
    };
})();