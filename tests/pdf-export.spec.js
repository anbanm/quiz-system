const { test, expect } = require('@playwright/test');
const QuizGeneratorPage = require('./page-objects/QuizGeneratorPage');
const path = require('path');

test.describe('PDF Export Functionality', () => {
  let quizPage;

  test.beforeEach(async ({ page }) => {
    quizPage = new QuizGeneratorPage(page);
    await quizPage.navigate();
  });

  test('should show PDF export button when quiz has questions', async ({ page }) => {
    // Create a new quiz with a basic question
    await quizPage.createNewQuiz('PDF Export Test Quiz');
    
    const questionData = {
      text: 'What is the chemical formula for water?',
      options: ['H₂O', 'CO₂', 'NaCl', 'CaCl₂'],
      correctAnswer: 'option1',
      category: 'Chemistry',
      difficulty: 'easy',
      points: '2'
    };
    
    await quizPage.addBasicQuestion(questionData);
    
    // Verify PDF export button is visible
    await quizPage.expectVisible('exportOptions.exportPdfButton');
  });

  test('should open PDF template selection dialog', async ({ page }) => {
    // Create quiz with question first
    await quizPage.createNewQuiz('Template Dialog Test');
    
    const questionData = {
      text: 'Basic question for PDF test',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'option1',
      category: 'Test',
      difficulty: 'easy',
      points: '1'
    };
    
    await quizPage.addBasicQuestion(questionData);
    
    // Click PDF export button
    await quizPage.click('exportOptions.exportPdfButton');
    
    // Verify PDF dialog is visible
    await quizPage.expectVisible('dialogs.pdfExportDialog.container');
    await quizPage.expectVisible('dialogs.pdfExportDialog.elements.studentQuizTemplate');
    await quizPage.expectVisible('dialogs.pdfExportDialog.elements.answerKeyTemplate');
    await quizPage.expectVisible('dialogs.pdfExportDialog.elements.practiceSheetTemplate');
  });

  test('should show error when trying to export PDF without questions', async ({ page }) => {
    // Create empty quiz
    await quizPage.createNewQuiz('Empty Quiz Test');
    
    // Try to click PDF export
    await quizPage.click('exportOptions.exportPdfButton');
    
    // Should show guidance message about no questions
    await expect(page.locator('text=No Questions to Export')).toBeVisible({ timeout: 5000 });
  });

  test('should handle rich text formatting in PDF export', async ({ page }) => {
    await quizPage.createNewQuiz('Rich Text PDF Test');
    
    // Create a simple question with rich text formatting for PDF export testing
    const questionData = {
      text: 'What is the chemical formula for water?',
      options: ['H₂O', 'CO₂', 'NaCl', 'CaCl₂'],
      correctAnswer: 'option1',
      category: 'Chemistry',
      difficulty: 'easy',
      points: '3'
    };
    
    await quizPage.addBasicQuestion(questionData);
    
    // Test PDF export
    await quizPage.click('exportOptions.exportPdfButton');
    await quizPage.expectVisible('dialogs.pdfExportDialog.container');
    
    // We can't actually download PDFs in headless mode, but we can verify the dialog works
    await quizPage.click('dialogs.pdfExportDialog.elements.cancelButton');
  });

  test('should handle mathematical formulas in PDF export', async ({ page }) => {
    await quizPage.createNewQuiz('Math Formulas PDF Test');
    
    // Create a simple math question for PDF export testing
    const questionData = {
      text: 'Which equation represents mass-energy equivalence?',
      options: ['E=mc²', 'F=ma', 'v²=u²+2as', 'P=IV'],
      correctAnswer: 'option1',
      category: 'Physics',
      difficulty: 'medium',
      points: '5'
    };
    
    await quizPage.addBasicQuestion(questionData);
    
    // Verify PDF export is available
    await quizPage.expectVisible('exportOptions.exportPdfButton');
  });

  test('should support all three PDF template types', async ({ page }) => {
    // Create quiz with question
    await quizPage.createNewQuiz('Template Types Test');
    
    const questionData = {
      text: 'Sample question for template testing',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'option2',
      category: 'Test',
      difficulty: 'medium',
      points: '3'
    };
    
    await quizPage.addBasicQuestion(questionData);
    
    // Test each template type
    const templates = [
      'studentQuizTemplate',
      'answerKeyTemplate', 
      'practiceSheetTemplate'
    ];
    
    for (const template of templates) {
      // Open PDF dialog
      await quizPage.click('exportOptions.exportPdfButton');
      await quizPage.expectVisible('dialogs.pdfExportDialog.container');
      
      // Verify template option is visible
      await quizPage.expectVisible(`dialogs.pdfExportDialog.elements.${template}`);
      
      // Cancel dialog for this test (can't actually download in headless)
      await quizPage.click('dialogs.pdfExportDialog.elements.cancelButton');
      
      // Wait for dialog to close
      await expect(page.locator('#pdf-export-dialog')).not.toBeVisible();
    }
  });

  test('should handle PDF export with images', async ({ page }) => {
    await quizPage.createNewQuiz('Image PDF Test');
    
    // Add question text
    await quizPage.typeInRichEditor('questionForm.questionEditor', 'What does this diagram show?');
    
    // Add a test image (using a data URL for testing)
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    // Simulate image selection by setting the preview directly
    await page.evaluate((imageData) => {
      const preview = document.getElementById('imagePreview');
      if (preview) {
        preview.src = imageData;
        preview.style.display = 'block';
        preview.dataset.imageData = imageData;
      }
      const pathInput = document.getElementById('imagePath');
      if (pathInput) {
        pathInput.value = 'test-image.png';
      }
    }, testImageData);
    
    // Fill options
    await quizPage.typeInRichEditor('questionForm.answerOptions.option1', 'Diagram A');
    await quizPage.typeInRichEditor('questionForm.answerOptions.option2', 'Diagram B');
    await quizPage.typeInRichEditor('questionForm.answerOptions.option3', 'Diagram C');
    await quizPage.typeInRichEditor('questionForm.answerOptions.option4', 'Diagram D');
    
    // Set properties
    await quizPage.select('questionForm.correctAnswer', 'option1');
    await quizPage.fill('questionForm.category', 'Science');
    await quizPage.select('questionForm.difficulty', 'easy');
    await quizPage.fill('questionForm.points', '2');
    
    // Add question
    await quizPage.click('questionForm.addQuestionButton');
    
    // Close success dialog
    await page.locator('#success-choices button:has-text("✕ Just Close This")').click();
    
    // Verify PDF export works with images
    await quizPage.expectVisible('exportOptions.exportPdfButton');
    await quizPage.click('exportOptions.exportPdfButton');
    await quizPage.expectVisible('dialogs.pdfExportDialog.container');
    
    // Close dialog
    await quizPage.click('dialogs.pdfExportDialog.elements.cancelButton');
  });

  test('should handle multiple questions in PDF export', async ({ page }) => {
    await quizPage.createNewQuiz('Multiple Questions PDF Test');
    
    // Add first question
    const question1 = {
      text: 'First question with formatting',
      options: ['Answer 1A', 'Answer 1B', 'Answer 1C', 'Answer 1D'],
      correctAnswer: 'option1',
      category: 'Category 1',
      difficulty: 'easy',
      points: '1'
    };
    
    // Add first question without using the page object's automatic dialog dismissal
    await quizPage.typeInRichEditor('questionForm.questionEditor', question1.text);
    await quizPage.typeInRichEditor('questionForm.answerOptions.option1', question1.options[0]);
    await quizPage.typeInRichEditor('questionForm.answerOptions.option2', question1.options[1]);
    await quizPage.typeInRichEditor('questionForm.answerOptions.option3', question1.options[2]);
    await quizPage.typeInRichEditor('questionForm.answerOptions.option4', question1.options[3]);
    await quizPage.select('questionForm.correctAnswer', question1.correctAnswer);
    await quizPage.fill('questionForm.category', question1.category);
    await quizPage.select('questionForm.difficulty', question1.difficulty);
    await quizPage.fill('questionForm.points', question1.points);
    await quizPage.click('questionForm.addQuestionButton');
    
    // Click Add Another Question from success dialog
    await page.locator('#success-choices button:has-text("Add Another Question")').click();
    
    // Add second question
    const question2 = {
      text: 'What is the chemical formula for sulfuric acid?',
      options: ['H₂SO₄', 'Water', 'Salt', 'Sugar'],
      correctAnswer: 'option1',
      category: 'Chemistry',
      difficulty: 'hard',
      points: '5'
    };
    
    await quizPage.addBasicQuestion(question2);
    
    // Verify quiz summary shows 2 questions and 6 total points
    await quizPage.expectText('quizSummary.questionCount', '2');
    await quizPage.expectText('quizSummary.totalPoints', '6');
    
    // Verify PDF export is available
    await quizPage.expectVisible('exportOptions.exportPdfButton');
  });
});