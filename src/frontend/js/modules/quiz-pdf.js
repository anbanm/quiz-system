/**
 * Quiz PDF Export Module
 * Handles PDF generation with standard templates for quizzes
 * Part of the modular refactoring - Phase 7 (PDF Export)
 * 
 * Uses global namespace pattern for offline-first compatibility
 * Requires jsPDF library for PDF generation
 */

// Create namespace if it doesn't exist
window.QuizModules = window.QuizModules || {};

// Define the PDF export module
window.QuizModules.PDF = (function() {
    'use strict';
    
    /**
     * Standard template configurations
     */
    const TEMPLATES = {
        STUDENT_QUIZ: {
            name: 'Student Quiz',
            description: 'Standard quiz format with A/B/C/D bubbles',
            showAnswers: false,
            showPoints: false,
            showDifficulty: false,
            bubbleStyle: 'circle'
        },
        ANSWER_KEY: {
            name: 'Teacher Answer Key', 
            description: 'Same layout with correct answers highlighted',
            showAnswers: true,
            showPoints: true,
            showDifficulty: true,
            bubbleStyle: 'filled'
        },
        PRACTICE_SHEET: {
            name: 'Practice Worksheet',
            description: 'Questions with larger answer spaces',
            showAnswers: false,
            showPoints: false,
            showDifficulty: false,
            bubbleStyle: 'none'
        }
    };
    
    /**
     * Page layout constants
     */
    const LAYOUT = {
        MARGIN: 20,
        PAGE_WIDTH: 210, // A4 width in mm
        PAGE_HEIGHT: 297, // A4 height in mm
        LINE_HEIGHT: 6,
        QUESTION_SPACING: 15,
        HEADER_HEIGHT: 30
    };
    
    /**
     * Generate PDF for student quiz
     * @param {Object} quizData - Quiz data with questions
     * @param {Object} options - Template options
     * @returns {Object} jsPDF document instance
     */
    function generateStudentQuiz(quizData, options = {}) {
        const template = { ...TEMPLATES.STUDENT_QUIZ, ...options };
        return generatePDF(quizData, template);
    }
    
    /**
     * Generate PDF for teacher answer key
     * @param {Object} quizData - Quiz data with questions
     * @param {Object} options - Template options
     * @returns {Object} jsPDF document instance
     */
    function generateAnswerKey(quizData, options = {}) {
        const template = { ...TEMPLATES.ANSWER_KEY, ...options };
        return generatePDF(quizData, template);
    }
    
    /**
     * Generate PDF for practice worksheet
     * @param {Object} quizData - Quiz data with questions
     * @param {Object} options - Template options
     * @returns {Object} jsPDF document instance
     */
    function generatePracticeSheet(quizData, options = {}) {
        const template = { ...TEMPLATES.PRACTICE_SHEET, ...options };
        return generatePDF(quizData, template);
    }
    
    /**
     * Main PDF generation function
     * @param {Object} quizData - Quiz data
     * @param {Object} template - Template configuration
     * @returns {Object} jsPDF document instance
     */
    function generatePDF(quizData, template) {
        // Check if jsPDF is available (v3.0.1+ uses window.jspdf.jsPDF)
        let jsPDF;
        if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
            jsPDF = window.jspdf.jsPDF;
        } else if (typeof window.jsPDF !== 'undefined') {
            jsPDF = window.jsPDF;
        } else {
            console.error('jsPDF detection failed. Available globals:', Object.keys(window).filter(k => k.toLowerCase().includes('pdf')));
            throw new Error('jsPDF library not loaded. Please include jspdf.min.js');
        }
        
        console.log('Using jsPDF:', jsPDF);
        const doc = new jsPDF();
        let currentY = LAYOUT.MARGIN;
        
        // Add header
        currentY = addHeader(doc, quizData, template, currentY);
        
        // Add student info section
        currentY = addStudentInfo(doc, template, currentY);
        
        // Add questions
        const questions = quizData.questions || [];
        for (let i = 0; i < questions.length; i++) {
            // Check if we need a new page
            if (currentY > LAYOUT.PAGE_HEIGHT - 50) {
                doc.addPage();
                currentY = LAYOUT.MARGIN;
            }
            
            currentY = addQuestion(doc, questions[i], i + 1, template, currentY);
        }
        
        // Add footer
        addFooter(doc, template);
        
        return doc;
    }
    
    /**
     * Add header to PDF
     * @param {Object} doc - jsPDF document
     * @param {Object} quizData - Quiz data
     * @param {Object} template - Template configuration
     * @param {number} y - Current Y position
     * @returns {number} New Y position
     */
    function addHeader(doc, quizData, template, y) {
        // Quiz title
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text(quizData.testName || 'Quiz', LAYOUT.MARGIN, y);
        y += 10;
        
        // Template type
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(template.name, LAYOUT.MARGIN, y);
        y += 5;
        
        // Quiz metadata for answer key
        if (template.showPoints) {
            const totalPoints = quizData.questions.reduce((sum, q) => sum + (q.points || 1), 0);
            const totalQuestions = quizData.questions.length;
            doc.text(`Total Questions: ${totalQuestions} | Total Points: ${totalPoints}`, LAYOUT.MARGIN, y);
            y += 5;
        }
        
        // Horizontal line
        doc.line(LAYOUT.MARGIN, y + 3, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN, y + 3);
        y += 10;
        
        return y;
    }
    
    /**
     * Add student info section
     * @param {Object} doc - jsPDF document
     * @param {Object} template - Template configuration
     * @param {number} y - Current Y position
     * @returns {number} New Y position
     */
    function addStudentInfo(doc, template, y) {
        if (template.showAnswers) {
            // Skip student info for answer key
            return y + 5;
        }
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        // Name and date fields
        const nameWidth = 80;
        const dateWidth = 50;
        
        doc.text('Name: ____________________________', LAYOUT.MARGIN, y);
        doc.text('Date: ______________', LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN - dateWidth, y);
        
        y += 15;
        return y;
    }
    
    /**
     * Add a single question to PDF
     * @param {Object} doc - jsPDF document
     * @param {Object} question - Question data
     * @param {number} questionNum - Question number
     * @param {Object} template - Template configuration
     * @param {number} y - Current Y position
     * @returns {number} New Y position
     */
    function addQuestion(doc, question, questionNum, template, y) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        
        // Question number and difficulty/points (for answer key)
        let questionHeader = `${questionNum}. `;
        if (template.showDifficulty && question.difficulty) {
            questionHeader += `[${question.difficulty.toUpperCase()}] `;
        }
        if (template.showPoints && question.points) {
            questionHeader += `(${question.points} pts) `;
        }
        
        doc.setFont(undefined, 'bold');
        doc.text(questionHeader, LAYOUT.MARGIN, y);
        doc.setFont(undefined, 'normal');
        
        // Question text - handle rich text by converting to plain text
        const questionText = extractPlainText(question);
        const questionLines = doc.splitTextToSize(questionText, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN - 20);
        
        let questionY = y;
        questionLines.forEach(line => {
            doc.text(line, LAYOUT.MARGIN + 10, questionY);
            questionY += LAYOUT.LINE_HEIGHT;
        });
        
        y = questionY + 5;
        
        // Add answer options
        if (question.questionType !== 'true-false' && template.bubbleStyle !== 'none') {
            y = addMultipleChoiceOptions(doc, question, template, y);
        } else if (question.questionType === 'true-false' && template.bubbleStyle !== 'none') {
            y = addTrueFalseOptions(doc, question, template, y);
        } else {
            // Practice sheet - add blank lines
            y = addBlankLines(doc, y, 3);
        }
        
        return y + LAYOUT.QUESTION_SPACING;
    }
    
    /**
     * Add multiple choice options
     * @param {Object} doc - jsPDF document
     * @param {Object} question - Question data
     * @param {Object} template - Template configuration
     * @param {number} y - Current Y position
     * @returns {number} New Y position
     */
    function addMultipleChoiceOptions(doc, question, template, y) {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const optionCount = question.optionCount || 4;
        const correctAnswer = window.QuizModules.Utils.convertInternalToLetter(question.correctAnswer);
        
        for (let i = 0; i < optionCount; i++) {
            const letter = letters[i];
            const optionText = question.options?.[letter] || question[`option${i+1}`] || '';
            
            if (!optionText.trim()) continue;
            
            const isCorrect = template.showAnswers && letter === correctAnswer;
            
            // Draw bubble
            const bubbleX = LAYOUT.MARGIN + 15;
            const bubbleY = y - 2;
            
            if (template.bubbleStyle === 'circle') {
                doc.circle(bubbleX, bubbleY, 2);
            } else if (template.bubbleStyle === 'filled' && isCorrect) {
                doc.circle(bubbleX, bubbleY, 2, 'F'); // Filled circle for correct answer
            } else if (template.bubbleStyle === 'filled') {
                doc.circle(bubbleX, bubbleY, 2);
            }
            
            // Option letter and text
            doc.setFont(undefined, isCorrect ? 'bold' : 'normal');
            doc.text(`${letter}.`, bubbleX + 5, y);
            
            // Clean option text
            const cleanText = extractPlainText({ questionHtml: optionText, question: optionText });
            const optionLines = doc.splitTextToSize(cleanText, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN - 40);
            
            let optionY = y;
            optionLines.forEach(line => {
                doc.text(line, bubbleX + 12, optionY);
                optionY += LAYOUT.LINE_HEIGHT;
            });
            
            y = optionY + 2;
        }
        
        doc.setFont(undefined, 'normal'); // Reset font
        return y;
    }
    
    /**
     * Add true/false options
     * @param {Object} doc - jsPDF document
     * @param {Object} question - Question data
     * @param {Object} template - Template configuration
     * @param {number} y - Current Y position
     * @returns {number} New Y position
     */
    function addTrueFalseOptions(doc, question, template, y) {
        const correctAnswer = window.QuizModules.Utils.convertInternalToLetter(question.correctAnswer);
        const trueIsCorrect = correctAnswer === 'A';
        const falseIsCorrect = correctAnswer === 'B';
        
        // True option
        const bubbleX = LAYOUT.MARGIN + 15;
        
        if (template.bubbleStyle === 'filled' && trueIsCorrect) {
            doc.circle(bubbleX, y - 2, 2, 'F');
        } else {
            doc.circle(bubbleX, y - 2, 2);
        }
        
        doc.setFont(undefined, trueIsCorrect && template.showAnswers ? 'bold' : 'normal');
        doc.text('A. True', bubbleX + 5, y);
        y += 8;
        
        // False option
        if (template.bubbleStyle === 'filled' && falseIsCorrect) {
            doc.circle(bubbleX, y - 2, 2, 'F');
        } else {
            doc.circle(bubbleX, y - 2, 2);
        }
        
        doc.setFont(undefined, falseIsCorrect && template.showAnswers ? 'bold' : 'normal');
        doc.text('B. False', bubbleX + 5, y);
        y += 8;
        
        doc.setFont(undefined, 'normal'); // Reset font
        return y;
    }
    
    /**
     * Add blank lines for written answers
     * @param {Object} doc - jsPDF document
     * @param {number} y - Current Y position
     * @param {number} lineCount - Number of blank lines
     * @returns {number} New Y position
     */
    function addBlankLines(doc, y, lineCount = 3) {
        for (let i = 0; i < lineCount; i++) {
            doc.line(LAYOUT.MARGIN + 15, y, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN, y);
            y += 8;
        }
        return y;
    }
    
    /**
     * Add footer to PDF
     * @param {Object} doc - jsPDF document
     * @param {Object} template - Template configuration
     */
    function addFooter(doc, template) {
        const pageCount = doc.internal.getNumberOfPages();
        
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            
            // Page number
            doc.text(`Page ${i} of ${pageCount}`, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN - 20, LAYOUT.PAGE_HEIGHT - 10);
            
            // Generated by footer
            doc.text('Generated by Quiz System v1.4.0', LAYOUT.MARGIN, LAYOUT.PAGE_HEIGHT - 10);
        }
    }
    
    /**
     * Extract plain text from question (handle rich text)
     * @param {Object} question - Question object
     * @returns {string} Plain text
     */
    function extractPlainText(question) {
        if (question.questionHtml) {
            // Strip HTML tags and decode entities
            return question.questionHtml
                .replace(/<[^>]*>/g, '') // Remove HTML tags
                .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
                .replace(/&amp;/g, '&')  // Replace HTML entities
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .trim();
        }
        return question.question || '';
    }
    
    /**
     * Download PDF file
     * @param {Object} doc - jsPDF document
     * @param {string} filename - Filename for download
     */
    function downloadPDF(doc, filename) {
        if (!doc) {
            throw new Error('Invalid PDF document');
        }
        
        const defaultName = `quiz-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename || defaultName);
    }
    
    /**
     * Get available templates
     * @returns {Object} Available templates
     */
    function getAvailableTemplates() {
        return TEMPLATES;
    }
    
    /**
     * Preview PDF in new window (for testing)
     * @param {Object} doc - jsPDF document
     */
    function previewPDF(doc) {
        if (!doc) {
            throw new Error('Invalid PDF document');
        }
        
        const pdfOutput = doc.output('bloburl');
        window.open(pdfOutput, '_blank');
    }
    
    // Register this module with the loader
    if (window.QuizModules.Loader) {
        window.QuizModules.Loader.registerModule('PDF', '1.4.0');
    }
    
    // Public API
    return {
        // PDF generation functions
        generateStudentQuiz: generateStudentQuiz,
        generateAnswerKey: generateAnswerKey,
        generatePracticeSheet: generatePracticeSheet,
        
        // Utility functions
        downloadPDF: downloadPDF,
        previewPDF: previewPDF,
        getAvailableTemplates: getAvailableTemplates,
        
        // Template constants
        TEMPLATES: TEMPLATES
    };
})();