/* Quiz Generator JavaScript */

// Global Variables
let quizData = { tests: [] }; // Store all tests
let currentTestIndex = -1;      // Index of the currently selected test
let currentQuestionIndex = null // Index of the currently selected question
// Rich text editors are now managed by QuizModules.RichText

// Helper function to convert Quill Delta to HTML - now using modular version
function deltaToHtml(delta) {
    return window.QuizModules.Utils.deltaToHtml(delta);
}

// Utility functions for flexible question format - now using modular versions
function convertInternalToLetter(internalAnswer) {
    return window.QuizModules.Utils.convertInternalToLetter(internalAnswer);
}

function convertLetterToInternal(letter) {
    return window.QuizModules.Utils.convertLetterToInternal(letter);
}

function getLetterForIndex(index) {
    return window.QuizModules.Utils.getLetterForIndex(index);
}

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

// Test Library Management - now handled by QuizModules.Data
// let testLibrary = [];  // Moved to data module
// let activeTestId = null;  // Moved to data module

// Question type management
function updateQuestionTypeUI() {
    // Delegate to UI module
    window.QuizModules.UI.updateQuestionTypeUI();
}

function updateOptionCount() {
    // Delegate to UI module
    window.QuizModules.UI.updateOptionCount();
}

function updateCorrectAnswerDropdown(optionCount, questionType) {
    // Delegate to UI module
    window.QuizModules.UI.updateCorrectAnswerDropdown(optionCount, questionType);
}

function generateOptionDisplayHTML(question) {
    // Delegate to utils module
    return window.QuizModules.Utils.generateOptionDisplayHTML(question);
}

// Built-in sample tests - moved to QuizModules.Data

// Test Library Functions
function initializeTestLibrary() {
    // Delegate to data module
    window.QuizModules.Data.initializeTestLibrary();
}

function saveTestLibrary() {
    // Delegate to data module
    window.QuizModules.Data.saveTestLibrary();
}

function renderTestLibrary() {
    // Delegate to data module
    window.QuizModules.Data.renderTestLibrary();
}

function generateTestMetadata(test) {
    // Delegate to data module
    return window.QuizModules.Data.generateTestMetadata(test);
}

function loadTestFromLibrary(testId) {
    console.log('[loadTestFromLibrary] Loading test:', testId);
    
    // Delegate to data module and handle the response
    const result = window.QuizModules.Data.loadTestFromLibrary(testId);
    console.log('[loadTestFromLibrary] Result from data module:', result);
    
    if (!result) {
        console.log('[loadTestFromLibrary] No result returned from data module');
        return;
    }

    // Set active test and load data (activeTestId handled by data module)
    quizData = result.quizData;
    currentTestIndex = result.testIndex;
    
    console.log('[loadTestFromLibrary] Set quizData:', quizData);
    console.log('[loadTestFromLibrary] Set currentTestIndex:', currentTestIndex);
    
    // Make sure quiz details container is visible
    document.getElementById("quizDetailsContainer").style.display = "block";
    
    // Update UI
    populateTestSelect();
    selectTest(0);
    updateCreateButtonText();
    
    // Show success message
    window.QuizModules.Data.showTestLoadedMessage(result.testName);
}

// Make loadTestFromLibrary globally available for the test library
window.loadTestFromLibrary = loadTestFromLibrary;

function convertCorrectAnswer(answer) {
    // Convert from letter format (A, B, C, D) to option format (option1, option2, option3, option4)
    const mapping = {
        'A': 'option1',
        'B': 'option2', 
        'C': 'option3',
        'D': 'option4'
    };
    return mapping[answer] || answer;
}


function loadTestFiles() {
    // Delegate to data module
    window.QuizModules.Data.loadTestFiles();
}

function handleTestFiles(event) {
    // Delegate to data module
    window.QuizModules.Data.handleTestFiles(event);
}


// Utility Functions
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

function generateQuizId() {
    const quizId = 'quiz-' + Math.floor(Math.random() * 1000000);
    document.getElementById("quizId").value = quizId;

    // Update testName from the input element
    const quizNameInput = document.getElementById("quizName").value;
    quizData.tests[currentTestIndex].testName = quizNameInput;
    
    // IMPORTANT: Update the actual quiz data with the new test ID
    quizData.tests[currentTestIndex].testId = quizId;

    return quizId;
}

