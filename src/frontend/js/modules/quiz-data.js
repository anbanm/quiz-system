/**
 * Quiz Data Management Module
 * Handles all data persistence, import/export, and test library functionality
 * Part of the modular refactoring - Phase 3
 * 
 * Uses global namespace pattern for offline-first compatibility
 */

// Create namespace if it doesn't exist
window.QuizModules = window.QuizModules || {};

// Define the data management module
window.QuizModules.Data = (function() {
    'use strict';
    
    // Private variables
    let testLibrary = [];
    let activeTestId = null;
    
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
    
    /**
     * Initialize the test library from localStorage or with sample data
     */
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
    
    /**
     * Save test library to localStorage
     */
    function saveTestLibrary() {
        localStorage.setItem('quizTestLibrary', JSON.stringify(testLibrary));
    }
    
    /**
     * Render the test library in the sidebar
     */
    function renderTestLibrary() {
        const container = document.getElementById('testLibrary');
        if (!container) return;
        
        container.innerHTML = '';

        testLibrary.forEach(test => {
            const testElement = document.createElement('div');
            testElement.className = `test-item ${activeTestId === test.id ? 'active' : ''}`;
            testElement.onclick = () => {
                // Call the main loadTestFromLibrary function which handles UI updates
                if (window.loadTestFromLibrary) {
                    window.loadTestFromLibrary(test.id);
                }
            };

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
    
    /**
     * Generate metadata for a test
     * @param {Object} test - Test object
     * @returns {Object} Metadata with question count, points, difficulty
     */
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
    
    /**
     * Load a test from the library
     * @param {string} testId - Test ID to load
     */
    function loadTestFromLibrary(testId) {
        const test = testLibrary.find(t => t.id === testId);
        if (!test) return;

        // Set as active
        activeTestId = testId;
        renderTestLibrary();

        // Load the test data and convert format if needed
        const quizData = JSON.parse(JSON.stringify(test.data)); // Deep copy
        
        // Convert all questions to backward compatible format for internal use
        if (quizData.tests && quizData.tests[0] && quizData.tests[0].questions) {
            quizData.tests[0].questions = quizData.tests[0].questions.map(question => {
                return window.QuizModules.Utils.createBackwardCompatibleQuestion(question);
            });
        }
        
        // Return the quiz data for the main app to use
        return {
            quizData: quizData,
            testIndex: 0,
            testName: test.name
        };
    }
    
    /**
     * Show test loaded success message
     * @param {string} testName - Name of loaded test
     */
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
    
    /**
     * Handle file selection for images
     * @param {Event} event - File input change event
     */
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
    
    /**
     * Load JSON quiz file
     * @param {Event} event - File input change event
     * @returns {Object} Loaded quiz data
     */
    function loadJSON(event) {
        const file = event.target.files[0];
        if (!file) return null;
        
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const loadedData = JSON.parse(e.target.result);
                    if (!loadedData || !loadedData.tests || !Array.isArray(loadedData.tests)) {
                        resolve({ tests: [] }); // Reset if the structure is invalid
                        return;
                    }
                    
                    // Convert loaded data to internal format
                    const quizData = {
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
                                        imagePreviewData: q.image && q.image.startsWith('data:') ? q.image : null,
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
                    
                    resolve(quizData);
                } catch (error) {
                    alert("Error parsing JSON: " + error.message);
                    resolve(null);
                }
            };
            reader.readAsText(file);
        });
    }
    
    /**
     * Handle multiple test file imports
     * @param {Event} event - File input change event
     */
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
    
    /**
     * Add a test to the library
     * @param {string} filename - Original filename
     * @param {Object} testData - Test data to add
     */
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
                
                // Return the updated test info for main app to load
                return {
                    testId: existingTest.id,
                    testName: proposedName,
                    message: `Updated: ${proposedName}`
                };
            }
            return null;
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
        
        // Return the new test info for main app to load
        return {
            testId: newLibraryItem.id,
            testName: proposedName,
            message: `Added: ${proposedName}`
        };
    }
    
    /**
     * Generate JSON for export (with separate images)
     * @param {Object} currentTest - Current test data
     * @returns {string} JSON string
     */
    function generateJSON(currentTest) {
        if (!currentTest) return null;
        
        // Ensure all questions have positions and sort by position
        const sortedQuestions = currentTest.questions
            .map((question, index) => ({
                ...question,
                position: question.position || (index + 1)
            }))
            .sort((a, b) => a.position - b.position);

        // Create a new object for JSON output
        const outputTest = {
            testName: currentTest.testName,
            testID: currentTest.testId,
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
                    image: question.image ? `images/${question.id}_image.${window.QuizModules.Utils.getImageExtension(question.image)}` : null,
                    questionType: question.questionType || "multiple-choice",
                    optionCount: question.optionCount || Object.keys(options).length || 4,
                    options: options,
                    correctAnswer: question.correctAnswer && question.correctAnswer.match(/^[A-F]$/) 
                        ? question.correctAnswer 
                        : window.QuizModules.Utils.convertInternalToLetter(question.correctAnswer),
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

        return JSON.stringify({tests: [outputTest]}, null, 4);
    }
    
    /**
     * Generate JSON with embedded images
     * @param {Object} currentTest - Current test data
     * @returns {string} JSON string with embedded images
     */
    function generateEmbeddedJSON(currentTest) {
        if (!currentTest) return null;
        
        // Ensure all questions have positions and sort by position
        const sortedQuestions = currentTest.questions
            .map((question, index) => ({
                ...question,
                position: question.position || (index + 1)
            }))
            .sort((a, b) => a.position - b.position);

        const outputTest = {
            testName: currentTest.testName,
            testID: currentTest.testId,
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
    
    /**
     * Download ZIP package with separate images
     * @param {Object} currentTest - Current test data
     */
    async function downloadZIP(currentTest) {
        // Check if JSZip is available
        if (typeof JSZip === 'undefined') {
            alert('ZIP functionality is not available. Please download the JSON file instead or ensure jszip.min.js is in the same folder.');
            return;
        }
        
        const jsonData = generateJSON(currentTest);
        if (!jsonData) return;

        const testName = currentTest.testName.replace(/\s+/g, '_');
        const testID = currentTest.testId;
        const date = new Date().toISOString().split('T')[0];

        const zip = new JSZip();
        
        // Add JSON file
        zip.file(`${testName}_${testID}_${date}.json`, jsonData);
        
        // Add images folder
        const imagesFolder = zip.folder("images");
        
        // Collect all images from questions
        const imagePromises = currentTest.questions
            .filter(q => q.imagePreviewData) // Only questions with actual image data
            .map(async (question) => {
                try {
                    const imageData = question.imagePreviewData;
                    const extension = window.QuizModules.Utils.getImageExtension(imageData);
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
    
    /**
     * Download JSON file with embedded images
     * @param {Object} currentTest - Current test data
     */
    function downloadJSON(currentTest) {
        const jsonData = generateEmbeddedJSON(currentTest);
        if (!jsonData) return;

        const testName = currentTest.testName.replace(/\s+/g, '_');
        const testID = currentTest.testId;
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
    
    /**
     * Trigger file selection for test files
     */
    function loadTestFiles() {
        document.getElementById('testFileInput').click();
    }
    
    // Register this module with the loader
    if (window.QuizModules.Loader) {
        window.QuizModules.Loader.registerModule('Data', '1.4.0');
    }
    
    // Public API
    return {
        // Library management
        initializeTestLibrary: initializeTestLibrary,
        saveTestLibrary: saveTestLibrary,
        renderTestLibrary: renderTestLibrary,
        loadTestFromLibrary: loadTestFromLibrary,
        addTestToLibrary: addTestToLibrary,
        showTestLoadedMessage: showTestLoadedMessage,
        loadTestFiles: loadTestFiles,
        
        // File handling
        handleFileSelect: handleFileSelect,
        handleTestFiles: handleTestFiles,
        loadJSON: loadJSON,
        
        // Export functionality
        generateJSON: generateJSON,
        generateEmbeddedJSON: generateEmbeddedJSON,
        downloadZIP: downloadZIP,
        downloadJSON: downloadJSON,
        
        // Utility
        generateTestMetadata: generateTestMetadata,
        
        // Getters
        getActiveTestId: () => activeTestId,
        getTestLibrary: () => testLibrary
    };
})();