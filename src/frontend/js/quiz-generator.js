/* Quiz Generator JavaScript */

// Global Variables
let quizData = { tests: [] }; // Store all tests
let currentTestIndex = -1;      // Index of the currently selected test
let currentQuestionIndex = null // Index of the currently selected question
let questionEditor = null;     // Quill rich text editor instance
let optionEditors = [];        // Array to store option editor instances

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

// Test Library Management
let testLibrary = [];
let activeTestId = null;

// Question type management
function updateQuestionTypeUI() {
    const questionType = document.getElementById('questionType').value;
    const optionCountContainer = document.getElementById('optionCountContainer');
    const optionCount = document.getElementById('optionCount');
    
    if (questionType === 'true-false') {
        // Hide option count selector for true/false
        optionCountContainer.style.display = 'none';
        optionCount.value = '2';
        updateOptionCount(); // Update to show only A, B
        
        // True/False questions should ALWAYS have "True" and "False" as options
        if (optionEditors && optionEditors.length >= 2) {
            optionEditors[0].setText('True');
            optionEditors[1].setText('False');
            
            // Disable the option editors for true/false (make them read-only)
            optionEditors[0].disable();
            optionEditors[1].disable();
        }
        
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
        
        // Enable all option editors for multiple choice
        if (optionEditors && optionEditors.length >= 2) {
            optionEditors.forEach(editor => {
                editor.enable();
            });
        }
    }
}

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

function generateOptionDisplayHTML(question) {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const optionCount = question.optionCount || 4;
    let html = '';
    
    for (let i = 0; i < optionCount; i++) {
        const letter = letters[i];
        const optionValue = question.options?.[letter] || question[`option${i+1}`] || '';
        html += `<span><strong>${letter})</strong> ${optionValue}</span>`;
    }
    
    return html;
}

// Built-in sample tests
const sampleTests = [
    {
        id: 'sample-math-basic',
        name: 'Basic Math Quiz',
        description: 'Simple arithmetic for elementary students',
        data: {
            tests: [{
                testName: 'Basic Math Quiz',
                testID: 'math-001',
                questions: [
                    {
                        question: 'What is 5 + 3?',
                        options: { A: '6', B: '7', C: '8', D: '9' },
                        correctAnswer: 'C',
                        difficulty: 'easy',
                        points: 1,
                        category: 'arithmetic',
                        position: 1,
                        id: 'q1'
                    },
                    {
                        question: 'What is 12 ÷ 4?',
                        options: { A: '2', B: '3', C: '4', D: '6' },
                        correctAnswer: 'B',
                        difficulty: 'easy',
                        points: 1,
                        category: 'arithmetic',
                        position: 2,
                        id: 'q2'
                    }
                ]
            }]
        }
    },
    {
        id: 'sample-science-mixed',
        name: 'Mixed Science Quiz',
        description: 'Biology, Chemistry, and Physics questions',
        data: {
            tests: [{
                testName: 'Mixed Science Quiz',
                testID: 'science-001',
                questions: [
                    {
                        question: 'What is the chemical symbol for water?',
                        options: { A: 'H2O', B: 'CO2', C: 'NaCl', D: 'O2' },
                        correctAnswer: 'A',
                        difficulty: 'easy',
                        points: 2,
                        category: 'chemistry',
                        position: 1,
                        id: 'q1'
                    },
                    {
                        question: 'Which planet is closest to the Sun?',
                        options: { A: 'Venus', B: 'Earth', C: 'Mercury', D: 'Mars' },
                        correctAnswer: 'C',
                        difficulty: 'medium',
                        points: 3,
                        category: 'astronomy',
                        position: 2,
                        id: 'q2'
                    },
                    {
                        question: 'What is the powerhouse of the cell?',
                        options: { A: 'Nucleus', B: 'Mitochondria', C: 'Ribosome', D: 'Chloroplast' },
                        correctAnswer: 'B',
                        difficulty: 'hard',
                        points: 5,
                        category: 'biology',
                        position: 3,
                        id: 'q3'
                    }
                ]
            }]
        }
    }
];

// Test Library Functions
function initializeTestLibrary() {
    // Load from localStorage
    const savedTests = localStorage.getItem('quizTestLibrary');
    if (savedTests) {
        try {
            testLibrary = JSON.parse(savedTests);
        } catch (e) {
            console.error('Error loading saved tests:', e);
            testLibrary = [];
        }
    }
    
    // Add sample tests if library is empty
    if (testLibrary.length === 0) {
        testLibrary = [...sampleTests];
        saveTestLibrary();
    }
    
    renderTestLibrary();
}

