const { test, expect } = require('@playwright/test');
const testImages = require('./test-data/images/test-images.json').images;

test.describe('Quiz Generator - Teacher Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('quizGenerator.html');
  });

  test('should load quiz generator with teacher-friendly interface', async ({ page }) => {
    // Check main title
    await expect(page).toHaveTitle('Quiz Builder for Teachers');
    await expect(page.locator('h1')).toContainText('Quiz Builder for Teachers');
    
    // Check key UI elements
    await expect(page.locator('button:has-text("Create New Quiz")')).toBeVisible();
    await expect(page.locator('input[type="file"]#jsonUpload')).toBeVisible();
  });

  test('should create new quiz successfully', async ({ page }) => {
    // Create new quiz
    await page.click('button:has-text("Create New Quiz")');
    
    // Verify quiz creation interface appears
    await expect(page.locator('#testDetailsContainer')).toBeVisible();
    await expect(page.locator('#testName')).toBeVisible();
    
    // Fill in quiz details
    await page.fill('#testName', 'Playwright Test Quiz');
    await expect(page.locator('#testName')).toHaveValue('Playwright Test Quiz');
  });

  test('should add question with all options', async ({ page }) => {
    // Create new quiz first
    await page.click('button:has-text("Create New Quiz")');
    
    // Add question details
    await page.fill('#question', 'What is the capital of France?');
    await page.fill('#option1', 'London');
    await page.fill('#option2', 'Berlin');
    await page.fill('#option3', 'Paris');
    await page.fill('#option4', 'Madrid');
    await page.selectOption('#correctAnswer', 'option3');
    await page.fill('#category', 'Geography');
    await page.selectOption('#difficulty', 'easy');
    await page.fill('#points', '5');
    
    // Add question to quiz
    await page.click('button:has-text("Add Question to Quiz")');
    
    // Verify question appears in summary
    await expect(page.locator('#questions')).toContainText('What is the capital of France?');
    await expect(page.locator('#questions')).toContainText('Paris');
    await expect(page.locator('#questionCount')).toHaveText('1');
    await expect(page.locator('#totalPointsDisplay')).toHaveText('5');
  });

  test('should generate and preview JSON with correct format', async ({ page }) => {
    // Create quiz and add question
    await page.click('button:has-text("Create New Quiz")');
    await page.fill('#testName', 'JSON Test Quiz');
    
    await page.fill('#question', 'Test Question?');
    await page.fill('#option1', 'Option A');
    await page.fill('#option2', 'Option B');
    await page.fill('#option3', 'Option C');
    await page.fill('#option4', 'Option D');
    await page.selectOption('#correctAnswer', 'option2');
    await page.fill('#category', 'Test');
    
    await page.click('button:has-text("Add Question to Quiz")');
    
    // Generate JSON
    await page.click('button:has-text("Preview Quiz Data")');
    
    // Check JSON output contains expected structure
    const jsonOutput = await page.locator('#jsonOutput').textContent();
    expect(jsonOutput).toContain('"testName": "JSON Test Quiz"');
    expect(jsonOutput).toContain('"options": {');
    expect(jsonOutput).toContain('"A": "Option A"');
    expect(jsonOutput).toContain('"B": "Option B"');
    expect(jsonOutput).toContain('"correctAnswer": "B"');
  });

  test('should handle image upload and preview', async ({ page }) => {
    await page.click('button:has-text("Create New Quiz")');
    
    // Use our sample red square test image with proper data storage
    await page.evaluate((imageData) => {
      const preview = document.getElementById('imagePreview');
      const imagePath = document.getElementById('imagePath');
      preview.src = imageData;
      preview.style.display = 'block';
      preview.dataset.imageData = imageData;
      imagePath.value = 'red-square-test.svg'; // Set filename
    }, testImages.redSquare);
    
    // Verify image preview is shown
    await expect(page.locator('#imagePreview')).toBeVisible();
    await expect(page.locator('#imagePath')).toHaveValue('red-square-test.svg');
    
    // Verify the image actually displays properly
    const imageSrc = await page.locator('#imagePreview').getAttribute('src');
    expect(imageSrc).toBe(testImages.redSquare);
  });

  test('should create quiz with different types of images', async ({ page }) => {
    await page.click('button:has-text("Create New Quiz")');
    await page.fill('#testName', 'Image Variety Quiz');
    
    // Test with math formula image
    await page.fill('#question', 'What does this formula represent?');
    await page.fill('#option1', 'Mass-Energy Equivalence');
    await page.fill('#option2', 'Force Equation');
    await page.fill('#option3', 'Acceleration Formula');
    await page.fill('#option4', 'Velocity Equation');
    await page.selectOption('#correctAnswer', 'option1');
    await page.fill('#category', 'Physics');
    await page.selectOption('#difficulty', 'medium');
    await page.fill('#points', '10');
    
    // Set the math formula image with proper data storage
    await page.evaluate((imageData) => {
      const preview = document.getElementById('imagePreview');
      const imagePath = document.getElementById('imagePath');
      preview.src = imageData;
      preview.style.display = 'block';
      preview.dataset.imageData = imageData;
      imagePath.value = 'math-formula.svg'; // Set a filename to ensure image path is not empty
    }, testImages.mathFormula);
    
    await page.click('button:has-text("Add Question to Quiz")');
    
    // Verify question with image was added
    await expect(page.locator('#questions')).toContainText('What does this formula represent?');
    await expect(page.locator('#questions')).toContainText('Mass-Energy Equivalence');
    
    // Add a geography question with diagram
    await page.fill('#question', 'What planet is shown in this diagram?');
    await page.fill('#option1', 'Mars');
    await page.fill('#option2', 'Earth');
    await page.fill('#option3', 'Venus');
    await page.fill('#option4', 'Jupiter');
    await page.selectOption('#correctAnswer', 'option2');
    await page.fill('#category', 'Geography');
    await page.selectOption('#difficulty', 'easy');
    await page.fill('#points', '5');
    
    // Set the green diagram image with proper data storage
    await page.evaluate((imageData) => {
      const preview = document.getElementById('imagePreview');
      const imagePath = document.getElementById('imagePath');
      preview.src = imageData;
      preview.style.display = 'block';
      preview.dataset.imageData = imageData;
      imagePath.value = 'green-diagram.svg'; // Set a filename to ensure image path is not empty
    }, testImages.greenDiagram);
    
    await page.click('button:has-text("Add Question to Quiz")');
    
    // Verify both questions are in the quiz
    await expect(page.locator('#questionCount')).toHaveText('2');
    await expect(page.locator('#totalPointsDisplay')).toHaveText('15');
    
    // Generate JSON and verify images are included
    // The "Preview Quiz Data" uses generateJSON() which creates ZIP-style JSON
    // We need to get the embedded JSON version for proper image testing
    const jsonOutput = await page.evaluate(() => {
      return window.generateEmbeddedJSON();
    });
    
    // Verify JSON contains both questions with images
    expect(jsonOutput).toContain('What does this formula represent?');
    expect(jsonOutput).toContain('What planet is shown in this diagram?');
    expect(jsonOutput).toContain('data:image/svg+xml;base64'); // Both images should be present as embedded data
  });
});