/**
 * Quiz UI Components Module
 * Handles all user interface components including dialogs, forms, and rendering
 * Part of the modular refactoring - Phase 4
 * 
 * Uses global namespace pattern for offline-first compatibility
 */

// Create namespace if it doesn't exist
window.QuizModules = window.QuizModules || {};

// Define the UI components module
window.QuizModules.UI = (function() {
    'use strict';
    
    /**
     * Toggle the test library sidebar
     */
    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const isCollapsed = sidebar.classList.contains('collapsed');
        
        if (isCollapsed) {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('sidebar-collapsed');
        } else {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('sidebar-collapsed');
        }
    }
    
    /**
     * Show brief success message and scroll to form
     */
    function showBriefSuccessAndScrollToForm() {
        // Show success message with user choices
        showSuccessWithChoices();
    }
    
    /**
     * Show success dialog with user action choices
     */
    function showSuccessWithChoices() {
        // Remove any existing choice dialog
        const existing = document.getElementById('success-choices');
        if (existing) existing.remove();

        // Create success dialog with choices
        const choiceDiv = document.createElement('div');
        choiceDiv.id = 'success-choices';
        choiceDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: scaleIn 0.3s ease;
            text-align: center;
            min-width: 400px;
            max-width: 90vw;
        `;
        
        choiceDiv.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                <h2 style="margin: 0 0 10px 0; color: #27ae60; font-size: 24px;">Question Added Successfully!</h2>
                <p style="margin: 0; color: #7f8c8d; font-size: 16px;">What would you like to do next?</p>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button onclick="addAnotherQuestion()" style="
                    background: linear-gradient(135deg, #3498db, #2980b9);
                    color: white;
                    border: none;
                    padding: 15px 25px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    Add Another Question
                </button>
                
                <button onclick="reviewAndOrder()" style="
                    background: linear-gradient(135deg, #f39c12, #e67e22);
                    color: white;
                    border: none;
                    padding: 15px 25px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    Review & Reorder Questions
                </button>
                
                <button onclick="saveQuiz()" style="
                    background: linear-gradient(135deg, #27ae60, #229954);
                    color: white;
                    border: none;
                    padding: 15px 25px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    Save & Export Quiz
                </button>
                
                <button onclick="closeSuccessDialog()" style="
                    background: transparent;
                    color: #95a5a6;
                    border: 2px solid #ecf0f1;
                    padding: 12px 20px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                " onmouseover="this.style.borderColor='#bdc3c7'" onmouseout="this.style.borderColor='#ecf0f1'">
                    ✕ Just Close This
                </button>
            </div>
        `;

        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999;
            animation: fadeIn 0.3s ease;
        `;
        backdrop.onclick = closeSuccessDialog;

        document.body.appendChild(backdrop);
        document.body.appendChild(choiceDiv);
        
        // Store reference for closing
        window.currentChoiceDialog = choiceDiv;
        window.currentBackdrop = backdrop;
    }
    
    /**
     * Close the success dialog
     */
    function closeSuccessDialog() {
        const dialog = window.currentChoiceDialog;
        const backdrop = window.currentBackdrop;
        
        if (dialog) {
            dialog.style.animation = 'scaleOut 0.3s ease';
            setTimeout(() => {
                if (dialog.parentNode) dialog.remove();
            }, 300);
        }
        
        if (backdrop) {
            backdrop.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (backdrop.parentNode) backdrop.remove();
            }, 300);
        }
    }
    
    /**
     * Show guidance message for next steps
     * @param {Object} quizData - Current quiz data
     * @param {number} currentTestIndex - Current test index
     */
    function showNextStepsGuidance(quizData, currentTestIndex) {
        const hasQuestions = quizData.tests[currentTestIndex]?.questions?.length > 0;
        
        if (hasQuestions) {
            // Test has questions - show editing options
            showGuidanceMessage(
                "Ready to Edit! 📝", 
                "You can reorder questions with arrow buttons, edit them, or add more questions below.",
                "#9b59b6"
            );
        } else {
            // Empty test - guide to add questions
            showGuidanceMessage(
                "Add Your First Question! ➕", 
                "This test is empty. Scroll down to the 'Add Questions' section to get started.",
                "#e74c3c"
            );
        }
    }
    
    /**
     * Show a guidance message dialog
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {string} color - Theme color
     */
    function showGuidanceMessage(title, message, color) {
        const guidanceDiv = document.createElement('div');
        guidanceDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: scaleIn 0.3s ease;
            text-align: center;
            min-width: 350px;
            border-top: 4px solid ${color};
        `;
        
        guidanceDiv.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: ${color}; font-size: 20px;">${title}</h3>
            <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">${message}</p>
            <button onclick="window.QuizModules.UI.closeGuidance()" style="
                background: ${color};
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
            ">Got it!</button>
        `;

        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'guidance-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999;
            animation: fadeIn 0.3s ease;
        `;
        backdrop.onclick = closeGuidance;

        document.body.appendChild(backdrop);
        document.body.appendChild(guidanceDiv);
        
        // Store reference for closing
        window.currentGuidance = guidanceDiv;
    }
    
    /**
     * Close guidance dialog
     */
    function closeGuidance() {
        const guidance = window.currentGuidance;
        const backdrop = document.getElementById('guidance-backdrop');
        
        if (guidance) {
            guidance.style.animation = 'scaleOut 0.3s ease';
            setTimeout(() => {
                if (guidance.parentNode) guidance.remove();
            }, 300);
        }
        
        if (backdrop) {
            backdrop.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (backdrop.parentNode) backdrop.remove();
            }, 300);
        }
    }
    
    /**
     * Update question type UI elements
     */
    function updateQuestionTypeUI() {
        const questionType = document.getElementById('questionType').value;
        const optionCountContainer = document.getElementById('optionCountContainer');
        const optionCount = document.getElementById('optionCount');
        
        if (questionType === 'true-false') {
            // Hide option count selector for true/false
            optionCountContainer.style.display = 'none';
            optionCount.value = '2';
            updateOptionCount(); // Update to show only A, B
            
            // Handle true/false editor setup using rich text module
            window.QuizModules.RichText.handleQuestionTypeChange('true-false');
            
            // Update correct answer dropdown for true/false
            const correctAnswer = document.getElementById('correctAnswer');
            correctAnswer.innerHTML = `
                <option value="option1">A (True)</option>
                <option value="option2">B (False)</option>
            `;
            
        } else if (questionType === 'multiple-choice') {
            // Show option count selector for multiple choice
            optionCountContainer.style.display = 'block';
            updateOptionCount(); // Update based on current selection
            
            // Handle multiple choice editor setup using rich text module
            window.QuizModules.RichText.handleQuestionTypeChange('multiple-choice');
        }
    }
    
    /**
     * Update option count and show/hide option containers
     */
    function updateOptionCount() {
        const optionCount = parseInt(document.getElementById('optionCount').value);
        const questionType = document.getElementById('questionType').value;
        
        // Get all option editor containers
        const optionContainers = [
            document.getElementById('option1-editor').parentElement,
            document.getElementById('option2-editor').parentElement,
            document.getElementById('option3-editor').parentElement,
            document.getElementById('option4-editor').parentElement,
            document.getElementById('option5Container'),
            document.getElementById('option6Container')
        ];
        
        // Show/hide options based on count
        optionContainers.forEach((container, index) => {
            if (index < optionCount) {
                container.style.display = 'block';
                // Don't clear values when showing options - preserve existing content
            } else {
                container.style.display = 'none';
                // Don't clear hidden option values - they might be needed if user changes count again
            }
        });
        
        // Update correct answer dropdown
        updateCorrectAnswerDropdown(optionCount, questionType);
    }
    
    /**
     * Update correct answer dropdown based on option count and question type
     * @param {number} optionCount - Number of options
     * @param {string} questionType - Type of question
     */
    function updateCorrectAnswerDropdown(optionCount, questionType) {
        const correctAnswer = document.getElementById('correctAnswer');
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const optionValues = ['option1', 'option2', 'option3', 'option4', 'option5', 'option6'];
        
        let dropdownHTML = '';
        
        for (let i = 0; i < optionCount; i++) {
            if (questionType === 'true-false') {
                if (i === 0) dropdownHTML += `<option value="${optionValues[i]}">${letters[i]} (True)</option>`;
                if (i === 1) dropdownHTML += `<option value="${optionValues[i]}">${letters[i]} (False)</option>`;
            } else {
                dropdownHTML += `<option value="${optionValues[i]}">${letters[i]}</option>`;
            }
        }
        
        correctAnswer.innerHTML = dropdownHTML;
    }
    
    /**
     * Clear the question form
     */
    function clearQuestionForm() {
        // Clear rich text editors using the rich text module
        window.QuizModules.RichText.clearQuestionEditor();
        window.QuizModules.RichText.clearOptionEditors();
        
        // Clear other form fields
        document.getElementById('imagePath').value = '';
        document.getElementById('points').value = '1';
        document.getElementById('difficulty').value = 'easy';
        document.getElementById('category').value = '';
        
        // Hide image preview
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.style.display = 'none';
            preview.src = '';
            delete preview.dataset.imageData;
        }
        
        // Reset question type to multiple choice
        document.getElementById('questionType').value = 'multiple-choice';
        document.getElementById('optionCount').value = '4';
        updateQuestionTypeUI();
        
        // Reset correct answer
        document.getElementById('correctAnswer').value = 'option1';
    }
    
    /**
     * Update the create button text based on current state
     * @param {Object} quizData - Current quiz data
     * @param {number} currentTestIndex - Current test index
     */
    function updateCreateButtonText(quizData, currentTestIndex) {
        // Update button text based on whether we have a test loaded
        const hasTestLoaded = currentTestIndex !== -1 && quizData.tests[currentTestIndex];
        const mainButton = document.getElementById('createQuizButton');
        const summaryButton = document.getElementById('summaryCreateButton');
        const newQuizButton = document.getElementById('newQuizButton');
        
        if (hasTestLoaded) {
            if (mainButton) mainButton.innerHTML = '➕ Add New Question';
            if (summaryButton) summaryButton.innerHTML = '➕ Add New Question';
            // Show the "Start Fresh Quiz" button when a quiz is loaded
            if (newQuizButton) newQuizButton.style.display = 'inline-block';
        } else {
            if (mainButton) mainButton.innerHTML = '✨ Create New Quiz';
            if (summaryButton) summaryButton.innerHTML = '✨ Create New Quiz';
            // Hide the "Start Fresh Quiz" button when no quiz is loaded
            if (newQuizButton) newQuizButton.style.display = 'none';
        }
    }
    
    /**
     * Update the add/update question button text
     * @param {number} currentQuestionIndex - Index of question being edited (null for new)
     */
    function updateQuestionButtonText(currentQuestionIndex) {
        const button = document.getElementById("addQuestionButton");
        if (!button) return;
        
        if (currentQuestionIndex !== null) {
            // Editing mode
            button.innerHTML = "✏️ Update Question";
            button.style.background = "#f39c12"; // Orange for update
        } else {
            // Adding mode
            button.innerHTML = "➕ Add Question to Quiz";
            button.style.background = "#27ae60"; // Green for add
        }
    }
    
    /**
     * Populate the test selection dropdown
     * @param {Object} quizData - Quiz data object
     */
    function populateTestSelect(quizData) {
        const quizSelectContainer = document.getElementById("quizSelectContainer");
        quizSelectContainer.innerHTML = ""; // Clear previous options

        if (quizData.tests.length > 0) {
            const select = document.createElement("select");
            select.id = "testSelect";
            select.onchange = () => selectTest(parseInt(select.value));

            quizData.tests.forEach((test, index) => {
                const option = document.createElement("option");
                option.value = index;
                option.text = test.testName || `Test ${index + 1}`;
                select.appendChild(option);
            });

            quizSelectContainer.appendChild(select);
            quizSelectContainer.style.display = "block";
            // selectTest will be called by the main application
        } else {
            quizSelectContainer.style.display = "none";
        }
        document.getElementById("quizDetailsContainer").style.display = "block";
    }
    
    /**
     * Update total points and question count summary
     * @param {Array} questions - Array of questions
     */
    function updateTotalPoints(questions) {
        const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);
        const questionCount = questions.length;
        
        // Update summary cards
        document.getElementById("totalPointsDisplay").innerText = totalPoints;
        document.getElementById("questionCount").innerText = questionCount;
        
        // Calculate difficulty breakdown
        const difficulties = questions.reduce((acc, q) => {
            acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
            return acc;
        }, {});
        
        const difficultyText = questionCount > 0 ? 
            `${difficulties.easy || 0} Easy, ${difficulties.medium || 0} Medium, ${difficulties.hard || 0} Hard` :
            'No questions yet';
            
        document.getElementById("difficultyBreakdown").innerText = difficultyText;
    }
    
    /**
     * Render questions list with reordering controls
     * @param {Array} questions - Array of question objects
     */
    function renderQuestions(questions) {
        const questionsContainer = document.getElementById("questions");
        const emptyState = document.getElementById("emptyState");
        
        if (!questionsContainer || !emptyState) return;
        
        if (!questions || questions.length === 0) {
            questionsContainer.innerHTML = "";
            emptyState.style.display = "block";
            return;
        }
        
        emptyState.style.display = "none";
        
        // Sort questions by position
        const sortedQuestions = [...questions].sort((a, b) => (a.position || 0) - (b.position || 0));
        
        questionsContainer.innerHTML = sortedQuestions.map((question, index) => {
            const difficultyColor = window.QuizModules.Utils.getDifficultyColor(question.difficulty);
            const difficultyEmoji = window.QuizModules.Utils.getDifficultyEmoji(question.difficulty);
            const optionsHtml = window.QuizModules.Utils.generateOptionDisplayHTML(question);
            const correctLetter = window.QuizModules.Utils.convertInternalToLetter(question.correctAnswer);
            
            return `
                <div class="question-item" style="background: white; margin: 15px 0; padding: 20px; border-radius: 10px; border: 2px solid #e8f4fd; position: relative;">
                    <div style="display: flex; justify-content: between; align-items: flex-start; margin-bottom: 15px;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                <span style="background: #3498db; color: white; padding: 4px 8px; border-radius: 15px; font-size: 12px; font-weight: bold;">Q${question.position || index + 1}</span>
                                <span style="background: ${difficultyColor}; color: white; padding: 4px 8px; border-radius: 15px; font-size: 12px;">${difficultyEmoji} ${question.difficulty || 'easy'}</span>
                                <span style="background: #95a5a6; color: white; padding: 4px 8px; border-radius: 15px; font-size: 12px;">⭐ ${question.points || 1} pts</span>
                                ${question.category ? `<span style="background: #9b59b6; color: white; padding: 4px 8px; border-radius: 15px; font-size: 12px;">📂 ${question.category}</span>` : ''}
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #2c3e50; font-size: 16px;">${question.questionHtml || question.question}</strong>
                                ${question.image ? `<div style="margin-top: 10px;"><img src="${question.imagePreviewData || question.image}" alt="Question image" style="max-width: 200px; max-height: 150px; border: 1px solid #ddd; border-radius: 5px;"></div>` : ''}
                            </div>
                            
                            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">
                                ${optionsHtml}
                            </div>
                            
                            <div style="color: #27ae60; font-weight: bold;">
                                ✅ Correct Answer: ${correctLetter}
                            </div>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 5px; margin-left: 15px;">
                            <button onclick="moveQuestionUp(${index})" ${index === 0 ? 'disabled' : ''} style="
                                background: ${index === 0 ? '#bdc3c7' : '#3498db'};
                                color: white;
                                border: none;
                                padding: 5px 10px;
                                border-radius: 5px;
                                cursor: ${index === 0 ? 'not-allowed' : 'pointer'};
                                font-size: 12px;
                            " title="Move Up">↑</button>
                            
                            <button onclick="moveQuestionDown(${index})" ${index === sortedQuestions.length - 1 ? 'disabled' : ''} style="
                                background: ${index === sortedQuestions.length - 1 ? '#bdc3c7' : '#3498db'};
                                color: white;
                                border: none;
                                padding: 5px 10px;
                                border-radius: 5px;
                                cursor: ${index === sortedQuestions.length - 1 ? 'not-allowed' : 'pointer'};
                                font-size: 12px;
                            " title="Move Down">↓</button>
                            
                            <button onclick="editQuestion(${index})" style="
                                background: #f39c12;
                                color: white;
                                border: none;
                                padding: 5px 10px;
                                border-radius: 5px;
                                cursor: pointer;
                                font-size: 12px;
                            " title="Edit">✏️</button>
                            
                            <button onclick="deleteQuestion(${index})" style="
                                background: #e74c3c;
                                color: white;
                                border: none;
                                padding: 5px 10px;
                                border-radius: 5px;
                                cursor: pointer;
                                font-size: 12px;
                            " title="Delete">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Register this module with the loader
    if (window.QuizModules.Loader) {
        window.QuizModules.Loader.registerModule('UI', '1.4.0');
    }
    
    // Public API
    return {
        // Sidebar and navigation
        toggleSidebar: toggleSidebar,
        
        // Dialogs and messages
        showBriefSuccessAndScrollToForm: showBriefSuccessAndScrollToForm,
        showSuccessWithChoices: showSuccessWithChoices,
        closeSuccessDialog: closeSuccessDialog,
        showNextStepsGuidance: showNextStepsGuidance,
        showGuidanceMessage: showGuidanceMessage,
        closeGuidance: closeGuidance,
        
        // Form management
        clearQuestionForm: clearQuestionForm,
        updateCreateButtonText: updateCreateButtonText,
        updateQuestionButtonText: updateQuestionButtonText,
        
        // Question type UI
        updateQuestionTypeUI: updateQuestionTypeUI,
        updateOptionCount: updateOptionCount,
        updateCorrectAnswerDropdown: updateCorrectAnswerDropdown,
        
        // Rendering
        populateTestSelect: populateTestSelect,
        renderQuestions: renderQuestions,
        updateTotalPoints: updateTotalPoints
    };
})();