function saveTestLibrary() {
    localStorage.setItem('quizTestLibrary', JSON.stringify(testLibrary));
}

function renderTestLibrary() {
    const container = document.getElementById('testLibrary');
    container.innerHTML = '';

    testLibrary.forEach(test => {
        const testElement = document.createElement('div');
        testElement.className = `test-item ${activeTestId === test.id ? 'active' : ''}`;
        testElement.onclick = () => loadTestFromLibrary(test.id);

        const metadata = generateTestMetadata(test.data.tests[0]);
        
        testElement.innerHTML = `
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${test.name}</div>
            <div style="font-size: 12px; color: ${activeTestId === test.id ? 'rgba(255,255,255,0.8)' : '#666'}; margin-bottom: 8px;">${test.description}</div>
            <div class="test-metadata">
                <span class="test-badge">${metadata.questionCount} questions</span>
                <span class="test-badge">${metadata.totalPoints} pts</span>
                <span class="test-badge">${metadata.difficulty}</span>
            </div>
        `;

        container.appendChild(testElement);
    });
}

function generateTestMetadata(test) {
    const questions = test.questions || [];
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    
    // Calculate difficulty mix
    const difficulties = questions.map(q => q.difficulty || 'easy');
    const diffCounts = difficulties.reduce((acc, diff) => {
        acc[diff] = (acc[diff] || 0) + 1;
        return acc;
    }, {});
    
    const maxDiff = Object.keys(diffCounts).reduce((a, b) => 
        diffCounts[a] > diffCounts[b] ? a : b, 'easy');

    return {
        questionCount: questions.length,
        totalPoints,
        difficulty: maxDiff
    };
}

function loadTestFromLibrary(testId) {
    const test = testLibrary.find(t => t.id === testId);
    if (!test) return;

    // Set as active
    activeTestId = testId;
    renderTestLibrary();

    // Load the test data and convert format if needed
    quizData = JSON.parse(JSON.stringify(test.data)); // Deep copy
    
    // Convert all questions to backward compatible format for internal use
    if (quizData.tests && quizData.tests[0] && quizData.tests[0].questions) {
        quizData.tests[0].questions = quizData.tests[0].questions.map(question => {
            return createBackwardCompatibleQuestion(question);
        });
    }
    
    currentTestIndex = 0;
    
    // Update UI
    populateTestSelect();
    selectTest(0);
    updateCreateButtonText();
}

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

function showTestLoadedMessage(testName) {
    // Create brief success toast
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #27ae60, #2ecc71);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4);
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
    `;
    
    successDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">📚</span>
            <span>Loaded: ${testName}</span>
        </div>
    `;

    document.body.appendChild(successDiv);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.remove();
                }
            }, 300);
        }
    }, 3000);
}

function loadTestFiles() {
    document.getElementById('testFileInput').click();
}

function handleTestFiles(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const testData = JSON.parse(e.target.result);
                addTestToLibrary(file.name, testData);
            } catch (error) {
                alert(`Error loading ${file.name}: ${error.message}`);
            }
        };
        reader.readAsText(file);
    });

    // Clear the input
    event.target.value = '';
}

function addTestToLibrary(filename, testData) {
    const testName = filename.replace('.json', '');
    const test = testData.tests && testData.tests[0] ? testData.tests[0] : testData;
    const proposedName = test.testName || testName;
    
    // Check for duplicates by name and content
    const existingTest = testLibrary.find(t => 
        t.name === proposedName || 
        JSON.stringify(t.data) === JSON.stringify(testData.tests ? testData : { tests: [test] })
    );
    
    if (existingTest) {
        // Show duplicate warning
        const confirmReplace = confirm(
            `A test named "${proposedName}" already exists in your library.\n\n` +
            'Do you want to replace it with the new version?'
        );
        
        if (confirmReplace) {
            // Replace existing test
            const index = testLibrary.findIndex(t => t.id === existingTest.id);
            testLibrary[index] = {
                ...existingTest,
                name: proposedName,
                description: `Updated from ${filename}`,
                data: testData.tests ? testData : { tests: [test] }
            };
            saveTestLibrary();
            renderTestLibrary();
            loadTestFromLibrary(existingTest.id);
            
            showTestLoadedMessage(`Updated: ${proposedName}`);
        }
        return;
    }
    
    const newLibraryItem = {
        id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        name: proposedName,
        description: `Imported from ${filename}`,
        data: testData.tests ? testData : { tests: [test] }
    };

    testLibrary.push(newLibraryItem);
    saveTestLibrary();
    renderTestLibrary();
    
    // Auto-load the newly added test
    loadTestFromLibrary(newLibraryItem.id);
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
    const file = event.target.files[0];
    if (file) {
        document.getElementById('imagePath').value = file.name;
        
        // Show image preview and store the data URL for later use
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
            
            // Store the image data URL for editing purposes
            preview.dataset.imageData = e.target.result;
        };
        reader.readAsDataURL(file);
    }
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

