const { test, expect } = require('@playwright/test');
const QuizGeneratorPage = require('./page-objects/QuizGeneratorPage');
const WebTestPage = require('./page-objects/WebTestPage');
const path = require('path');

test.describe('Quiz Generator - Clean Architecture Tests', () => {
  let quizPage;

  test.beforeEach(async ({ page }) => {
    quizPage = new QuizGeneratorPage(page);
    await quizPage.navigate();
  });

  test('should load quiz generator interface', async ({ page }) => {
    await expect(page).toHaveTitle('Quiz Builder for Teachers');
    await quizPage.expectVisible('navigation.createNewQuizButton');
    await quizPage.expectVisible('navigation.loadQuizButton');
  });

  test('should create new quiz with basic functionality', async ({ page }) => {
    await quizPage.createNewQuiz('Clean Architecture Test Quiz');
    
    // Verify quiz creation elements are visible
    await quizPage.expectVisible('questionForm.questionEditor');
    await quizPage.expectVisible('questionForm.answerOptions.option1');
    await quizPage.expectValue('quizDetails.quizNameInput', 'Clean Architecture Test Quiz');
  });

  test('should add simple question using page object', async ({ page }) => {
    await quizPage.createNewQuiz('Simple Question Test');
    
    const questionData = {
      text: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 'option3',
      category: 'Geography',
      difficulty: 'easy',
      points: '5'
    };
    
    await quizPage.addBasicQuestion(questionData);
    
    // Verify question was added
    await quizPage.expectText('quizSummary.questionCount', '1');
    await quizPage.expectText('quizSummary.totalPoints', '5');
    await quizPage.expectText('quizSummary.questionsList', 'What is the capital of France?');
  });

  test('should add rich text question with chemical formulas', async ({ page }) => {
    await quizPage.createNewQuiz('Chemistry Rich Text Quiz');
    
    const richTextQuestion = {
      text: 'Chemistry: What is the chemical formula for water?',
      optionsWithFormatting: [
        { text: 'H', formatting: { subscript: '2' } }, // Will append 'O' after
        { text: 'CO', formatting: { subscript: '2' } },
        { text: 'NaCl', formatting: { bold: true } },
        { text: 'O', formatting: { italic: true, subscript: '2' } }
      ],
      correctAnswer: 'option1',
      category: 'Chemistry'
    };
    
    await quizPage.addRichTextQuestion(richTextQuestion);
    
    // Add the 'O' to complete H2O for option 1
    await quizPage.typeInRichEditor('questionForm.answerOptions.option1', 'O');
    
    // Verify question was added
    await quizPage.expectText('quizSummary.questionCount', '1');
    await quizPage.expectText('quizSummary.questionsList', 'Chemistry: What is the chemical formula for water?');
  });

  test('should handle true/false questions', async ({ page }) => {
    await quizPage.createNewQuiz('True/False Quiz');
    
    await quizPage.setQuestionType('true-false');
    
    // Verify only 2 options are available for true/false
    await quizPage.expectVisible('questionForm.answerOptions.option1');
    await quizPage.expectVisible('questionForm.answerOptions.option2');
    
    const questionData = {
      text: 'The Earth is the third planet from the Sun',
      options: ['True', 'False'],
      correctAnswer: 'option1',
      category: 'Astronomy',
      difficulty: 'easy',
      points: '1'
    };
    
    await quizPage.addBasicQuestion(questionData);
    
    // Verify question was added
    await quizPage.expectText('quizSummary.questionCount', '1');
  });

  test('should handle variable option counts', async ({ page }) => {
    await quizPage.createNewQuiz('Variable Options Quiz');
    
    await quizPage.setOptionCount(3);
    
    // Verify only 3 options are visible
    await quizPage.expectVisible('questionForm.answerOptions.option1');
    await quizPage.expectVisible('questionForm.answerOptions.option2');
    await quizPage.expectVisible('questionForm.answerOptions.option3');
    
    const questionData = {
      text: 'What is 2 to the power of 5?',
      options: ['16', '32', '64'],
      correctAnswer: 'option2',
      category: 'Mathematics',
      difficulty: 'medium',
      points: '3'
    };
    
    await quizPage.addBasicQuestion(questionData);
    
    // Verify question was added with correct option count
    await quizPage.expectText('quizSummary.questionCount', '1');
    
    // Verify JSON generation includes correct option count
    const jsonOutput = await quizPage.generateEmbeddedJson();
    const parsedJson = JSON.parse(jsonOutput);
    const question = parsedJson.tests[0].questions[0];
    
    expect(question.optionCount).toBe(3);
    expect(Object.keys(question.options)).toHaveLength(3);
  });

  test('should generate proper JSON with rich text data', async ({ page }) => {
    await quizPage.createNewQuiz('JSON Rich Text Test');
    
    const richTextQuestion = {
      text: 'Physics: Which equation represents mass-energy equivalence?',
      optionsWithFormatting: [
        { text: 'F = ma', formatting: { bold: true } },
        { text: 'E = mc', formatting: { superscript: '2' } },
        { text: 'v = d/t', formatting: { underline: true } },
        { text: 'P = mv', formatting: {} }
      ],
      correctAnswer: 'option2',
      category: 'Physics'
    };
    
    await quizPage.addRichTextQuestion(richTextQuestion);
    
    // Generate and verify JSON
    const jsonOutput = await quizPage.generateEmbeddedJson();
    const parsedJson = JSON.parse(jsonOutput);
    const question = parsedJson.tests[0].questions[0];
    
    // Verify rich text fields are present
    expect(question.optionsHtml).toBeDefined();
    expect(question.optionsDelta).toBeDefined();
    
    // Verify HTML contains formatting
    expect(question.optionsHtml.A).toContain('<strong>F = ma</strong>');
    expect(question.optionsHtml.B).toContain('<sup>2</sup>');
    expect(question.optionsHtml.C).toContain('<u>v = d/t</u>');
    
    // Verify Delta format contains attributes
    expect(question.optionsDelta.A.ops[0].attributes.bold).toBe(true);
    expect(question.optionsDelta.B.ops[1].attributes.script).toBe('super');
    expect(question.optionsDelta.C.ops[0].attributes.underline).toBe(true);
  });

  test('should export quiz packages', async ({ page }) => {
    await quizPage.createNewQuiz('Export Test Quiz');
    
    const questionData = {
      text: 'Sample export question',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'option1',
      category: 'Test'
    };
    
    await quizPage.addBasicQuestion(questionData);
    
    // Test ZIP download
    const download = await quizPage.downloadZip();
    expect(download.suggestedFilename()).toContain('.zip');
    
    // Clean up
    await download.delete();
  });

  test('should complete full end-to-end workflow: generate → save → load → take quiz', async ({ page }) => {
    // === PART 1: Generate Quiz ===
    await quizPage.createNewQuiz('End-to-End Chemistry Quiz');
    
    // Add rich text chemistry question
    const chemistryQuestion = {
      text: 'Chemistry: What is the molecular formula for water?',
      optionsWithFormatting: [
        { text: 'H', formatting: { subscript: '2' } }, // Will add 'O' after
        { text: 'CO', formatting: { subscript: '2' } },
        { text: 'NaCl', formatting: { bold: true } },
        { text: 'CH', formatting: { subscript: '4' } }
      ],
      correctAnswer: 'option1',
      category: 'Chemistry'
    };
    
    await quizPage.addRichTextQuestion(chemistryQuestion);
    // Complete H2O formula
    await quizPage.typeInRichEditor('questionForm.answerOptions.option1', 'O');
    
    // Add physics question with superscript
    const physicsQuestion = {
      text: 'Physics: Which equation represents mass-energy equivalence?',
      optionsWithFormatting: [
        { text: 'F = ma', formatting: { bold: true } },
        { text: 'E = mc', formatting: { superscript: '2' } },
        { text: 'v = d/t', formatting: { underline: true } },
        { text: 'P = mv', formatting: {} }
      ],
      correctAnswer: 'option2',
      category: 'Physics'
    };
    
    await quizPage.addRichTextQuestion(physicsQuestion);
    
    // Verify 2 questions created
    await quizPage.expectText('quizSummary.questionCount', '2');
    
    // === PART 2: Save JSON ===
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    const selector = quizPage.getSelector('exportOptions.downloadJsonButton');
    await page.locator(selector).click({ force: true });
    const download = await downloadPromise;
    
    // Use the download path directly
    const downloadPath = await download.path();
    
    // Wait for download to complete
    await page.waitForTimeout(1000);
    
    // === PART 3: Load in WebTest ===
    const webTestPage = new WebTestPage(page);
    await webTestPage.navigate();
    
    // Load the quiz JSON
    await webTestPage.loadQuizFromJson(downloadPath);
    
    // Verify quiz loaded correctly
    await webTestPage.expectQuestionCount(2);
    
    // Check first question content
    const question1Text = await webTestPage.getQuestionText(0);
    expect(question1Text).toContain('molecular formula for water');
    
    // Check options for rich text (H₂O should be rendered)
    const question1Options = await webTestPage.getQuestionOptions(0);
    expect(question1Options[0]).toContain('H'); // H2O
    expect(question1Options[1]).toContain('CO'); // CO2
    
    // Check second question
    const question2Text = await webTestPage.getQuestionText(1);
    expect(question2Text).toContain('mass-energy equivalence');
    
    // === PART 4: Take Quiz ===
    // Answer first question correctly (H2O - option A)
    await webTestPage.selectAnswer(0, 'A');
    
    // Answer second question correctly (E=mc² - option B)
    await webTestPage.selectAnswer(1, 'B');
    
    // Submit quiz
    await webTestPage.submitQuiz();
    
    // === PART 5: Validate Results ===
    const score = await webTestPage.getScore();
    expect(score.correct).toBe(2);
    expect(score.total).toBe(2);
    expect(score.percentage).toBe(100);
    
    // Verify results contain correct format
    const results = await webTestPage.getQuizResults();
    expect(results).toContain('Correct Answers: 2 / 2');
    expect(results).toContain('Test Results');
    
    // Clean up
    const fs = require('fs');
    if (downloadPath && fs.existsSync(downloadPath)) {
      fs.unlinkSync(downloadPath);
    }
  });
});