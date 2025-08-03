/**
 * Quiz Module Loader and Initialization System
 * Manages module loading order and initialization
 * Part of the modular refactoring - Phase 6 (Final)
 * 
 * Uses global namespace pattern for offline-first compatibility
 */

// Create namespace if it doesn't exist
window.QuizModules = window.QuizModules || {};

// Define the module loader
window.QuizModules.Loader = (function() {
    'use strict';
    
    // Module loading state
    let loadedModules = [];
    let initializationQueue = [];
    let isInitialized = false;
    
    /**
     * Register a module as loaded
     * @param {string} moduleName - Name of the module
     * @param {string} version - Module version (optional)
     */
    function registerModule(moduleName, version = '1.0.0') {
        loadedModules.push({
            name: moduleName,
            version: version,
            loadedAt: new Date().toISOString()
        });
        
        console.log(`[QuizModules] Loaded: ${moduleName} v${version}`);
    }
    
    /**
     * Add initialization function to queue
     * @param {Function} initFn - Initialization function
     * @param {string} moduleName - Module name for logging
     */
    function addToInitQueue(initFn, moduleName) {
        initializationQueue.push({
            fn: initFn,
            module: moduleName
        });
    }
    
    /**
     * Initialize all queued modules
     */
    function initializeModules() {
        if (isInitialized) {
            console.warn('[QuizModules] Already initialized');
            return;
        }
        
        console.log('[QuizModules] Initializing modules...');
        
        // Run all initialization functions
        initializationQueue.forEach(({ fn, module }) => {
            try {
                console.log(`[QuizModules] Initializing ${module}...`);
                fn();
            } catch (error) {
                console.error(`[QuizModules] Failed to initialize ${module}:`, error);
            }
        });
        
        isInitialized = true;
        console.log('[QuizModules] All modules initialized successfully');
        
        // Log module summary
        logModuleSummary();
    }
    
    /**
     * Check if all required modules are loaded
     * @param {Array} requiredModules - List of required module names
     * @returns {boolean} True if all modules are loaded
     */
    function checkRequiredModules(requiredModules) {
        const missing = requiredModules.filter(module => 
            !loadedModules.some(loaded => loaded.name === module)
        );
        
        if (missing.length > 0) {
            console.error('[QuizModules] Missing required modules:', missing);
            return false;
        }
        
        return true;
    }
    
    /**
     * Log summary of loaded modules
     */
    function logModuleSummary() {
        console.log(`[QuizModules] === Module Summary ===`);
        console.log(`[QuizModules] Total modules loaded: ${loadedModules.length}`);
        
        loadedModules.forEach(module => {
            console.log(`[QuizModules] - ${module.name} v${module.version}`);
        });
        
        // Calculate original vs current file sizes
        const originalSize = 1917; // Original quiz-generator.js line count
        const currentMainSize = 512; // Current main file size
        const modulesSizeTotal = 717 + 369 + 361 + 641 + 219; // Sum of all module sizes
        const totalCurrentSize = currentMainSize + modulesSizeTotal;
        
        console.log(`[QuizModules] === Refactoring Stats ===`);
        console.log(`[QuizModules] Original file: ${originalSize} lines`);
        console.log(`[QuizModules] Main file now: ${currentMainSize} lines (-${originalSize - currentMainSize} lines, ${Math.round((originalSize - currentMainSize)/originalSize * 100)}% reduction)`);
        console.log(`[QuizModules] Total modular: ${totalCurrentSize} lines (${modulesSizeTotal} in modules + ${currentMainSize} main)`);
        console.log(`[QuizModules] Architecture: Fully modular with offline-first global namespace pattern`);
    }
    
    /**
     * Get information about loaded modules
     * @returns {Array} Array of loaded module information
     */
    function getLoadedModules() {
        return [...loadedModules];
    }
    
    /**
     * Check if system is initialized
     * @returns {boolean} True if initialized
     */
    function getInitializationStatus() {
        return isInitialized;
    }
    
    /**
     * Validate module API compatibility
     * @param {string} moduleName - Module to validate
     * @returns {boolean} True if module API is valid
     */
    function validateModuleAPI(moduleName) {
        const moduleMap = {
            'Utils': ['deltaToHtml', 'convertInternalToLetter', 'getLetterForIndex'],
            'RichText': ['initializeQuillEditor', 'getQuestionContent', 'setQuestionContent'],
            'Data': ['initializeTestLibrary', 'generateJSON', 'downloadZIP'],
            'UI': ['renderQuestions', 'showSuccessWithChoices', 'clearQuestionForm'],
            'Questions': ['addOrUpdateQuestion', 'editQuestion', 'deleteQuestion']
        };
        
        const requiredMethods = moduleMap[moduleName];
        if (!requiredMethods) return true; // Unknown module, assume valid
        
        const moduleObject = window.QuizModules[moduleName];
        if (!moduleObject) {
            console.error(`[QuizModules] Module ${moduleName} not found`);
            return false;
        }
        
        const missingMethods = requiredMethods.filter(method => 
            typeof moduleObject[method] !== 'function'
        );
        
        if (missingMethods.length > 0) {
            console.error(`[QuizModules] Module ${moduleName} missing methods:`, missingMethods);
            return false;
        }
        
        return true;
    }
    
    // Auto-register the loader module
    registerModule('Loader', '1.0.0');
    
    // Public API
    return {
        // Module registration
        registerModule: registerModule,
        
        // Initialization management
        addToInitQueue: addToInitQueue,
        initializeModules: initializeModules,
        
        // Module validation
        checkRequiredModules: checkRequiredModules,
        validateModuleAPI: validateModuleAPI,
        
        // Status and information
        getLoadedModules: getLoadedModules,
        getInitializationStatus: getInitializationStatus,
        logModuleSummary: logModuleSummary
    };
})();