function loadJSON(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const loadedData = JSON.parse(e.target.result);
                if (!loadedData || !loadedData.tests || !Array.isArray(loadedData.tests)) {
                    quizData = { tests: [] }; // Reset if the structure is invalid
                    return;
                }
                
                // Convert loaded data to internal format
                quizData = {
                    tests: loadedData.tests.map(test => ({
                        testName: test.testName,
                        testId: test.testID || test.testId, // Handle both formats
                        questions: test.questions.map(q => {
                            // Convert from export format back to internal format
                            if (q.options && typeof q.options === 'object') {
                                // New format with A/B/C/D object
                                return {
                                    question: q.question,
                                    questionHtml: q.questionHtml,
                                    questionDelta: q.questionDelta,
                                    image: q.image,
                                    imagePreviewData: q.image && q.image.startsWith('data:') ? q.image : null, // Only use data URLs as preview data
                                    questionType: q.questionType || "multiple-choice",
                                    optionCount: q.optionCount || 4,
                                    options: q.options,
                                    option1: q.options.A || q.option1,
                                    option2: q.options.B || q.option2,
                                    option3: q.options.C || q.option3,
                                    option4: q.options.D || q.option4,
                                    option5: q.options.E || q.option5,
                                    option6: q.options.F || q.option6,
                                    correctAnswer: q.correctAnswer === 'A' ? 'option1' :
                                                  q.correctAnswer === 'B' ? 'option2' :
                                                  q.correctAnswer === 'C' ? 'option3' :
                                                  q.correctAnswer === 'D' ? 'option4' :
                                                  q.correctAnswer === 'E' ? 'option5' :
                                                  q.correctAnswer === 'F' ? 'option6' : 'option1',
                                    category: q.category,
                                    difficulty: q.difficulty,
                                    points: q.points || 1,
                                    id: q.id || 'q-' + Math.floor(Math.random() * 1000000)
                                };
                            } else {
                                // Old format - return as is
                                return q;
                            }
                        })
                    }))
                };
                
                populateTestSelect();
            } catch (error) {
                alert("Error parsing JSON: " + error.message);
            }
        };
        reader.readAsText(file);
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

function createNewQuiz() {
    // Always create a completely new test - don't just add to existing
    
    // Reset global state to allow fresh start
    activeTestId = null;
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
    updateQuestionList(); // Clear any previously displayed questions
    
    // Scroll to question form
    setTimeout(() => {
        document.getElementById("question-form-section").scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        // Focus on the question field
        setTimeout(() => {
            // Focus on the Quill editor instead of the non-existent question field
            if (questionEditor) {
                questionEditor.focus();
            }
        }, 500);
    }, 300);
}