function handleFileSelect(event) {
    // Delegate to data module
    window.QuizModules.Data.handleFileSelect(event);
}

async function ensureImageInDirectory(file, filePath) {
    try {
        const dirHandle = await window.showDirectoryPicker();
        let fileHandle;
        try {
            fileHandle = await dirHandle.getFileHandle(filePath, { create: false });
        } catch (error) {
            if (error.name === 'NotFoundError') {
                fileHandle = await dirHandle.getFileHandle(filePath, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(file);
                await writable.close();
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error("Error accessing file system:", error);
    }
}

async function loadJSON(event) {
    // Delegate to data module
    const loadedData = await window.QuizModules.Data.loadJSON(event);
    if (loadedData) {
        quizData = loadedData;
        populateTestSelect();
    }
}

function populateTestSelect() {
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
        selectTest(0); // Select the first test by default if there are any tests.
    } else {
        quizSelectContainer.style.display = "none";
    }
    document.getElementById("quizDetailsContainer").style.display = "block";
}

function selectTest(index) {
    currentTestIndex = index;
    const test = quizData.tests[index];

    const quizNameInput = document.getElementById("quizName");
    quizNameInput.value = test.testName;
    quizNameInput.onchange = () => {
        test.testName = quizNameInput.value;
    };

    document.getElementById("quizId").value = test.testId;

    // Load Questions of selected test
    const questions = test.questions || [];
    renderQuestions(questions);
    updateTotalPoints(questions);
}

function updateCreateButtonText() {
    // Delegate to UI module
    window.QuizModules.UI.updateCreateButtonText(quizData, currentTestIndex);
}

function createNewQuiz() {
    // Always create a completely new test - don't just add to existing
    
    // Reset global state to allow fresh start (activeTestId handled by data module)
    quizData = { tests: [] };
    currentTestIndex = -1;
    
    // Create completely new quiz
    const newQuiz = {
        testName: "New Quiz",
        testId: 'quiz-' + Math.floor(Math.random() * 1000000),
        questions: []
    };

    quizData.tests.push(newQuiz);
    currentTestIndex = quizData.tests.length - 1;  // Switch to the last test.

    populateTestSelect();   // Refresh test selection menu
    selectTest(currentTestIndex); // Select new test and populate the rest of the form fields
    clearQuestionForm();
    
    // Update UI to reflect clean state
    renderTestLibrary();
    updateCreateButtonText();
    // Clear any previously displayed questions by rendering empty array
    renderQuestions([]);
    
    // Scroll to question form
    setTimeout(() => {
        document.getElementById("question-form-section").scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        // Focus on the question field
        setTimeout(() => {
            // Focus on the Quill editor using module
            window.QuizModules.RichText.focusQuestionEditor();
        }, 500);
    }, 300);
}

// Question Management Functions
function addOrUpdateQuestion() {
    // Delegate to question management module
    const result = window.QuizModules.Questions.addOrUpdateQuestion(quizData, currentTestIndex, currentQuestionIndex);
    
    if (!result.success) return;
    
    // Update global state
    currentQuestionIndex = result.newQuestionIndex;
    
    // Clear form and handle post-workflow
    clearQuestionForm();
    window.QuizModules.Questions.handlePostQuestionWorkflow(result.isEditing, result.questions);
}

function renderQuestions(questions) {
    // Delegate to UI module
    window.QuizModules.UI.renderQuestions(questions);
}

function getDifficultyColor(difficulty) {
    // Delegate to utils module
    return window.QuizModules.Utils.getDifficultyColor(difficulty);
}

function getDifficultyEmoji(difficulty) {
    // Delegate to utils module
    return window.QuizModules.Utils.getDifficultyEmoji(difficulty);
}

function editQuestion(index){
    // Delegate to question management module
    currentQuestionIndex = window.QuizModules.Questions.editQuestion(quizData, currentTestIndex, index);
    updateQuestionButtonText(); // Update button text for editing mode
}

function deleteQuestion(index) {
    // Delegate to question management module
    const updatedQuestions = window.QuizModules.Questions.deleteQuestion(quizData, currentTestIndex, index);
    renderQuestions(updatedQuestions);
    updateTotalPoints(updatedQuestions);
}

// Position management function
function updateQuestionPositions(questions) {
    // Delegate to question management module
    window.QuizModules.Questions.updateQuestionPositions(questions);
}

// Question reordering functions
function moveQuestionUp(index) {
    // Delegate to question management module
    const updatedQuestions = window.QuizModules.Questions.moveQuestionUp(quizData, currentTestIndex, index);
    if (updatedQuestions) {
        renderQuestions(updatedQuestions);
        updateTotalPoints(updatedQuestions);
    }
}

function moveQuestionDown(index) {
    // Delegate to question management module
    const updatedQuestions = window.QuizModules.Questions.moveQuestionDown(quizData, currentTestIndex, index);
    if (updatedQuestions) {
        renderQuestions(updatedQuestions);
        updateTotalPoints(updatedQuestions);
    }
}

// Success dialog functions
function showBriefSuccessAndScrollToForm() {
    // Delegate to UI module
    window.QuizModules.UI.showBriefSuccessAndScrollToForm();
}

function showSuccessWithChoices() {
    // Delegate to UI module
    window.QuizModules.UI.showSuccessWithChoices();
}

function addAnotherQuestion() {
    // Delegate to question management module
    window.QuizModules.Questions.addAnotherQuestion();
}

function reviewAndOrder() {
    closeSuccessDialog();
    document.getElementById("questionList").scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

function saveQuiz() {
    closeSuccessDialog();
    // Scroll to the download section
    const downloadSection = document.querySelector('h2:contains("Download")') || document.querySelector('[style*="Download"]');
    if (downloadSection) {
        downloadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        // Fallback: scroll to bottom where download buttons typically are
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
}

function closeSuccessDialog() {
    // Delegate to UI module
    window.QuizModules.UI.closeSuccessDialog();
}

function updateQuestionButtonText() {
    // Delegate to UI module
    window.QuizModules.UI.updateQuestionButtonText(currentQuestionIndex);
}

function clearQuestionForm(){
    // Delegate to UI module
    window.QuizModules.UI.clearQuestionForm();
    
    currentQuestionIndex = null;
    updateQuestionButtonText(); // Update button text when clearing form
}

// JSON Generation and Export Functions
function generateJSON() {
    // Update testName from the input element
    const quizNameInput = document.getElementById("quizName").value;
    const test = quizData.tests[currentTestIndex];
    test.testName = quizNameInput;

    // Delegate to data module
    const jsonData = window.QuizModules.Data.generateJSON(test);
    if (jsonData) {
        document.getElementById("jsonOutput").innerText = jsonData;
    }
    return jsonData;
}

async function downloadZIP() {
    // Update testName from the input element
    const quizNameInput = document.getElementById("quizName").value;
    const test = quizData.tests[currentTestIndex];
    test.testName = quizNameInput;

    // Delegate to data module
    await window.QuizModules.Data.downloadZIP(test);
}

// Generate JSON with embedded images for standalone use
function generateEmbeddedJSON() {
    // Update testName from the input element
    const quizNameInput = document.getElementById("quizName").value;
    const test = quizData.tests[currentTestIndex];
    test.testName = quizNameInput;

    // Delegate to data module
    return window.QuizModules.Data.generateEmbeddedJSON(test);
}

// Download JSON with embedded images for compatibility
function downloadJSON() {
    // Update testName from the input element
    const quizNameInput = document.getElementById("quizName").value;
    const test = quizData.tests[currentTestIndex];
    test.testName = quizNameInput;

    // Delegate to data module
    window.QuizModules.Data.downloadJSON(test);
}

function updateTotalPoints(questions) {
    // Delegate to UI module
    window.QuizModules.UI.updateTotalPoints(questions);
}

// Sidebar toggle functionality
function toggleSidebar() {
    // Delegate to UI module
    window.QuizModules.UI.toggleSidebar();
}

function showNextStepsGuidance() {
    // Delegate to UI module
    window.QuizModules.UI.showNextStepsGuidance(quizData, currentTestIndex);
}

function showGuidanceMessage(title, message, color) {
    // Delegate to UI module
    window.QuizModules.UI.showGuidanceMessage(title, message, color);
}

function closeGuidance() {
    // Delegate to UI module
    window.QuizModules.UI.closeGuidance();
}

// Initialize Quill rich text editor - now delegated to module
function initializeQuillEditor() {
    window.QuizModules.RichText.initializeQuillEditor();
}

// Initialize the test library when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeTestLibrary();
    updateCreateButtonText();
    updateQuestionButtonText(); // Initialize the add/update question button text
    initializeQuillEditor(); // Initialize rich text editor
});