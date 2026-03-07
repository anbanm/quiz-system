/**
 * Quiz Plugin/Extension System
 * Provides a foundation for extending quiz functionality via plugins
 * Part of Phase 4 - Enterprise & Scale (v5.0)
 *
 * Uses global namespace pattern for offline-first compatibility
 */

window.QuizModules = window.QuizModules || {};

window.QuizModules.Plugins = (function() {
    'use strict';

    var registry = {};
    var hooks = {};
    var pluginOrder = [];

    /**
     * Register a plugin
     * @param {string} name - Plugin name
     * @param {Object} plugin - Plugin definition
     * @returns {boolean} Success
     */
    function register(name, plugin) {
        if (!name || !plugin) return false;
        if (registry[name]) {
            console.warn('[Plugins] Plugin "' + name + '" already registered');
            return false;
        }

        var pluginDef = {
            name: name,
            version: plugin.version || '1.0.0',
            description: plugin.description || '',
            author: plugin.author || 'Unknown',
            dependencies: plugin.dependencies || [],
            hooks: plugin.hooks || {},
            api: plugin.api || {},
            init: plugin.init || function() {},
            destroy: plugin.destroy || function() {},
            enabled: true,
            registeredAt: new Date().toISOString()
        };

        // Check dependencies
        for (var i = 0; i < pluginDef.dependencies.length; i++) {
            if (!registry[pluginDef.dependencies[i]]) {
                console.error('[Plugins] Missing dependency "' + pluginDef.dependencies[i] + '" for plugin "' + name + '"');
                return false;
            }
        }

        registry[name] = pluginDef;
        pluginOrder.push(name);

        // Register hooks
        var hookNames = Object.keys(pluginDef.hooks);
        for (var j = 0; j < hookNames.length; j++) {
            addHook(hookNames[j], pluginDef.hooks[hookNames[j]], name);
        }

        console.log('[Plugins] Registered: ' + name + ' v' + pluginDef.version);
        return true;
    }

    /**
     * Unregister a plugin
     * @param {string} name - Plugin name
     */
    function unregister(name) {
        if (!registry[name]) return;

        // Call destroy
        try { registry[name].destroy(); } catch (e) { /* ignore */ }

        // Remove hooks
        var hookNames = Object.keys(hooks);
        for (var i = 0; i < hookNames.length; i++) {
            hooks[hookNames[i]] = hooks[hookNames[i]].filter(function(h) { return h.plugin !== name; });
        }

        delete registry[name];
        pluginOrder = pluginOrder.filter(function(n) { return n !== name; });
    }

    /**
     * Add a hook handler
     * @param {string} hookName - Hook point name
     * @param {Function} handler - Hook handler function
     * @param {string} pluginName - Plugin name
     */
    function addHook(hookName, handler, pluginName) {
        if (!hooks[hookName]) hooks[hookName] = [];
        hooks[hookName].push({
            handler: handler,
            plugin: pluginName,
            priority: 10
        });
        // Sort by priority
        hooks[hookName].sort(function(a, b) { return a.priority - b.priority; });
    }

    /**
     * Execute all handlers for a hook
     * @param {string} hookName - Hook point name
     * @param {*} data - Data to pass through hooks
     * @returns {*} Modified data
     */
    function executeHook(hookName, data) {
        if (!hooks[hookName]) return data;

        var result = data;
        for (var i = 0; i < hooks[hookName].length; i++) {
            var hook = hooks[hookName][i];
            // Check if plugin is enabled
            if (registry[hook.plugin] && !registry[hook.plugin].enabled) continue;

            try {
                var hookResult = hook.handler(result);
                if (hookResult !== undefined) result = hookResult;
            } catch (e) {
                console.error('[Plugins] Hook error in "' + hook.plugin + '" for hook "' + hookName + '":', e);
            }
        }
        return result;
    }

    /**
     * Initialize all registered plugins
     */
    function initAll() {
        for (var i = 0; i < pluginOrder.length; i++) {
            var name = pluginOrder[i];
            if (registry[name] && registry[name].enabled) {
                try {
                    registry[name].init();
                    console.log('[Plugins] Initialized: ' + name);
                } catch (e) {
                    console.error('[Plugins] Failed to initialize "' + name + '":', e);
                }
            }
        }
    }

    /**
     * Enable/disable a plugin
     * @param {string} name - Plugin name
     * @param {boolean} enabled
     */
    function setEnabled(name, enabled) {
        if (registry[name]) registry[name].enabled = enabled;
    }

    /**
     * Get list of all registered plugins
     * @returns {Array}
     */
    function list() {
        return pluginOrder.map(function(name) {
            var p = registry[name];
            return {
                name: p.name,
                version: p.version,
                description: p.description,
                author: p.author,
                enabled: p.enabled
            };
        });
    }

    /**
     * Get a plugin's API
     * @param {string} name - Plugin name
     * @returns {Object|null} Plugin API
     */
    function getAPI(name) {
        return registry[name] ? registry[name].api : null;
    }

    /**
     * Available hook points in the quiz system
     */
    var HOOK_POINTS = {
        // Quiz creation hooks
        'beforeQuestionAdd': 'Called before a question is added to a quiz',
        'afterQuestionAdd': 'Called after a question is added',
        'beforeQuizSave': 'Called before quiz is saved/exported',
        'afterQuizSave': 'Called after quiz is saved/exported',
        'beforeQuizLoad': 'Called before a quiz is loaded',
        'afterQuizLoad': 'Called after a quiz is loaded',

        // Quiz taking hooks
        'beforeQuizStart': 'Called before quiz begins',
        'afterQuizSubmit': 'Called after quiz is submitted',
        'beforeAnswer': 'Called before an answer is recorded',
        'afterAnswer': 'Called after an answer is recorded',

        // Rendering hooks
        'renderQuestion': 'Called when rendering a question',
        'renderOptions': 'Called when rendering answer options',
        'renderResults': 'Called when rendering results',

        // Data hooks
        'transformExport': 'Called to transform data before export',
        'transformImport': 'Called to transform data on import'
    };

    // Register module
    if (window.QuizModules.Loader) {
        window.QuizModules.Loader.registerModule('Plugins', '5.0.0');
    }

    return {
        register: register,
        unregister: unregister,
        addHook: addHook,
        executeHook: executeHook,
        initAll: initAll,
        setEnabled: setEnabled,
        list: list,
        getAPI: getAPI,
        HOOK_POINTS: HOOK_POINTS
    };
})();