// Question Management Functions
function addOrUpdateQuestion() {
    const test = quizData.tests[currentTestIndex];
    if(!test){
        alert("No test selected!")
        return;
    }
    // Get rich text content from Quill editor
    const questionText = questionEditor.getText().trim();
    const questionHtml = questionEditor.root.innerHTML;
    const questionDelta = questionEditor.getContents();
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
    
    // Check if option editors are initialized
    if (!optionEditors || optionEditors.length < 6) {
        alert("Option editors not properly initialized. Please refresh the page.");
        return;
    }
    
    // Get rich text content from option editors with cleanup
    const optionData = optionEditors.map(editor => {
        if (!editor) {
            return { text: '', html: '', delta: { ops: [] } };
        }
        
        const text = editor.getText().replace(/\n/g, '').trim();
        
        // Get HTML by manually converting Delta to HTML
        let html = '';
        try {
            const delta = editor.getContents();
            html = deltaToHtml(delta);
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
        return;
    }
    
    // Validate question content
    if (!questionText || questionText.trim() === '') {
        alert("Please enter a question");
        return;
    }
    
    // Check that all required options are filled
    for (let i = 0; i < selectedOptionCount; i++) {
        if (!requiredOptions[i] || requiredOptions[i].trim() === '') {
            const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
            alert(`Please fill in option ${letters[i]}`);
            return;
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
        correctAnswer: convertInternalToLetter(correctAnswer), // Convert option1->A, etc.
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

    clearQuestionForm();
    renderQuestions(test.questions);
    updateTotalPoints(test.questions);
    
    // For new questions: show brief success + auto-scroll back to form
    if (!isEditing) {
        showBriefSuccessAndScrollToForm();
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

function renderQuestions(questions) {
    const questionsList = document.getElementById("questions");
    const emptyState = document.getElementById("emptyState");
    
    questionsList.innerHTML = "";
    
    if (questions.length === 0) {
        emptyState.style.display = "block";
        return;
    }
    
    emptyState.style.display = "none";
    
    // Ensure all questions have positions and sort by position for display
    const sortedQuestions = questions
        .map((question, index) => ({
            ...question,
            position: question.position || (index + 1)
        }))
        .sort((a, b) => a.position - b.position);
    
    sortedQuestions.forEach((question, index) => {
        const questionCard = document.createElement("div");
        questionCard.className = "question-card";
        questionCard.dataset.index = index;
        questionCard.style.cssText = `
            background: white; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 8px; 
            border-left: 4px solid ${getDifficultyColor(question.difficulty)}; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.2s ease;
        `;
        
        const difficultyEmoji = getDifficultyEmoji(question.difficulty);
        // Use imagePreviewData if available, otherwise fallback to image path (only if it's a data URL)
        const imageSrc = question.imagePreviewData || (question.image && question.image.startsWith('data:') ? question.image : null);
        const imagePreview = imageSrc ? `<img src="${imageSrc}" style="max-width: 80px; max-height: 50px; object-fit: cover; border-radius: 4px;">` : '';
        
        questionCard.innerHTML = `
            <div style="display: flex; gap: 15px; align-items: center;">
                <div class="question-order" style="flex-shrink: 0; background: #34495e; color: white; width: 32px; height: 32px; border-radius: 50%; position: relative; font-size: 14px; font-weight: bold;">
                    <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">${index + 1}</span>
                </div>
                ${imagePreview ? `<div style="flex-shrink: 0;">${imagePreview}</div>` : ''}
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span style="background: ${getDifficultyColor(question.difficulty)}; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; font-weight: bold;">
                            ${difficultyEmoji} ${question.difficulty.toUpperCase()}
                        </span>
                        <span style="background: #f39c12; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; font-weight: bold;">
                            ${question.points} pts
                        </span>
                        <span style="background: #95a5a6; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; font-weight: bold;">
                            ${question.category}
                        </span>
                    </div>
                    <div style="margin: 0 0 8px 0; color: #2c3e50; font-size: 16px; line-height: 1.3; font-weight: bold;">${question.questionHtml || question.question}</div>
                    <div style="display: flex; gap: 15px; font-size: 13px; color: #7f8c8d; flex-wrap: wrap;">
                        ${generateOptionDisplayHTML(question)}
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px; flex-shrink: 0;">
                    <button onclick="moveQuestionUp(${index})" ${index === 0 ? 'disabled' : ''} 
                            style="background: ${index === 0 ? '#bdc3c7' : '#9b59b6'}; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: ${index === 0 ? 'not-allowed' : 'pointer'}; font-size: 14px; min-height: 36px; font-weight: bold;" 
                            title="Move up">↑</button>
                    <button onclick="moveQuestionDown(${index})" ${index === sortedQuestions.length - 1 ? 'disabled' : ''} 
                            style="background: ${index === sortedQuestions.length - 1 ? '#bdc3c7' : '#9b59b6'}; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: ${index === sortedQuestions.length - 1 ? 'not-allowed' : 'pointer'}; font-size: 14px; min-height: 36px; font-weight: bold;" 
                            title="Move down">↓</button>
                </div>
                <div style="display: flex; gap: 8px; flex-shrink: 0;">
                    <button onclick="editQuestion(${index})" style="background: #3498db; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">✏️ Edit</button>
                    <button onclick="deleteQuestion(${index})" style="background: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">🗑️ Delete</button>
                </div>
            </div>
        `;
        
        questionsList.appendChild(questionCard);
    });
}

function getDifficultyColor(difficulty) {
    switch(difficulty) {
        case 'easy': return '#27ae60';
        case 'medium': return '#f39c12';
        case 'hard': return '#e74c3c';
        default: return '#95a5a6';
    }
}

function getDifficultyEmoji(difficulty) {
    switch(difficulty) {
        case 'easy': return '✓';
        case 'medium': return '⚡';
        case 'hard': return '⭐';
        default: return '•';
    }
}

function editQuestion(index){
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

    // Populate rich text editor
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
    updateQuestionTypeUI(); // This will set up the options visibility and dropdown
    
    // Set options in rich text editors
    if (optionEditors && optionEditors.length >= 6) {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        
        for (let i = 0; i < 6; i++) {
            let optionText = '';
            let optionHtml = '';
            let optionDelta = null;
            
            // Check for rich text option data first
            if (question.optionsDelta && question.optionsDelta[letters[i]]) {
                optionDelta = question.optionsDelta[letters[i]];
                optionEditors[i].setContents(optionDelta);
            } else if (question.optionsHtml && question.optionsHtml[letters[i]]) {
                optionHtml = question.optionsHtml[letters[i]];
                optionEditors[i].root.innerHTML = optionHtml;
            } else if (question.options && question.options[letters[i]]) {
                // New plain text format
                optionText = question.options[letters[i]];
                optionEditors[i].setText(optionText);
            } else {
                // Old format fallback
                optionText = question[`option${i + 1}`] || '';
                optionEditors[i].setText(optionText);
            }
        }
    }
    
    // Set correct answer (handle both letter and internal format)
    if (question.correctAnswer && question.correctAnswer.match(/^[A-F]$/)) {
        // Letter format - convert to internal
        document.getElementById("correctAnswer").value = convertLetterToInternal(question.correctAnswer);
    } else {
        // Internal format
        document.getElementById("correctAnswer").value = question.correctAnswer;
    }
    document.getElementById("category").value = question.category;
    document.getElementById("points").value = question.points;
    document.getElementById("difficulty").value = question.difficulty;

    currentQuestionIndex = index;
    updateQuestionButtonText(); // Update button text for editing mode
    
    // Focus on the question textarea for immediate editing
    setTimeout(() => {
        document.getElementById("question").focus();
    }, 800);
}

function deleteQuestion(index) {
    const test = quizData.tests[currentTestIndex];
    test.questions.splice(index, 1);
    renderQuestions(test.questions);
    updateTotalPoints(test.questions);
}

// Position management function
function updateQuestionPositions(questions) {
    questions.forEach((question, index) => {
        question.position = index + 1;
    });
}

// Question reordering functions
function moveQuestionUp(index) {
    if (index <= 0) return;
    
    const test = quizData.tests[currentTestIndex];
    const questions = test.questions;
    
    // Swap questions
    [questions[index - 1], questions[index]] = [questions[index], questions[index - 1]];
    
    // Update positions
    updateQuestionPositions(questions);
    
    // Re-render and update
    renderQuestions(questions);
    updateTotalPoints(questions);
}

function moveQuestionDown(index) {
    const test = quizData.tests[currentTestIndex];
    const questions = test.questions;
    
    if (index >= questions.length - 1) return;
    
    // Swap questions
    [questions[index], questions[index + 1]] = [questions[index + 1], questions[index]];
    
    // Update positions
    updateQuestionPositions(questions);
    
    // Re-render and update
    renderQuestions(questions);
    updateTotalPoints(questions);
}

// Success dialog functions
function showBriefSuccessAndScrollToForm() {
    // Show success message with user choices
    showSuccessWithChoices();
}

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
                gap: 10px;
            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                <span style="font-size: 20px;">➕</span>
                <span>Add Another Question</span>
            </button>
            
            <button onclick="reviewAndOrder()" style="
                background: linear-gradient(135deg, #9b59b6, #8e44ad);
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
                gap: 10px;
            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                <span style="font-size: 20px;">📝</span>
                <span>Review & Reorder Questions</span>
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
                gap: 10px;
            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                <span style="font-size: 20px;">💾</span>
                <span>Save & Export Quiz</span>
            </button>
            
            <button onclick="closeSuccessDialog()" style="
                background: none;
                color: #95a5a6;
                border: 2px solid #ecf0f1;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                margin-top: 10px;
            ">
                ✕ Just Close This
            </button>
        </div>
    `;

    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'success-backdrop';
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
}

function addAnotherQuestion() {
    closeSuccessDialog();
    document.getElementById("question-form-section").scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
    setTimeout(() => {
        document.getElementById("question").focus();
    }, 500);
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
    const dialog = document.getElementById('success-choices');
    const backdrop = document.getElementById('success-backdrop');
    
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

function updateQuestionButtonText() {
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

function clearQuestionForm(){
    // Clear rich text editor
    if (questionEditor) {
        questionEditor.setText('');
    }
    document.getElementById("imagePath").value = "";
    document.getElementById("questionType").value = "multiple-choice";
    document.getElementById("optionCount").value = "4";
    updateQuestionTypeUI(); // Reset to multiple choice view
    // Clear option editors
    if (optionEditors && optionEditors.length >= 6) {
        optionEditors.forEach(editor => {
            editor.setText('');
        });
    }
    document.getElementById("correctAnswer").value = "option1";
    document.getElementById("category").value = "";
    document.getElementById("points").value = 1;
    document.getElementById("difficulty").value = "easy";
    
    // Hide image preview
    const preview = document.getElementById("imagePreview");
    preview.src = '';
    preview.dataset.imageData = '';
    preview.style.display = 'none';
    
    currentQuestionIndex = null;
    updateQuestionButtonText(); // Update button text when clearing form
}

// JSON Generation and Export Functions
function generateJSON() {
    // Update testName from the input element
    const quizNameInput = document.getElementById("quizName").value;
    const test = quizData.tests[currentTestIndex];
    test.testName = quizNameInput;

    // Ensure all questions have positions and sort by position
    const sortedQuestions = test.questions
        .map((question, index) => ({
            ...question,
            position: question.position || (index + 1)
        }))
        .sort((a, b) => a.position - b.position);

    // Create a new object for JSON output
    const outputTest = {
        testName: test.testName,
        testID: test.testId,
        questions: sortedQuestions.map(question => {
            // Build options object (new format)
            const options = question.options || {
                A: question.option1,
                B: question.option2,
                C: question.option3,
                D: question.option4
            };
            
            // If we have E or F options, add them
            if (question.option5) options.E = question.option5;
            if (question.option6) options.F = question.option6;
            
            // Export in the new flexible format with BOTH old and new formats
            const exportQuestion = {
                question: question.question,
                questionHtml: question.questionHtml,
                questionDelta: question.questionDelta,
                image: question.image ? `images/${question.id}_image.${getImageExtension(question.image)}` : null,
                questionType: question.questionType || "multiple-choice",
                optionCount: question.optionCount || Object.keys(options).length || 4,
                options: options,
                correctAnswer: question.correctAnswer && question.correctAnswer.match(/^[A-F]$/) 
                    ? question.correctAnswer 
                    : convertInternalToLetter(question.correctAnswer),
                category: question.category,
                difficulty: question.difficulty,
                points: question.points,
                position: question.position,
                id: question.id
            };
            
            // Also include old format fields for backward compatibility
            exportQuestion.option1 = options.A || '';
            exportQuestion.option2 = options.B || '';
            exportQuestion.option3 = options.C || '';
            exportQuestion.option4 = options.D || '';
            if (options.E) exportQuestion.option5 = options.E;
            if (options.F) exportQuestion.option6 = options.F;
            
            return exportQuestion;
        })
    };

    const jsonData = JSON.stringify({tests: [outputTest]}, null, 4);
    document.getElementById("jsonOutput").innerText = jsonData;
    return jsonData;
}

async function downloadZIP() {
    // Check if JSZip is available
    if (typeof JSZip === 'undefined') {
        alert('ZIP functionality is not available. Please download the JSON file instead or ensure jszip.min.js is in the same folder.');
        return;
    }
    
    const jsonData = generateJSON();
    if (!jsonData) return;

    const test = quizData.tests[currentTestIndex];
    const testName = test.testName.replace(/\s+/g, '_');
    const testID = test.testId;
    const date = new Date().toISOString().split('T')[0];

    const zip = new JSZip();
    
    // Add JSON file
    zip.file(`${testName}_${testID}_${date}.json`, jsonData);
    
    // Add images folder
    const imagesFolder = zip.folder("images");
    
    // Collect all images from questions
    const imagePromises = test.questions
        .filter(q => q.imagePreviewData) // Only questions with actual image data
        .map(async (question) => {
            try {
                const imageData = question.imagePreviewData;
                const extension = getImageExtension(imageData);
                const filename = `${question.id}_image.${extension}`;
                
                // Convert data URL to blob
                const response = await fetch(imageData);
                const blob = await response.blob();
                
                imagesFolder.file(filename, blob);
            } catch (error) {
                console.error(`Error processing image for question ${question.id}:`, error);
            }
        });
        
    // Wait for all images to be processed
    await Promise.all(imagePromises);
    
    // Generate and download ZIP
    const zipBlob = await zip.generateAsync({type: "blob"});
    const url = URL.createObjectURL(zipBlob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `${testName}_${testID}_${date}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Generate JSON with embedded images for standalone use
function generateEmbeddedJSON() {
    const quizNameInput = document.getElementById("quizName").value;
    const test = quizData.tests[currentTestIndex];
    test.testName = quizNameInput;

    // Ensure all questions have positions and sort by position
    const sortedQuestions = test.questions
        .map((question, index) => ({
            ...question,
            position: question.position || (index + 1)
        }))
        .sort((a, b) => a.position - b.position);

    const outputTest = {
        testName: test.testName,
        testID: test.testId,
        questions: sortedQuestions.map(question => {
            // Handle both new and old question formats
            let options = {};
            let correctAnswer = '';
            
            if (question.options && question.questionType) {
                // New format - use the flexible options structure
                options = question.options;
                correctAnswer = question.correctAnswer;
            } else {
                // Old format - convert from option1, option2, etc.
                const optionToLetter = {
                    'option1': 'A',
                    'option2': 'B', 
                    'option3': 'C',
                    'option4': 'D',
                    'option5': 'E',
                    'option6': 'F'
                };
                
                // Build options object from individual option fields
                if (question.option1) options.A = question.option1;
                if (question.option2) options.B = question.option2;
                if (question.option3) options.C = question.option3;
                if (question.option4) options.D = question.option4;
                if (question.option5) options.E = question.option5;
                if (question.option6) options.F = question.option6;
                
                correctAnswer = optionToLetter[question.correctAnswer] || 'A';
            }

            // Create output with BOTH old and new formats for maximum compatibility
            const output = {
                question: question.question,
                questionHtml: question.questionHtml,
                questionDelta: question.questionDelta,
                image: question.imagePreviewData, // Use embedded image data
                questionType: question.questionType || "multiple-choice",
                optionCount: question.optionCount || Object.keys(options).length || 4,
                options: options,
                optionsHtml: question.optionsHtml,     // Rich HTML options for display
                optionsDelta: question.optionsDelta,   // Delta format options for editing
                correctAnswer: correctAnswer,
                category: question.category,
                difficulty: question.difficulty,
                points: question.points,
                position: question.position,
                id: question.id
            };
            
            // Also include old format fields for backward compatibility
            output.option1 = options.A || '';
            output.option2 = options.B || '';
            output.option3 = options.C || '';
            output.option4 = options.D || '';
            if (options.E) output.option5 = options.E;
            if (options.F) output.option6 = options.F;
            
            return output;
        })
    };

    return JSON.stringify({tests: [outputTest]}, null, 4);
}

// Download JSON with embedded images for compatibility
function downloadJSON() {
    const jsonData = generateEmbeddedJSON();
    if (!jsonData) return;

    const test = quizData.tests[currentTestIndex];
    const testName = test.testName.replace(/\s+/g, '_');
    const testID = test.testId;
    const date = new Date().toISOString().split('T')[0];

    const filename = `${testName}_${testID}_${date}.json`;

    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

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

// Sidebar toggle functionality
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

function showNextStepsGuidance() {
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
        <button onclick="closeGuidance()" style="
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

// Initialize Quill rich text editor
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

// Initialize the test library when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeTestLibrary();
    updateCreateButtonText();
    updateQuestionButtonText(); // Initialize the add/update question button text
    initializeQuillEditor(); // Initialize rich text editor
});