/**
 * Quiz Security Module
 * Handles XSS prevention, JSON validation, localStorage quota, and CSP
 * Part of Phase 1 - Core Modernization (v2.0)
 *
 * Uses global namespace pattern for offline-first compatibility
 */

// Create namespace if it doesn't exist
window.QuizModules = window.QuizModules || {};

// Define the security module
window.QuizModules.Security = (function() {
    'use strict';

    // Allowed HTML tags and attributes for sanitization
    const ALLOWED_TAGS = [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'sub', 'sup',
        'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
        'img', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ];

    const ALLOWED_ATTRS = {
        '*': ['class', 'style', 'id', 'title'],
        'a': ['href', 'target', 'rel'],
        'img': ['src', 'alt', 'width', 'height'],
        'span': ['class', 'style'],
        'td': ['colspan', 'rowspan'],
        'th': ['colspan', 'rowspan']
    };

    // Dangerous patterns to strip
    const DANGEROUS_PATTERNS = [
        /javascript\s*:/gi,
        /on\w+\s*=/gi,
        /data\s*:\s*text\/html/gi,
        /vbscript\s*:/gi,
        /expression\s*\(/gi
    ];

    /**
     * Sanitize HTML string to prevent XSS attacks
     * Lightweight DOMPurify alternative for offline use
     * @param {string} dirty - Untrusted HTML string
     * @param {Object} options - Sanitization options
     * @returns {string} Sanitized HTML string
     */
    function sanitizeHTML(dirty) {
        if (!dirty || typeof dirty !== 'string') return '';

        // Create a temporary DOM element for parsing
        const temp = document.createElement('div');
        temp.innerHTML = dirty;

        // Recursively sanitize all nodes
        sanitizeNode(temp);

        return temp.innerHTML;
    }

    /**
     * Recursively sanitize a DOM node
     * @param {Node} node - DOM node to sanitize
     */
    function sanitizeNode(node) {
        const children = Array.from(node.childNodes);

        for (const child of children) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                const tagName = child.tagName.toLowerCase();

                // Remove disallowed tags
                if (!ALLOWED_TAGS.includes(tagName)) {
                    // Keep text content, remove the element
                    const textNode = document.createTextNode(child.textContent);
                    node.replaceChild(textNode, child);
                    continue;
                }

                // Remove disallowed attributes
                const allowedForTag = [
                    ...(ALLOWED_ATTRS['*'] || []),
                    ...(ALLOWED_ATTRS[tagName] || [])
                ];

                const attrs = Array.from(child.attributes);
                for (const attr of attrs) {
                    if (!allowedForTag.includes(attr.name.toLowerCase())) {
                        child.removeAttribute(attr.name);
                        continue;
                    }

                    // Check attribute values for dangerous patterns
                    let value = attr.value;
                    for (const pattern of DANGEROUS_PATTERNS) {
                        if (pattern.test(value)) {
                            child.removeAttribute(attr.name);
                            break;
                        }
                    }
                }

                // Special handling for href and src
                if (child.hasAttribute('href')) {
                    const href = child.getAttribute('href');
                    if (href && !/^(https?:\/\/|mailto:|#|\/)/i.test(href)) {
                        child.removeAttribute('href');
                    }
                }
                if (child.hasAttribute('src')) {
                    const src = child.getAttribute('src');
                    if (src && !/^(https?:\/\/|data:image\/|\/)/i.test(src)) {
                        child.removeAttribute('src');
                    }
                }

                // Recurse into children
                sanitizeNode(child);
            } else if (child.nodeType === Node.COMMENT_NODE) {
                // Remove comments
                node.removeChild(child);
            }
        }
    }

    /**
     * Escape HTML entities for safe text display
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    function escapeHTML(text) {
        if (!text || typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    // JSON Schema definitions for quiz data
    const QUIZ_SCHEMA = {
        type: 'object',
        required: ['tests'],
        properties: {
            tests: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['testName', 'questions'],
                    properties: {
                        testName: { type: 'string', maxLength: 500 },
                        testID: { type: 'string', maxLength: 100 },
                        testId: { type: 'string', maxLength: 100 },
                        questions: {
                            type: 'array',
                            maxItems: 5000,
                            items: {
                                type: 'object',
                                required: ['question'],
                                properties: {
                                    question: { type: 'string', maxLength: 10000 },
                                    correctAnswer: { type: 'string', maxLength: 20 },
                                    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
                                    points: { type: 'number', min: 0, max: 1000 }
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    /**
     * Validate JSON data against quiz schema
     * @param {Object} data - Parsed JSON data to validate
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    function validateQuizJSON(data) {
        const errors = [];

        if (!data || typeof data !== 'object') {
            return { valid: false, errors: ['Data must be a valid object'] };
        }

        if (!data.tests || !Array.isArray(data.tests)) {
            return { valid: false, errors: ['Missing or invalid "tests" array'] };
        }

        if (data.tests.length === 0) {
            return { valid: false, errors: ['Tests array is empty'] };
        }

        if (data.tests.length > 100) {
            errors.push('Warning: Very large number of tests (>100)');
        }

        for (let i = 0; i < data.tests.length; i++) {
            const test = data.tests[i];

            if (!test.testName || typeof test.testName !== 'string') {
                errors.push(`Test ${i + 1}: Missing or invalid testName`);
            } else if (test.testName.length > 500) {
                errors.push(`Test ${i + 1}: testName exceeds 500 characters`);
            }

            if (!test.questions || !Array.isArray(test.questions)) {
                errors.push(`Test ${i + 1}: Missing or invalid questions array`);
                continue;
            }

            if (test.questions.length > 5000) {
                errors.push(`Test ${i + 1}: Exceeds 5000 question limit`);
            }

            for (let j = 0; j < test.questions.length; j++) {
                const q = test.questions[j];

                if (!q.question && !q.questionHtml) {
                    errors.push(`Test ${i + 1}, Q${j + 1}: Missing question text`);
                }

                if (q.points !== undefined && (typeof q.points !== 'number' || q.points < 0 || q.points > 1000)) {
                    errors.push(`Test ${i + 1}, Q${j + 1}: Invalid points value`);
                }
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Validate file upload (MIME type, size limits)
     * @param {File} file - File to validate
     * @param {Object} options - Validation options
     * @returns {Object} { valid: boolean, error: string|null }
     */
    function validateFileUpload(file, options = {}) {
        const {
            maxSize = 50 * 1024 * 1024, // 50MB default
            allowedTypes = ['application/json', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/zip'],
            allowedExtensions = ['.json', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.zip']
        } = options;

        if (!file) {
            return { valid: false, error: 'No file provided' };
        }

        // Check file size
        if (file.size > maxSize) {
            const maxMB = Math.round(maxSize / (1024 * 1024));
            return { valid: false, error: `File size (${Math.round(file.size / (1024 * 1024))}MB) exceeds ${maxMB}MB limit` };
        }

        // Check MIME type
        if (file.type && !allowedTypes.includes(file.type)) {
            return { valid: false, error: `File type "${file.type}" is not allowed` };
        }

        // Check extension
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            return { valid: false, error: `File extension "${ext}" is not allowed` };
        }

        return { valid: true, error: null };
    }

    /**
     * Safe localStorage wrapper with quota handling
     */
    const safeStorage = {
        /**
         * Get item from localStorage with error handling
         * @param {string} key - Storage key
         * @returns {string|null} Stored value or null
         */
        getItem: function(key) {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                console.warn('localStorage.getItem failed:', e.message);
                return null;
            }
        },

        /**
         * Set item in localStorage with quota handling
         * @param {string} key - Storage key
         * @param {string} value - Value to store
         * @returns {boolean} Success status
         */
        setItem: function(key, value) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
                    console.error('localStorage quota exceeded');

                    // Try to free space by removing old data
                    if (tryFreeSpace(key)) {
                        try {
                            localStorage.setItem(key, value);
                            return true;
                        } catch (e2) {
                            console.error('Still cannot save after freeing space');
                        }
                    }

                    // Notify user via toast if available
                    if (window.QuizModules && window.QuizModules.Toast) {
                        window.QuizModules.Toast.show(
                            'Storage space is full. Some data may not be saved. Consider exporting your quizzes.',
                            'error',
                            8000
                        );
                    }
                    return false;
                }
                console.error('localStorage.setItem failed:', e.message);
                return false;
            }
        },

        /**
         * Remove item from localStorage
         * @param {string} key - Storage key
         */
        removeItem: function(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn('localStorage.removeItem failed:', e.message);
            }
        },

        /**
         * Get estimated storage usage
         * @returns {Object} { used: number, total: number, percentage: number }
         */
        getUsage: function() {
            try {
                let used = 0;
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    used += (key.length + localStorage.getItem(key).length) * 2; // UTF-16
                }
                const total = 5 * 1024 * 1024; // 5MB typical limit
                return {
                    used: used,
                    total: total,
                    percentage: Math.round((used / total) * 100)
                };
            } catch (e) {
                return { used: 0, total: 0, percentage: 0 };
            }
        }
    };

    /**
     * Try to free localStorage space
     * @param {string} protectedKey - Key to protect from deletion
     * @returns {boolean} Whether space was freed
     */
    function tryFreeSpace(protectedKey) {
        try {
            // Remove auto-save drafts first (least important)
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key !== protectedKey && (key.startsWith('quiz-autosave-') || key.startsWith('quiz-draft-'))) {
                    keysToRemove.push(key);
                }
            }

            if (keysToRemove.length > 0) {
                keysToRemove.forEach(key => localStorage.removeItem(key));
                return true;
            }

            return false;
        } catch (e) {
            return false;
        }
    }

    /**
     * Generate a Content-Security-Policy meta tag value
     * @returns {string} CSP policy string
     */
    function getCSPPolicy() {
        return [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Needed for Quill.js
            "style-src 'self' 'unsafe-inline'", // Needed for inline styles
            "img-src 'self' data: blob:",
            "font-src 'self'",
            "connect-src 'self'",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'"
        ].join('; ');
    }

    /**
     * Apply CSP meta tag to current document
     */
    function applyCSP() {
        // Check if CSP meta tag already exists
        const existing = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (existing) return;

        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = getCSPPolicy();
        document.head.appendChild(meta);
    }

    // Register this module with the loader
    if (window.QuizModules.Loader) {
        window.QuizModules.Loader.registerModule('Security', '2.0.0');
    }

    // Public API
    return {
        sanitizeHTML: sanitizeHTML,
        escapeHTML: escapeHTML,
        validateQuizJSON: validateQuizJSON,
        validateFileUpload: validateFileUpload,
        safeStorage: safeStorage,
        getCSPPolicy: getCSPPolicy,
        applyCSP: applyCSP
    };
})();
