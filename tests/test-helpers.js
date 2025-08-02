// Test helper functions for common UI interactions

/**
 * Helper function to ensure clean state before interacting with quiz generator
 * @param {import('@playwright/test').Page} page 
 */
async function ensureCleanQuizGeneratorState(page) {
  // Close sidebar if it's open to prevent click interception
  const sidebar = page.locator('#sidebar');
  if (await sidebar.isVisible()) {
    await page.click('.sidebar-toggle');
    // Wait a bit for sidebar animation
    await page.waitForTimeout(500);
  }
  
  // Dismiss any open success dialogs
  await dismissAnyOpenDialogs(page);
  
  // Ensure test details container is expanded if it exists
  const testDetailsContainer = page.locator('#testDetailsContainer');
  if (await testDetailsContainer.isVisible()) {
    // Check if it's collapsed and expand it
    const isCollapsed = await testDetailsContainer.evaluate(el => el.style.display === 'none');
    if (isCollapsed) {
      await page.click('button:has-text("Create New Quiz")');
    }
  }
}

/**
 * Helper function to dismiss any open dialogs or modals
 * @param {import('@playwright/test').Page} page 
 */
async function dismissAnyOpenDialogs(page) {
  // Close success dialog if visible
  const successDialog = page.locator('#success-choices');
  if (await successDialog.isVisible({ timeout: 1000 })) {
    const closeButton = page.locator('button:has-text("✕ Just Close This")');
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }
  }
  
  // Close any other modal dialogs
  const modalOverlay = page.locator('.modal-overlay');
  if (await modalOverlay.isVisible({ timeout: 1000 })) {
    await page.press('body', 'Escape');
    await page.waitForTimeout(500);
  }
}

/**
 * Helper function to add a question using Quill editors with proper error handling
 * @param {import('@playwright/test').Page} page 
 * @param {Object} questionData 
 */
async function addQuestionWithQuillEditors(page, questionData) {
  const { text, option1, option2, option3, option4, correct, category = 'Test Category' } = questionData;
  
  // Ensure clean state before starting
  await ensureCleanQuizGeneratorState(page);
  
  // Wait for Quill editors to be ready
  await page.waitForSelector('#question-editor .ql-editor', { timeout: 10000 });
  await page.waitForSelector('#option1-editor .ql-editor', { timeout: 5000 });
  
  // Clear and fill question using Quill editor
  await page.locator('#question-editor .ql-editor').click();
  await page.locator('#question-editor .ql-editor').clear();
  await page.locator('#question-editor .ql-editor').type(text);
  
  // Clear and fill options using Quill editors
  if (option1) {
    await page.locator('#option1-editor .ql-editor').click();
    await page.locator('#option1-editor .ql-editor').clear();
    await page.locator('#option1-editor .ql-editor').type(option1);
  }
  
  if (option2) {
    await page.locator('#option2-editor .ql-editor').click();
    await page.locator('#option2-editor .ql-editor').clear();
    await page.locator('#option2-editor .ql-editor').type(option2);
  }
  
  if (option3) {
    await page.locator('#option3-editor .ql-editor').click();
    await page.locator('#option3-editor .ql-editor').clear();
    await page.locator('#option3-editor .ql-editor').type(option3);
  }
  
  if (option4) {
    await page.locator('#option4-editor .ql-editor').click();
    await page.locator('#option4-editor .ql-editor').clear();
    await page.locator('#option4-editor .ql-editor').type(option4);
  }
  
  // Set correct answer and category
  if (correct) {
    await page.selectOption('#correctAnswer', correct);
  }
  if (category) {
    await page.fill('#category', category);
  }
  
  // Add question to quiz
  await page.click('button:has-text("Add Question to Quiz")');
  
  // Handle success dialog
  await dismissAnyOpenDialogs(page);
}

/**
 * Helper function to initialize a new quiz with proper setup
 * @param {import('@playwright/test').Page} page 
 * @param {string} testName 
 */
async function initializeNewQuiz(page, testName = 'Test Quiz') {
  // Navigate to quiz generator
  await page.goto('quizGenerator.html');
  await page.waitForLoadState('networkidle');
  
  // Create new quiz
  await page.click('button:has-text("Create New Quiz")');
  
  // Fill in test name if provided
  if (testName) {
    await page.fill('#testName', testName);
  }
  
  // Ensure clean state
  await ensureCleanQuizGeneratorState(page);
  
  // Wait for Quill editors to initialize
  await page.waitForSelector('#question-editor .ql-editor', { timeout: 10000 });
  await page.waitForSelector('#option1-editor .ql-editor', { timeout: 5000 });
}

/**
 * Helper function to add rich text formatting to Quill editor
 * @param {import('@playwright/test').Page} page 
 * @param {string} editorSelector 
 * @param {string} toolbarSelector 
 * @param {string} text 
 * @param {Object} formatting 
 */
async function addRichTextToEditor(page, editorSelector, toolbarSelector, text, formatting = {}) {
  await page.locator(editorSelector).click();
  await page.locator(editorSelector).clear();
  
  // Apply formatting if specified
  if (formatting.bold) {
    await page.locator(`${toolbarSelector} .ql-bold`).click();
  }
  if (formatting.italic) {
    await page.locator(`${toolbarSelector} .ql-italic`).click();
  }
  if (formatting.underline) {
    await page.locator(`${toolbarSelector} .ql-underline`).click();
  }
  
  // Type text
  await page.locator(editorSelector).type(text);
  
  // Add subscript/superscript if needed
  if (formatting.subscript) {
    await page.locator(`${toolbarSelector} .ql-script[value="sub"]`).click();
    await page.locator(editorSelector).type(formatting.subscript);
    await page.locator(`${toolbarSelector} .ql-script[value="sub"]`).click(); // Toggle off
  }
  
  if (formatting.superscript) {
    await page.locator(`${toolbarSelector} .ql-script[value="super"]`).click();
    await page.locator(editorSelector).type(formatting.superscript);
    await page.locator(`${toolbarSelector} .ql-script[value="super"]`).click(); // Toggle off
  }
}

/**
 * Helper to wait for quiz test runner to load properly
 * @param {import('@playwright/test').Page} page 
 */
async function initializeQuizTestRunner(page) {
  await page.goto('WebTest.html');
  await page.waitForLoadState('networkidle');
  
  // Ensure we're in Local File Mode for testing
  const modeIndicator = page.locator('#modeIndicator');
  const currentMode = await modeIndicator.textContent();
  if (currentMode.includes('Unity Mode')) {
    await page.click('button:has-text("Toggle Mode")');
  }
  
  // Verify file upload section is visible
  await page.waitForSelector('#fileUploadSection', { state: 'visible' });
}

module.exports = {
  ensureCleanQuizGeneratorState,
  dismissAnyOpenDialogs,
  addQuestionWithQuillEditors,
  initializeNewQuiz,
  addRichTextToEditor,
  initializeQuizTestRunner
};