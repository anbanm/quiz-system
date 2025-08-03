/**
 * Quiz Rich Text Editor Module
 * Handles all Quill.js integration for mathematical formulas and rich text
 * Part of the modular refactoring - Phase 2
 * 
 * Uses global namespace pattern for offline-first compatibility
 */

// Create namespace if it doesn't exist
window.QuizModules = window.QuizModules || {};

// Define the rich text module
window.QuizModules.RichText = (function() {
    'use strict';
    
    // Private variables
    let questionEditor = null;
    let optionEditors = [];
    
    /**
     * Initialize the main question Quill editor
     */
    function initializeQuillEditor() {
        if (questionEditor) return; // Already initialized
        
        questionEditor = new Quill('#question-editor', {
            theme: 'snow',
            placeholder: 'What is the capital of France?',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'script': 'sub'}, { 'script': 'super' }],
                    [{ 'header': [1, 2, false] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['clean']
                ]
            }
        });
        
        // Initialize option editors with minimal toolbar (just superscript/subscript)
        initializeOptionEditors();
    }
    
    /**
     * Initialize the option editors (A, B, C, D, E, F)
     */
    function initializeOptionEditors() {
        // Destroy existing editors first
        if (optionEditors && optionEditors.length > 0) {
            optionEditors.forEach(editor => {
                if (editor && editor.container) {
                    editor.container.remove();
                }
            });
        }
        
        optionEditors = []; // Clear existing editors
        
        const optionConfigs = [
            { editorId: 'option1-editor', toolbarId: 'option1-toolbar', placeholder: 'First answer option' },
            { editorId: 'option2-editor', toolbarId: 'option2-toolbar', placeholder: 'Second answer option' },
            { editorId: 'option3-editor', toolbarId: 'option3-toolbar', placeholder: 'Third answer option' },
            { editorId: 'option4-editor', toolbarId: 'option4-toolbar', placeholder: 'Fourth answer option' },
            { editorId: 'option5-editor', toolbarId: 'option5-toolbar', placeholder: 'Fifth answer option' },
            { editorId: 'option6-editor', toolbarId: 'option6-toolbar', placeholder: 'Sixth answer option' }
        ];
        
        optionConfigs.forEach((config, index) => {
            const container = document.getElementById(config.editorId);
            const toolbar = document.getElementById(config.toolbarId);
            
            if (!container) {
                console.error(`Container ${config.editorId} not found`);
                return;
            }
            
            if (!toolbar) {
                console.error(`Toolbar ${config.toolbarId} not found`);
                return;
            }
            
            // Clear any existing content
            container.innerHTML = '';
            
            try {
                const editor = new Quill(container, {
                    theme: 'snow',
                    placeholder: config.placeholder,
                    formats: ['bold', 'italic', 'underline', 'script'],
                    modules: {
                        toolbar: {
                            container: toolbar
                        },
                        keyboard: {
                            bindings: {
                                enter: {
                                    key: 'Enter',
                                    handler: function() {
                                        return false; // Disable Enter completely
                                    }
                                }
                            }
                        }
                    }
                });
                
                // Force the editor to start with plain text only
                editor.setContents([{ insert: '' }]);
                
                // Override getText to remove any newlines
                const originalGetText = editor.getText.bind(editor);
                editor.getText = function() {
                    return originalGetText().replace(/\n/g, '').trim();
                };
                
                // Store a custom getter for clean HTML
                editor.getCleanHTML = function() {
                    const editorElement = this.root.querySelector('.ql-editor');
                    if (!editorElement) return '';
                    let html = editorElement.innerHTML;
                    
                    // If the content is just plain text in a paragraph, extract it
                    if (html.match(/^<p[^>]*>([^<]*)<\/p>$/)) {
                        html = html.replace(/<p[^>]*>([^<]*)<\/p>/, '$1');
                    }
                    // Remove empty paragraphs and line breaks, but preserve formatting tags
                    html = html.replace(/<p[^>]*><\/p>/g, '').replace(/<br[^>]*>/g, '');
                    
                    // Only remove paragraph tags if they don't contain formatting
                    if (!html.includes('<') || html.match(/^<p[^>]*>.*<\/p>$/)) {
                        html = html.replace(/<\/?p[^>]*>/g, '');
                    }
                    
                    return html.trim();
                };
                
                // Add debug logging
                console.log(`Initialized editor ${index} for ${config.editorId} with toolbar ${config.toolbarId}`);
                
                optionEditors.push(editor);
            } catch (error) {
                console.error(`Failed to initialize editor for ${config.editorId}:`, error);
            }
        });
        
        console.log(`Total option editors initialized: ${optionEditors.length}`);
    }
    
    /**
     * Get the question editor instance
     * @returns {Object} Quill editor instance
     */
    function getQuestionEditor() {
        return questionEditor;
    }
    
    /**
     * Get the option editors array
     * @returns {Array} Array of Quill editor instances
     */
    function getOptionEditors() {
        return optionEditors;
    }
    
    /**
     * Clear the question editor
     */
    function clearQuestionEditor() {
        if (questionEditor) {
            questionEditor.setText('');
        }
    }
    
    /**
     * Clear all option editors
     */
    function clearOptionEditors() {
        if (optionEditors && optionEditors.length >= 6) {
            optionEditors.forEach(editor => {
                editor.setText('');
            });
        }
    }
    
    /**
     * Set question content from different formats
     * @param {Object} question - Question object with delta, html, or text
     */
    function setQuestionContent(question) {
        if (!questionEditor) return;
        
        if (question.questionDelta) {
            // Load rich content from Delta format
            questionEditor.setContents(question.questionDelta);
        } else if (question.questionHtml) {
            // Fallback to HTML
            questionEditor.root.innerHTML = question.questionHtml;
        } else {
            // Fallback to plain text
            questionEditor.setText(question.question || '');
        }
    }
    
    /**
     * Get question content in all formats
     * @returns {Object} Object with text, html, and delta formats
     */
    function getQuestionContent() {
        if (!questionEditor) return { text: '', html: '', delta: null };
        
        return {
            text: questionEditor.getText().trim(),
            html: questionEditor.root.innerHTML,
            delta: questionEditor.getContents()
        };
    }
    
    /**
     * Set option content for editing
     * @param {Object} question - Question object with option data
     */
    function setOptionContent(question) {
        if (!optionEditors || optionEditors.length < 6) return;
        
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        
        for (let i = 0; i < 6; i++) {
            // Check for rich text option data first
            if (question.optionsDelta && question.optionsDelta[letters[i]]) {
                const optionDelta = question.optionsDelta[letters[i]];
                optionEditors[i].setContents(optionDelta);
            } else if (question.optionsHtml && question.optionsHtml[letters[i]]) {
                const optionHtml = question.optionsHtml[letters[i]];
                optionEditors[i].root.innerHTML = optionHtml;
            } else if (question.options && question.options[letters[i]]) {
                // New plain text format
                const optionText = question.options[letters[i]];
                optionEditors[i].setText(optionText);
            } else {
                // Old format fallback
                const optionText = question[`option${i + 1}`] || '';
                optionEditors[i].setText(optionText);
            }
        }
    }
    
    /**
     * Get option content in all formats
     * @returns {Array} Array of option data with text, html, and delta
     */
    function getOptionContent() {
        if (!optionEditors || optionEditors.length < 6) {
            return Array(6).fill({ text: '', html: '', delta: { ops: [] } });
        }
        
        return optionEditors.map(editor => {
            if (!editor) {
                return { text: '', html: '', delta: { ops: [] } };
            }
            
            const text = editor.getText().replace(/\n/g, '').trim();
            
            // Get HTML by manually converting Delta to HTML
            let html = '';
            try {
                const delta = editor.getContents();
                html = window.QuizModules.Utils.deltaToHtml(delta);
                console.log(`Option HTML extraction - Text: "${text}", HTML: "${html}"`);
            } catch (e) {
                console.error('HTML extraction failed:', e);
                html = text; // Fallback to plain text
            }
            
            // Final fallback to plain text if HTML is empty
            if (!html) {
                html = text;
            }
            
            // Clean up delta - remove newlines and paragraph formatting
            const delta = editor.getContents();
            if (delta.ops) {
                delta.ops = delta.ops.filter(op => op.insert !== '\n').map(op => {
                    if (typeof op.insert === 'string') {
                        op.insert = op.insert.replace(/\n/g, '');
                    }
                    return op;
                }).filter(op => op.insert !== '');
            }
            
            return { text, html, delta };
        });
    }
    
    /**
     * Focus on the question editor
     */
    function focusQuestionEditor() {
        if (questionEditor) {
            questionEditor.focus();
        }
    }
    
    /**
     * Handle question type changes (enable/disable editors for true/false)
     * @param {string} questionType - 'multiple-choice' or 'true-false'
     */
    function handleQuestionTypeChange(questionType) {
        if (!optionEditors || optionEditors.length < 2) return;
        
        if (questionType === 'true-false') {
            // True/False questions should ALWAYS have "True" and "False" as options
            optionEditors[0].setText('True');
            optionEditors[1].setText('False');
            
            // Disable the option editors for true/false (make them read-only)
            optionEditors[0].disable();
            optionEditors[1].disable();
        } else if (questionType === 'multiple-choice') {
            // Enable all option editors for multiple choice
            optionEditors.forEach(editor => {
                editor.enable();
            });
        }
    }
    
    /**
     * Check if editors are properly initialized
     * @returns {boolean} True if both question and option editors are ready
     */
    function areEditorsReady() {
        return questionEditor !== null && optionEditors && optionEditors.length >= 6;
    }
    
    // Public API
    return {
        // Initialization
        initializeQuillEditor: initializeQuillEditor,
        initializeOptionEditors: initializeOptionEditors,
        
        // Getters
        getQuestionEditor: getQuestionEditor,
        getOptionEditors: getOptionEditors,
        
        // Question content management
        setQuestionContent: setQuestionContent,
        getQuestionContent: getQuestionContent,
        clearQuestionEditor: clearQuestionEditor,
        focusQuestionEditor: focusQuestionEditor,
        
        // Option content management
        setOptionContent: setOptionContent,
        getOptionContent: getOptionContent,
        clearOptionEditors: clearOptionEditors,
        
        // Question type handling
        handleQuestionTypeChange: handleQuestionTypeChange,
        
        // Status checks
        areEditorsReady: areEditorsReady
    };
})();