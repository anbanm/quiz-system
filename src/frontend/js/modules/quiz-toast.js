/**
 * Quiz Toast Notification Module
 * Replaces alert() dialogs with modern toast notifications
 * Part of Phase 1 - Core Modernization (v2.0)
 *
 * Uses global namespace pattern for offline-first compatibility
 */

window.QuizModules = window.QuizModules || {};

window.QuizModules.Toast = (function() {
    'use strict';

    let container = null;
    let toastQueue = [];
    let toastCount = 0;
    const MAX_TOASTS = 5;

    /**
     * Initialize the toast container
     */
    function init() {
        if (container) return;
        container = document.createElement('div');
        container.id = 'quiz-toast-container';
        container.setAttribute('role', 'alert');
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const ICONS = {
        success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/><path d="M6 10l3 3 5-5" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
        error: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/><path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" stroke-width="2"/></svg>',
        warning: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L1 18h18L10 2z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M10 8v4M10 14v1" stroke="currentColor" stroke-width="2"/></svg>',
        info: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/><path d="M10 6v1M10 9v5" stroke="currentColor" stroke-width="2"/></svg>'
    };

    const COLORS = {
        success: { bg: '#d4edda', border: '#28a745', text: '#155724', icon: '#28a745' },
        error: { bg: '#f8d7da', border: '#dc3545', text: '#721c24', icon: '#dc3545' },
        warning: { bg: '#fff3cd', border: '#ffc107', text: '#856404', icon: '#856404' },
        info: { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460', icon: '#17a2b8' }
    };

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type: success, error, warning, info
     * @param {number} duration - Duration in ms (0 for persistent)
     * @param {Object} options - Additional options
     * @returns {HTMLElement} Toast element
     */
    function show(message, type, duration, options) {
        type = type || 'info';
        duration = duration !== undefined ? duration : 4000;
        options = options || {};

        init();

        // Limit toast count
        if (container.children.length >= MAX_TOASTS) {
            const oldest = container.firstElementChild;
            if (oldest) dismiss(oldest);
        }

        const id = 'toast-' + (++toastCount);
        const colors = COLORS[type] || COLORS.info;
        const icon = ICONS[type] || ICONS.info;

        const toast = document.createElement('div');
        toast.id = id;
        toast.setAttribute('role', 'status');
        toast.style.cssText = `
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 14px 18px;
            background: ${colors.bg};
            border: 1px solid ${colors.border};
            border-left: 4px solid ${colors.border};
            border-radius: 8px;
            color: ${colors.text};
            font-size: 14px;
            line-height: 1.5;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            pointer-events: auto;
            animation: toastSlideIn 0.3s ease;
            transition: opacity 0.3s ease, transform 0.3s ease;
            max-width: 100%;
            word-break: break-word;
        `;

        toast.innerHTML = `
            <span style="color: ${colors.icon}; flex-shrink: 0; margin-top: 1px;">${icon}</span>
            <span style="flex: 1;">${window.QuizModules.Security ? window.QuizModules.Security.escapeHTML(message) : message}</span>
            <button onclick="window.QuizModules.Toast.dismiss(this.parentElement)" style="
                background: none;
                border: none;
                color: ${colors.text};
                cursor: pointer;
                font-size: 18px;
                padding: 0;
                margin: -4px -4px 0 0;
                opacity: 0.5;
                line-height: 1;
                width: auto;
                flex-shrink: 0;
            " aria-label="Dismiss notification">&times;</button>
        `;

        container.appendChild(toast);

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(function() { dismiss(toast); }, duration);
        }

        return toast;
    }

    /**
     * Dismiss a toast notification
     * @param {HTMLElement} toast - Toast element to dismiss
     */
    function dismiss(toast) {
        if (!toast || !toast.parentNode) return;
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(function() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }

    /**
     * Dismiss all toasts
     */
    function dismissAll() {
        if (!container) return;
        Array.from(container.children).forEach(dismiss);
    }

    /**
     * Convenience methods
     */
    function success(message, duration) { return show(message, 'success', duration); }
    function error(message, duration) { return show(message, 'error', duration || 6000); }
    function warning(message, duration) { return show(message, 'warning', duration || 5000); }
    function info(message, duration) { return show(message, 'info', duration); }

    // Register module
    if (window.QuizModules.Loader) {
        window.QuizModules.Loader.registerModule('Toast', '2.0.0');
    }

    return {
        show: show,
        dismiss: dismiss,
        dismissAll: dismissAll,
        success: success,
        error: error,
        warning: warning,
        info: info,
        init: init
    };
})();
