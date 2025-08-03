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
        // Check if jsPDF is available - try multiple detection patterns
        let jsPDF;
        
        // Try different global locations where jsPDF might be available
        if (typeof window.jsPDF !== 'undefined') {
            // jsPDF 2.x global export
            jsPDF = window.jsPDF;
            console.log('Found jsPDF at window.jsPDF (v2.x pattern)');
        } else if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
            // jsPDF 3.x namespaced export
            jsPDF = window.jspdf.jsPDF;
            console.log('Found jsPDF at window.jspdf.jsPDF (v3.x pattern)');
        } else if (typeof jsPDF !== 'undefined') {
            // Global variable
            jsPDF = window.jsPDF;
            console.log('Found jsPDF as global variable');
        } else {
            // Debug: show what PDF-related globals are available
            const pdfGlobals = Object.keys(window).filter(k => k.toLowerCase().includes('pdf'));
            console.error('jsPDF detection failed.');
            console.error('Available PDF-related globals:', pdfGlobals);
            console.error('window.jsPDF type:', typeof window.jsPDF);
            console.error('window.jspdf type:', typeof window.jspdf);
            
            throw new Error('jsPDF library not loaded. Please ensure jspdf.min.js is included and loaded properly.');
        }
        
        console.log('Using jsPDF constructor:', jsPDF);
        const doc = new jsPDF();
        let currentY = LAYOUT.MARGIN;
        
        // Add header
        currentY = addHeader(doc, quizData, template, currentY);
        
        // Add student info section
        currentY = addStudentInfo(doc, template, currentY);
        
        // Add questions
        const questions = quizData.questions || [];
        for (let i = 0; i < questions.length; i++) {
            // Estimate space needed for this question
            const questionText = extractPlainText(questions[i]);
            const estimatedLines = Math.ceil(questionText.length / 80) + 3; // Rough estimate
            const hasImage = questions[i].image || questions[i].imagePreviewData;
            const estimatedHeight = estimatedLines * LAYOUT.LINE_HEIGHT + 
                                  (hasImage ? 65 : 0) + // Image space
                                  LAYOUT.QUESTION_SPACING;
            
            // Check if we need a new page
            if (currentY + estimatedHeight > LAYOUT.PAGE_HEIGHT - 30) {
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
        
        // Question number and metadata on separate lines for better spacing
        doc.setFont(undefined, 'bold');
        doc.text(`${questionNum}.`, LAYOUT.MARGIN, y);
        
        // Add difficulty and points on same line, but with proper spacing
        if (template.showDifficulty || template.showPoints) {
            let metadata = '';
            if (template.showDifficulty && question.difficulty) {
                metadata += `[${question.difficulty.toUpperCase()}]`;
            }
            if (template.showPoints && question.points) {
                if (metadata) metadata += ' ';
                metadata += `(${question.points} pts)`;
            }
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.text(metadata, LAYOUT.MARGIN + 15, y);
            y += LAYOUT.LINE_HEIGHT;
        }
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        
        // Question text - handle rich text with proper formatting
        const questionY = y + 2; // Add small spacing after metadata
        const finalY = addRichTextContent(doc, question, LAYOUT.MARGIN + 10, questionY, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN - 20);
        
        y = finalY + 3; // Reduced spacing after question text
        
        // Add image if present
        if (question.image || question.imagePreviewData) {
            y = addQuestionImage(doc, question, y);
        }
        
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
            
            // Format option text with rich text support
            const optionQuestion = {
                questionHtml: optionText,
                question: optionText,
                // Try to get rich text data if available from the original question
                optionsDelta: question.optionsDelta,
                optionsHtml: question.optionsHtml
            };
            
            // Use rich text content if available, otherwise fallback to plain text
            let optionY = y;
            if (question.optionsDelta && question.optionsDelta[letter]) {
                // Use Delta format for option
                optionY = addDeltaFormattedText(doc, question.optionsDelta[letter], bubbleX + 12, y, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN - 40);
            } else if (question.optionsHtml && question.optionsHtml[letter]) {
                // Use HTML format for option  
                optionY = addHtmlFormattedText(doc, question.optionsHtml[letter], bubbleX + 12, y, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN - 40);
            } else {
                // Fallback to plain text
                const cleanText = extractPlainText({ questionHtml: optionText, question: optionText });
                const optionLines = doc.splitTextToSize(cleanText, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN - 40);
                
                optionLines.forEach(line => {
                    doc.text(line, bubbleX + 12, optionY);
                    optionY += LAYOUT.LINE_HEIGHT;
                });
            }
            
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
     * Add question image to PDF
     * @param {Object} doc - jsPDF document
     * @param {Object} question - Question data with image
     * @param {number} y - Current Y position
     * @returns {number} New Y position
     */
    function addQuestionImage(doc, question, y) {
        try {
            const imageData = question.imagePreviewData || question.image;
            if (!imageData) return y;
            
            // Check if it's a data URL
            if (imageData.startsWith('data:image/')) {
                // Try to detect image format
                let format = 'JPEG'; // Default
                if (imageData.startsWith('data:image/png')) {
                    format = 'PNG';
                } else if (imageData.startsWith('data:image/gif')) {
                    format = 'GIF';
                } else if (imageData.startsWith('data:image/webp')) {
                    format = 'WEBP';
                }
                
                // Calculate image dimensions - max width 100mm, max height 60mm
                const maxWidth = 100;
                const maxHeight = 60;
                
                // Try to get actual image dimensions by creating an Image element
                const img = new Image();
                img.src = imageData;
                
                let imageWidth, imageHeight;
                
                if (img.naturalWidth && img.naturalHeight) {
                    // Use actual aspect ratio
                    const aspectRatio = img.naturalWidth / img.naturalHeight;
                    imageWidth = Math.min(maxWidth, maxHeight * aspectRatio);
                    imageHeight = imageWidth / aspectRatio;
                } else {
                    // Default sizing
                    imageWidth = maxWidth * 0.8; // Slightly smaller default
                    imageHeight = 45; // Fixed height for consistency
                }
                
                // Ensure we don't exceed maximums
                if (imageWidth > maxWidth) {
                    imageWidth = maxWidth;
                    imageHeight = imageWidth / (img.naturalWidth / img.naturalHeight || 4/3);
                }
                if (imageHeight > maxHeight) {
                    imageHeight = maxHeight;
                    imageWidth = imageHeight * (img.naturalWidth / img.naturalHeight || 4/3);
                }
                
                // Add the image
                doc.addImage(imageData, format, LAYOUT.MARGIN + 15, y, imageWidth, imageHeight);
                y += imageHeight + 8; // Add spacing after image
                
                console.log(`Added image: ${format}, ${imageWidth}x${imageHeight}mm`);
            } else {
                // Handle non-data URL images (add placeholder text)
                doc.setFontSize(9);
                doc.setFont(undefined, 'italic');
                doc.text('[Image: ' + (question.imagePath || 'attached') + ']', LAYOUT.MARGIN + 15, y);
                y += LAYOUT.LINE_HEIGHT + 3;
                doc.setFont(undefined, 'normal');
            }
        } catch (error) {
            console.warn('Error adding image to PDF:', error);
            // Add placeholder text if image fails
            doc.setFontSize(9);
            doc.setFont(undefined, 'italic');
            doc.text('[Image could not be loaded]', LAYOUT.MARGIN + 15, y);
            y += LAYOUT.LINE_HEIGHT + 3;
            doc.setFont(undefined, 'normal');
        }
        
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
     * Add rich text content to PDF with proper formatting
     * @param {Object} doc - jsPDF document
     * @param {Object} question - Question object with rich text data
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} maxWidth - Maximum width for text wrapping
     * @returns {number} Final Y position after text
     */
    function addRichTextContent(doc, question, x, y, maxWidth) {
        // Try to use Delta format first (richest formatting), then HTML, then plain text
        if (question.questionDelta && question.questionDelta.ops) {
            return addDeltaFormattedText(doc, question.questionDelta, x, y, maxWidth);
        } else if (question.questionHtml) {
            return addHtmlFormattedText(doc, question.questionHtml, x, y, maxWidth);
        } else {
            // Fallback to plain text
            const plainText = question.question || '';
            const lines = doc.splitTextToSize(plainText, maxWidth);
            lines.forEach(line => {
                doc.text(line, x, y);
                y += LAYOUT.LINE_HEIGHT;
            });
            return y;
        }
    }
    
    /**
     * Add Delta formatted text to PDF with rich formatting
     * @param {Object} doc - jsPDF document
     * @param {Object} delta - Quill Delta object
     * @param {number} x - X position
     * @param {number} y - Y position  
     * @param {number} maxWidth - Maximum width for text wrapping
     * @returns {number} Final Y position after text
     */
    function addDeltaFormattedText(doc, delta, x, y, maxWidth) {
        if (!delta.ops || delta.ops.length === 0) {
            return y;
        }
        
        let currentX = x;
        let currentY = y;
        let currentLine = '';
        let currentLineWidth = 0;
        
        for (const op of delta.ops) {
            if (typeof op.insert === 'string') {
                let text = op.insert.replace(/\n/g, ' '); // Convert newlines to spaces
                
                // Apply formatting
                let fontStyle = 'normal';
                let fontSize = 11;
                
                if (op.attributes) {
                    if (op.attributes.bold) {
                        fontStyle = 'bold';
                    } else if (op.attributes.italic) {
                        fontStyle = 'italic';
                    }
                }
                
                doc.setFont(undefined, fontStyle);
                doc.setFontSize(fontSize);
                
                // Handle superscript and subscript
                if (op.attributes && op.attributes.script) {
                    if (op.attributes.script === 'super') {
                        // Superscript: smaller font, raised position
                        doc.setFontSize(fontSize * 0.7);
                        const textWidth = doc.getTextWidth(text);
                        doc.text(text, currentX, currentY - 2);
                        currentX += textWidth;
                        currentLineWidth += textWidth;
                    } else if (op.attributes.script === 'sub') {
                        // Subscript: smaller font, lowered position
                        doc.setFontSize(fontSize * 0.7);
                        const textWidth = doc.getTextWidth(text);
                        doc.text(text, currentX, currentY + 2);
                        currentX += textWidth;
                        currentLineWidth += textWidth;
                    }
                } else {
                    // Regular text
                    const words = text.split(' ');
                    
                    for (let i = 0; i < words.length; i++) {
                        const word = words[i] + (i < words.length - 1 ? ' ' : '');
                        const wordWidth = doc.getTextWidth(word);
                        
                        // Check if we need to wrap to next line
                        if (currentLineWidth + wordWidth > maxWidth && currentLine.length > 0) {
                            currentY += LAYOUT.LINE_HEIGHT;
                            currentX = x;
                            currentLineWidth = 0;
                            currentLine = '';
                        }
                        
                        doc.text(word, currentX, currentY);
                        currentX += wordWidth;
                        currentLineWidth += wordWidth;
                        currentLine += word;
                    }
                }
                
                // Reset font for next operation
                doc.setFont(undefined, 'normal');
                doc.setFontSize(11);
            }
        }
        
        return currentY + LAYOUT.LINE_HEIGHT;
    }
    
    /**
     * Add HTML formatted text to PDF with basic formatting
     * @param {Object} doc - jsPDF document
     * @param {string} html - HTML string
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} maxWidth - Maximum width for text wrapping
     * @returns {number} Final Y position after text
     */
    function addHtmlFormattedText(doc, html, x, y, maxWidth) {
        // Simple HTML to formatted text conversion
        let text = html;
        
        // Handle basic formatting by converting to text with markers
        text = text.replace(/<sup[^>]*>(.*?)<\/sup>/gi, '^($1)'); // Superscript marker
        text = text.replace(/<sub[^>]*>(.*?)<\/sub>/gi, '_($1)'); // Subscript marker
        text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**'); // Bold marker
        text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*'); // Italic marker
        
        // Remove remaining HTML tags
        text = text.replace(/<[^>]*>/g, '');
        
        // Decode HTML entities
        text = text.replace(/&nbsp;/g, ' ')
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"')
                  .trim();
        
        // Process the text with formatting markers
        return processFormattedText(doc, text, x, y, maxWidth);
    }
    
    /**
     * Process text with formatting markers
     * @param {Object} doc - jsPDF document
     * @param {string} text - Text with formatting markers
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} maxWidth - Maximum width
     * @returns {number} Final Y position
     */
    function processFormattedText(doc, text, x, y, maxWidth) {
        let currentY = y;
        let currentX = x;
        
        // Split into segments by formatting markers
        const segments = text.split(/(\*\*.*?\*\*|\*.*?\*|\^.*?\)\_.*?\))/);
        
        for (const segment of segments) {
            if (!segment) continue;
            
            let actualText = segment;
            let fontStyle = 'normal';
            let isSuper = false;
            let isSub = false;
            let fontSize = 11;
            
            // Check for formatting
            if (segment.startsWith('**') && segment.endsWith('**')) {
                // Bold
                actualText = segment.slice(2, -2);
                fontStyle = 'bold';
            } else if (segment.startsWith('*') && segment.endsWith('*')) {
                // Italic
                actualText = segment.slice(1, -1);
                fontStyle = 'italic';
            } else if (segment.startsWith('^(') && segment.endsWith(')')) {
                // Superscript
                actualText = segment.slice(2, -1);
                fontSize = 8;
                isSuper = true;
            } else if (segment.startsWith('_(') && segment.endsWith(')')) {
                // Subscript
                actualText = segment.slice(2, -1);
                fontSize = 8;
                isSub = true;
            }
            
            doc.setFont(undefined, fontStyle);
            doc.setFontSize(fontSize);
            
            const textWidth = doc.getTextWidth(actualText);
            
            // Check line wrapping
            if (currentX + textWidth > x + maxWidth) {
                currentY += LAYOUT.LINE_HEIGHT;
                currentX = x;
            }
            
            // Adjust Y position for super/subscript
            let adjustedY = currentY;
            if (isSuper) {
                adjustedY -= 2;
            } else if (isSub) {
                adjustedY += 2;
            }
            
            doc.text(actualText, currentX, adjustedY);
            currentX += textWidth;
            
            // Reset formatting
            doc.setFont(undefined, 'normal');
            doc.setFontSize(11);
        }
        
        return currentY + LAYOUT.LINE_HEIGHT;
    }
    
    /**
     * Extract plain text from question (fallback for simple cases)
     * @param {Object} question - Question object
     * @returns {string} Plain text
     */
    function extractPlainText(question) {
        if (question.questionDelta && question.questionDelta.ops) {
            // Extract plain text from Delta format
            return question.questionDelta.ops
                .map(op => typeof op.insert === 'string' ? op.insert : '')
                .join('')
                .replace(/\n/g, ' ')
                .trim();
        } else if (question.questionHtml) {
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