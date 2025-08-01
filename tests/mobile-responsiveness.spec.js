const { test, expect } = require('@playwright/test');
const testImages = require('./test-data/images/test-images.json').images;

test.describe('Mobile Responsiveness Tests', () => {
  test('should display WebTest properly on mobile devices', async ({ page }) => {
    await page.goto('WebTest.html');
    
    // Check basic layout
    await expect(page.locator('h2')).toBeVisible();
    await expect(page.locator('button:has-text("Toggle Mode")')).toBeVisible();
    
    // Toggle to Local File Mode
    await page.click('button:has-text("Toggle Mode")');
    
    // Check mobile-friendly file upload sections
    await expect(page.locator('#fileUploadSection')).toBeVisible();
    await expect(page.locator('#zipUpload')).toBeVisible();
    await expect(page.locator('#fileUpload')).toBeVisible();
    
    // Verify buttons are touch-friendly (minimum 44px height)
    const buttonHeight = await page.locator('button:has-text("Toggle Mode")').evaluate(el => {
      return window.getComputedStyle(el).height;
    });
    
    const heightValue = parseInt(buttonHeight);
    expect(heightValue).toBeGreaterThanOrEqual(44); // iOS touch target guidelines
  });

  test('should handle quiz interaction on mobile', async ({ page }) => {
    await page.goto('WebTest.html');
    
    // Load test quiz
    const testQuizData = {
      tests: [{
        testName: "Mobile Test Quiz",
        testID: "mobile-test",
        questions: [{
          question: "This is a mobile test question with longer text to verify mobile display works properly?",
          image: null,
          options: {
            A: "First answer option that might be long",
            B: "Second answer option", 
            C: "Third answer option with more text",
            D: "Fourth and final answer option"
          },
          correctAnswer: "B",
          category: "Mobile",
          difficulty: "easy",
          points: 1,
          id: "mobile-q1"
        }]
      }]
    };

    await page.evaluate((quizData) => {
      window.loadTest(quizData);
    }, testQuizData);

    // Verify question is visible and readable
    await expect(page.locator('.question')).toBeVisible();
    await expect(page.locator('.question p')).toContainText('This is a mobile test question');
    
    // Check that all answer options are properly displayed
    for (let option of ['A', 'B', 'C', 'D']) {
      await expect(page.locator(`label:has-text("${option})")`)).toBeVisible();
    }
    
    // Test touch interaction
    await page.click('label:has-text("B) Second answer option")');
    await expect(page.locator('input[value="B"]')).toBeChecked();
    
    // Test submit button
    await page.click('button:has-text("Submit Test")');
    await expect(page.locator('#resultContainer')).toBeVisible();
    
    // Verify results are readable on mobile
    await expect(page.locator('#resultContainer')).toContainText('Correct Answers: 1 / 1');
  });

  test('should display quiz with images properly on mobile', async ({ page }) => {
    await page.goto('WebTest.html');
    
    const testQuizData = {
      tests: [{
        testName: "Mobile Large Image Quiz",
        testID: "mobile-img-test",
        questions: [{
          question: "This is a large image test - does it display properly on mobile?",
          image: testImages.mobileLarge,
          options: { 
            A: "Yes, it fits perfectly", 
            B: "No, it overflows", 
            C: "It's too small", 
            D: "Cannot see it" 
          },
          correctAnswer: "A",
          category: "Mobile UI",
          difficulty: "medium",
          points: 5,
          id: "mobile-large-img-q1"
        }]
      }]
    };

    await page.evaluate((quizData) => {
      window.loadTest(quizData);
    }, testQuizData);

    // Verify image displays properly on mobile
    await expect(page.locator('.question img')).toBeVisible();
    
    // Check image doesn't overflow container (most important for mobile)
    const imgWidth = await page.locator('.question img').evaluate(img => img.offsetWidth);
    const questionWidth = await page.locator('.question').evaluate(el => el.offsetWidth);
    
    expect(imgWidth).toBeLessThanOrEqual(questionWidth);
    
    // Verify the large mobile image loaded correctly
    const imageSrc = await page.locator('.question img').getAttribute('src');
    expect(imageSrc).toBe(testImages.mobileLarge);
    
    // Test interaction with the image question
    await page.click('label:has-text("A) Yes, it fits perfectly")');
    await expect(page.locator('input[value="A"]')).toBeChecked();
    
    await page.click('button:has-text("Submit Test")');
    await expect(page.locator('#resultContainer')).toContainText('Correct Answers: 1 / 1');
  });

  test('should handle different image sizes on various mobile devices', async ({ page }) => {
    await page.goto('WebTest.html');
    
    // Test with small, medium, and large images
    const testQuizData = {
      tests: [{
        testName: "Multi-Size Image Quiz",
        testID: "multi-size-test",
        questions: [
          {
            question: "Small red square with letter:",
            image: testImages.redSquare,
            options: { A: "A", B: "B", C: "C", D: "D" },
            correctAnswer: "A",
            category: "Small",
            difficulty: "easy",
            points: 1,
            id: "small-img"
          },
          {
            question: "Medium math formula:",
            image: testImages.mathFormula,
            options: { A: "E=mc²", B: "F=ma", C: "a=v²", D: "P=mv" },
            correctAnswer: "A",
            category: "Medium",
            difficulty: "medium",
            points: 3,
            id: "medium-img"
          },
          {
            question: "Large mobile test image:",
            image: testImages.mobileLarge,
            options: { A: "Gradient", B: "Solid", C: "Pattern", D: "Photo" },
            correctAnswer: "A",
            category: "Large",
            difficulty: "easy",
            points: 2,
            id: "large-img"
          }
        ]
      }]
    };

    await page.evaluate((quizData) => {
      window.loadTest(quizData);
    }, testQuizData);

    // Verify all 3 questions and images are loaded
    const questions = page.locator('.question');
    await expect(questions).toHaveCount(3);
    
    const images = page.locator('.question img');
    await expect(images).toHaveCount(3);
    
    // Test each question's image sizing individually
    for (let i = 0; i < 3; i++) {
      await expect(questions.nth(i).locator('img')).toBeVisible();
      
      // Ensure image fits within container on mobile  
      const imgWidth = await questions.nth(i).locator('img').evaluate(img => img.offsetWidth);
      const questionWidth = await questions.nth(i).evaluate(el => el.offsetWidth);
      expect(imgWidth).toBeLessThanOrEqual(questionWidth);
    }
    
    // Now answer all questions (they're all visible at once)
    
    // Answer each question
    await questions.nth(0).locator('label:has-text("A) A")').click();
    await questions.nth(1).locator('label:has-text("A) E=mc²")').click(); 
    await questions.nth(2).locator('label:has-text("A) Gradient")').click();
    
    // Submit test
    await page.click('button:has-text("Submit Test")');
    
    // Verify all answers correct
    await expect(page.locator('#resultContainer')).toContainText('Correct Answers: 3 / 3');
  });

  test('should adapt layout based on screen size', async ({ page }) => {
    // Test responsive breakpoints
    const screenSizes = [
      { width: 320, height: 568, name: 'Mobile Small' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1200, height: 800, name: 'Desktop' }
    ];

    for (const size of screenSizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto('WebTest.html');
      
      // Check that content is visible at this size
      await expect(page.locator('h2')).toBeVisible();
      
      // Toggle to file mode and check layout
      await page.click('button:has-text("Toggle Mode")');
      await expect(page.locator('#fileUploadSection')).toBeVisible();
      
      // On mobile, elements should stack vertically
      // On desktop, they might have more horizontal space
      const containerWidth = await page.locator('.container').evaluate(el => el.offsetWidth);
      expect(containerWidth).toBeGreaterThan(0);
      expect(containerWidth).toBeLessThanOrEqual(size.width);
    }
  });
});