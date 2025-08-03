/**
 * Quiz Question Management Module
 * Handles all question CRUD operations and ordering
 * Part of the modular refactoring - Phase 5
 * 
 * Uses global namespace pattern for offline-first compatibility
 */

// Create namespace if it doesn't exist
window.QuizModules = window.QuizModules || {};

// Define the question management module
window.QuizModules.Questions = (function() {
    'use strict';
    
    /**
     * Add or update a question in the current test
     * @param {Object} quizData - Main quiz data object
     * @param {number} currentTestIndex - Index of current test
     * @param {number} currentQuestionIndex - Index of question being edited (null for new)
     * @returns {Object} Updated state object
     */
    function addOrUpdateQuestion(quizData, currentTestIndex, currentQuestionIndex) {
        const test = quizData.tests[currentTestIndex];
        if(!test){
            alert("No test selected!")
            return { success: false };
        }
        
        // Get rich text content from Quill editor using module
        const questionContent = window.QuizModules.RichText.getQuestionContent();
        const questionText = questionContent.text;
        const questionHtml = questionContent.html;
        const questionDelta = questionContent.delta;
        let image = document.getElementById("imagePath").value;
        let imagePreviewData = null;
        
        if (image) {
            const fileName = image.split('/').pop(); // Extract the file name from the path
            image = `test_image_assets/${fileName}`;
            
            // Get the preview data for editing purposes
            const preview = document.getElementById("imagePreview");
            imagePreviewData = preview.dataset.imageData || null;
        }
        const questionType = document.getElementById("questionType").value;
        const selectedOptionCount = questionType === 'true-false' ? 2 : parseInt(document.getElementById("optionCount").value);
        
        // Check if option editors are initialized using module
        if (!window.QuizModules.RichText.areEditorsReady()) {
            alert("Option editors not properly initialized. Please refresh the page.");
            return { success: false };
        }
        
        // Get rich text content from option editors using module
        const optionData = window.QuizModules.RichText.getOptionContent();
        
        // Extract plain text values for backward compatibility
        const option1 = optionData[0].text;
        const option2 = optionData[1].text;
        const option3 = optionData[2].text;
        const option4 = optionData[3].text;
        const option5 = optionData[4].text;
        const option6 = optionData[5].text;
        const correctAnswer = document.getElementById("correctAnswer").value;
        const category = document.getElementById("category").value;
        const difficulty = document.getElementById("difficulty").value;
        const points = parseInt(document.getElementById("points").value);

        // Validate based on question type and option count
        const allOptions = [option1, option2, option3, option4, option5, option6];
        const requiredOptions = allOptions.slice(0, selectedOptionCount);
        
        // Validate required fields
        if (!category || !difficulty || !correctAnswer) {
            alert("Please fill all the required fields");
            return { success: false };
        }
        
        // Validate question content
        if (!questionText || questionText.trim() === '') {
            alert("Please enter a question");
            return { success: false };
        }
        
        // Check that all required options are filled
        for (let i = 0; i < selectedOptionCount; i++) {
            if (!requiredOptions[i] || requiredOptions[i].trim() === '') {
                const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                alert(`Please fill in option ${letters[i]}`);
                return { success: false };
            }
        }
        
        // Create flexible question structure with rich text support
        const options = {};
        const optionsHtml = {};
        const optionsDelta = {};
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        
        for (let i = 0; i < selectedOptionCount; i++) {
            options[letters[i]] = requiredOptions[i];           // Plain text for backward compatibility
            optionsHtml[letters[i]] = optionData[i].html;       // Rich HTML for display
            optionsDelta[letters[i]] = optionData[i].delta;     // Delta format for editing
        }
        
        const newQuestion = {
            question: questionText,           // Plain text for fallback
            questionHtml: questionHtml,       // Rich HTML for display
            questionDelta: questionDelta,     // Delta format for editing
            image: image,
            imagePreviewData: imagePreviewData,
            questionType: questionType,
            optionCount: selectedOptionCount,
            options: options,               // Plain text options for backward compatibility
            optionsHtml: optionsHtml,       // Rich HTML options for display
            optionsDelta: optionsDelta,     // Delta format options for editing
            correctAnswer: window.QuizModules.Utils.convertInternalToLetter(correctAnswer), // Convert option1->A, etc.
            category: category,
            difficulty: difficulty,
            points: points,
            // ALSO store old format for backward compatibility
            option1: option1,
            option2: option2,
            option3: option3,
            option4: option4,
            option5: option5,
            option6: option6
        };

        const isEditing = currentQuestionIndex !== null;
        
        if(currentQuestionIndex !== null){
            // Editing existing question - preserve position
            test.questions[currentQuestionIndex] = {...test.questions[currentQuestionIndex], ...newQuestion};
            currentQuestionIndex = null;

        }else{
            // Adding new question - assign next available position
            newQuestion.id = 'q-' + Math.floor(Math.random() * 1000000);
            newQuestion.position = test.questions.length + 1;
            test.questions.push(newQuestion);
            
            // Ensure all questions have positions and update them
            updateQuestionPositions(test.questions);
        }

        return {
            success: true,
            isEditing: isEditing,
            questions: test.questions,
            newQuestionIndex: null
        };
    }
    
    /**
     * Edit a question - populate form with question data
     * @param {Object} quizData - Main quiz data object
     * @param {number} currentTestIndex - Index of current test
     * @param {number} index - Index of question to edit
     */
    function editQuestion(quizData, currentTestIndex, index) {
        const test = quizData.tests[currentTestIndex];
        const question = test.questions[index];

        // Smooth scroll to form with animation
        const formSection = document.getElementById("question-form-section");
        formSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });

        // Add visual feedback to the form
        setTimeout(() => {
            const formContainer = formSection.parentElement;
            formContainer.style.transition = 'all 0.3s ease';
            formContainer.style.transform = 'scale(1.02)';
            formContainer.style.boxShadow = '0 4px 20px rgba(52, 152, 219, 0.3)';
            
            // Reset after animation
            setTimeout(() => {
                formContainer.style.transform = '';
                formContainer.style.boxShadow = '';
            }, 600);
        }, 500);

        // Populate rich text editor using module
        window.QuizModules.RichText.setQuestionContent(question);

        if(question.image){
            document.getElementById("imagePath").value = question.image||"";
            const preview = document.getElementById("imagePreview");
            
            // Use stored preview data if available, otherwise try to load the image path (only if it's a data URL)
            if (question.imagePreviewData) {
                preview.src = question.imagePreviewData;
                preview.dataset.imageData = question.imagePreviewData;
                preview.style.display = 'block';
            } else if (question.image && question.image.startsWith('data:')) {
                preview.src = question.image;
                preview.dataset.imageData = question.image;
                preview.style.display = 'block';
            } else {
                // File path - show placeholder or hide preview
                preview.src = '';
                preview.dataset.imageData = '';
                preview.style.display = 'none';
            }
        }else{
            const preview = document.getElementById("imagePreview");
            preview.src = '';
            preview.dataset.imageData = '';
            preview.style.display = 'none';
        }
        
        // Set question type and option count
        const questionType = question.questionType || 'multiple-choice';
        const optionCount = question.optionCount || 4;
        
        document.getElementById("questionType").value = questionType;
        if (questionType === 'multiple-choice') {
            document.getElementById("optionCount").value = optionCount;
        }
        window.QuizModules.UI.updateQuestionTypeUI(); // This will set up the options visibility and dropdown
        
        // Set options in rich text editors using module
        window.QuizModules.RichText.setOptionContent(question);
        
        // Set correct answer (handle both letter and internal format)
        if (question.correctAnswer && question.correctAnswer.match(/^[A-F]$/)) {
            // Letter format - convert to internal
            document.getElementById("correctAnswer").value = window.QuizModules.Utils.convertLetterToInternal(question.correctAnswer);
        } else {
            // Internal format
            document.getElementById("correctAnswer").value = question.correctAnswer;
        }
        document.getElementById("category").value = question.category;
        document.getElementById("points").value = question.points;
        document.getElementById("difficulty").value = question.difficulty;

        // Focus on the question editor for immediate editing
        setTimeout(() => {
            // Use the RichText module to focus the question editor
            window.QuizModules.RichText.focusQuestionEditor();
        }, 800);
        
        return index; // Return the question index for setting currentQuestionIndex
    }
    
    /**
     * Delete a question from the test
     * @param {Object} quizData - Main quiz data object
     * @param {number} currentTestIndex - Index of current test
     * @param {number} index - Index of question to delete
     * @returns {Array} Updated questions array
     */
    function deleteQuestion(quizData, currentTestIndex, index) {
        const test = quizData.tests[currentTestIndex];
        test.questions.splice(index, 1);
        return test.questions;
    }
    
    /**
     * Update question positions after reordering
     * @param {Array} questions - Array of questions
     */
    function updateQuestionPositions(questions) {
        questions.forEach((question, index) => {
            question.position = index + 1;
        });
    }
    
    /**
     * Move question up in the order
     * @param {Object} quizData - Main quiz data object
     * @param {number} currentTestIndex - Index of current test
     * @param {number} index - Index of question to move up
     * @returns {Array} Updated questions array
     */
    function moveQuestionUp(quizData, currentTestIndex, index) {
        if (index <= 0) return null;
        
        const test = quizData.tests[currentTestIndex];
        const questions = test.questions;
        
        // Swap questions
        [questions[index - 1], questions[index]] = [questions[index], questions[index - 1]];
        
        // Update positions
        updateQuestionPositions(questions);
        
        return questions;
    }
    
    /**
     * Move question down in the order
     * @param {Object} quizData - Main quiz data object
     * @param {number} currentTestIndex - Index of current test
     * @param {number} index - Index of question to move down
     * @returns {Array} Updated questions array
     */
    function moveQuestionDown(quizData, currentTestIndex, index) {
        const test = quizData.tests[currentTestIndex];
        const questions = test.questions;
        
        if (index >= questions.length - 1) return null;
        
        // Swap questions
        [questions[index], questions[index + 1]] = [questions[index + 1], questions[index]];
        
        // Update positions
        updateQuestionPositions(questions);
        
        return questions;
    }
    
    /**
     * Handle "Add Another Question" action from success dialog
     */
    function addAnotherQuestion() {
        window.QuizModules.UI.closeSuccessDialog();
        document.getElementById("question-form-section").scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        setTimeout(() => {
            // Use the RichText module to focus the question editor
            window.QuizModules.RichText.focusQuestionEditor();
        }, 500);
    }
    
    /**
     * Handle post-question-add workflow
     * @param {boolean} isEditing - Whether this was an edit or new question
     * @param {Array} questions - Updated questions array
     */
    function handlePostQuestionWorkflow(isEditing, questions) {
        // Re-render questions and update totals
        window.QuizModules.UI.renderQuestions(questions);
        window.QuizModules.UI.updateTotalPoints(questions);
        
        // For new questions: show brief success + auto-scroll back to form
        if (!isEditing) {
            window.QuizModules.UI.showBriefSuccessAndScrollToForm();
        } else {
            // For edited questions, just scroll to the questions list to show the updated question
            setTimeout(() => {
                document.getElementById("questionList").scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 300);
        }
    }
    
    // Register this module with the loader
    if (window.QuizModules.Loader) {
        window.QuizModules.Loader.registerModule('Questions', '1.4.0');
    }
    
    // Public API
    return {
        // Core CRUD operations
        addOrUpdateQuestion: addOrUpdateQuestion,
        editQuestion: editQuestion,
        deleteQuestion: deleteQuestion,
        
        // Question ordering
        moveQuestionUp: moveQuestionUp,
        moveQuestionDown: moveQuestionDown,
        updateQuestionPositions: updateQuestionPositions,
        
        // Workflow helpers
        addAnotherQuestion: addAnotherQuestion,
        handlePostQuestionWorkflow: handlePostQuestionWorkflow
    };
})();