const { test, expect } = require('@playwright/test');
const testImages = require('./test-data/images/test-images.json').images;

test.describe('Quiz Test Runner - Student Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('WebTest.html');
  });

  test('should load WebTest with proper initial state', async ({ page }) => {
    // Check title and main elements
    await expect(page).toHaveTitle('Quiz Test');
    await expect(page.locator('h2')).toContainText('Quiz Test');
    
    // Should start in Unity Mode
    await expect(page.locator('#modeIndicator')).toContainText('Unity Mode');
    
    // File upload section should be hidden initially
    await expect(page.locator('#fileUploadSection')).not.toBeVisible();
  });

  test('should toggle to Local File Mode and show upload options', async ({ page }) => {
    // Toggle to Local File Mode
    await page.click('button:has-text("Toggle Mode")');
    
    // Verify mode change
    await expect(page.locator('#modeIndicator')).toContainText('Local File Mode');
    
    // File upload section should be visible
    await expect(page.locator('#fileUploadSection')).toBeVisible();
    
    // Both upload options should be visible
    await expect(page.locator('#zipUpload')).toBeVisible();
    await expect(page.locator('#fileUpload')).toBeVisible();
    
    // Check section headers
    await expect(page.locator('h4:has-text("ZIP Package")')).toBeVisible();
    await expect(page.locator('h4:has-text("JSON Only")')).toBeVisible();
  });

  test('should load quiz from JSON data', async ({ page }) => {
    // Create test quiz data
    const testQuizData = {
      tests: [{
        testName: "Test Quiz",
        testID: "test-123",
        questions: [{
          question: "What is 2 + 2?",
          image: null,
          options: {
            A: "3",
            B: "4", 
            C: "5",
            D: "6"
          },
          correctAnswer: "B",
          category: "Math",
          difficulty: "easy",
          points: 1,
          id: "q-1"
        }]
      }]
    };

    // Load quiz data directly (simulating JSON upload)
    await page.evaluate((quizData) => {
      window.loadTest(quizData);
    }, testQuizData);

    // Verify quiz loaded
    await expect(page.locator('.question')).toBeVisible();
    await expect(page.locator('.question p')).toContainText('What is 2 + 2?');
    
    // Check all answer options are present
    await expect(page.locator('label:has-text("A) 3")')).toBeVisible();
    await expect(page.locator('label:has-text("B) 4")')).toBeVisible();
    await expect(page.locator('label:has-text("C) 5")')).toBeVisible();
    await expect(page.locator('label:has-text("D) 6")')).toBeVisible();
  });

  test('should allow answering questions and submitting', async ({ page }) => {
    // Load test quiz
    const testQuizData = {
      tests: [{
        testName: "Math Quiz",
        testID: "test-456",
        questions: [{
          question: "What is 5 + 3?",
          image: null,
          options: { A: "7", B: "8", C: "9", D: "10" },
          correctAnswer: "B",
          category: "Math",
          difficulty: "easy",
          points: 2,
          id: "q-1"
        }]
      }]
    };

    await page.evaluate((quizData) => {
      window.loadTest(quizData);
    }, testQuizData);

    // Answer the question
    await page.click('label:has-text("B) 8")');
    
    // Verify answer is selected
    await expect(page.locator('input[value="B"]')).toBeChecked();
    
    // Submit test
    await page.click('button:has-text("Submit Test")');
    
    // Check results
    await expect(page.locator('#resultContainer')).toBeVisible();
    await expect(page.locator('#resultContainer')).toContainText('Test ID: test-456');
    await expect(page.locator('#resultContainer')).toContainText('Correct Answers: 1 / 1');
    await expect(page.locator('#resultContainer')).toContainText('Points Awarded: 2');
  });

  test('should prevent multiple submissions', async ({ page }) => {
    // Load and complete a quiz
    const testQuizData = {
      tests: [{
        testName: "Single Submit Test",
        testID: "test-789",
        questions: [{
          question: "Test question?",
          image: null,
          options: { A: "Yes", B: "No", C: "Maybe", D: "Sure" },
          correctAnswer: "A",
          category: "Test",
          difficulty: "easy",
          points: 1,
          id: "q-1"
        }]
      }]
    };

    await page.evaluate((quizData) => {
      window.loadTest(quizData);
    }, testQuizData);

    await page.click('label:has-text("A) Yes")');
    await page.click('button:has-text("Submit Test")');

    // Try to submit again
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('You have already submitted the test.');
      await dialog.accept();
    });

    await page.click('button:has-text("Submit Test")');
  });

  test('should handle quiz with images', async ({ page }) => {
    const testQuizData = {
      tests: [{
        testName: "Geography Image Quiz",
        testID: "test-img-geo",
        questions: [{
          question: "What planet is shown in this diagram?",
          image: testImages.greenDiagram,
          options: { A: "Mars", B: "Earth", C: "Venus", D: "Jupiter" },
          correctAnswer: "B",
          category: "Geography",
          difficulty: "medium",
          points: 5,
          id: "q-geo-img"
        }]
      }]
    };

    await page.evaluate((quizData) => {
      window.loadTest(quizData);
    }, testQuizData);

    // Verify question and image are displayed
    await expect(page.locator('.question p')).toContainText('What planet is shown in this diagram?');
    await expect(page.locator('.question img')).toBeVisible();
    
    // Verify image has correct src
    const imageSrc = await page.locator('.question img').getAttribute('src');
    expect(imageSrc).toBe(testImages.greenDiagram);
    
    // Answer the question and verify it works with images
    await page.click('label:has-text("B) Earth")');
    await expect(page.locator('input[value="B"]')).toBeChecked();
    
    await page.click('button:has-text("Submit Test")');
    await expect(page.locator('#resultContainer')).toBeVisible();
    await expect(page.locator('#resultContainer')).toContainText('Correct Answers: 1 / 1');
    await expect(page.locator('#resultContainer')).toContainText('Points Awarded: 5');
  });

  test('should handle multi-question quiz with various image types', async ({ page }) => {
    const testQuizData = {
      tests: [{
        testName: "Multi-Image Quiz",
        testID: "test-multi-img",
        questions: [
          {
            question: "What formula is shown?",
            image: testImages.mathFormula,
            options: { A: "E=mc²", B: "F=ma", C: "v=at", D: "a=v/t" },
            correctAnswer: "A",
            category: "Physics",
            difficulty: "medium",
            points: 10,
            id: "q-physics"
          },
          {
            question: "What color is the background of this test image?",
            image: testImages.blueRectangle,
            options: { A: "Red", B: "Blue", C: "Green", D: "Yellow" },
            correctAnswer: "B",
            category: "Visual",
            difficulty: "easy",
            points: 3,
            id: "q-visual"
          },
          {
            question: "What letter is displayed in this image?",
            image: testImages.redSquare,
            options: { A: "A", B: "B", C: "C", D: "D" },
            correctAnswer: "A",
            category: "Recognition",
            difficulty: "easy",
            points: 2,
            id: "q-letter"
          }
        ]
      }]
    };

    await page.evaluate((quizData) => {
      window.loadTest(quizData);
    }, testQuizData);

    // Verify all 3 questions are displayed (quiz shows all questions at once)
    const questions = page.locator('.question');
    await expect(questions).toHaveCount(3);
    
    // Verify all images are loaded and visible
    const images = page.locator('.question img');
    await expect(images).toHaveCount(3);
    
    // Test first question (Physics - E=mc²)
    await expect(questions.nth(0).locator('p')).toContainText('What formula is shown?');
    await expect(questions.nth(0).locator('img')).toBeVisible();
    await questions.nth(0).locator('label:has-text("A) E=mc²")').click();

    // Test second question (Visual - Blue background)
    await expect(questions.nth(1).locator('p')).toContainText('What color is the background');
    await expect(questions.nth(1).locator('img')).toBeVisible();
    await questions.nth(1).locator('label:has-text("B) Blue")').click();

    // Test third question (Recognition - Letter A)
    await expect(questions.nth(2).locator('p')).toContainText('What letter is displayed');
    await expect(questions.nth(2).locator('img')).toBeVisible();
    await questions.nth(2).locator('label:has-text("A) A")').click();
    
    // Submit and verify all correct
    await page.click('button:has-text("Submit Test")');
    await expect(page.locator('#resultContainer')).toBeVisible();
    await expect(page.locator('#resultContainer')).toContainText('Correct Answers: 3 / 3');
    await expect(page.locator('#resultContainer')).toContainText('Points Awarded: 15');
  });
});