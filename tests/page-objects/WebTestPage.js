const { expect } = require('@playwright/test');
const uiMapping = require('../ui-mapping.json');

/**
 * Page Object Model for WebTest using UI mapping abstraction
 * Handles quiz taking and result validation
 */
class WebTestPage {
  constructor(page) {
    this.page = page;
    this.mapping = uiMapping.pages.quizTestRunner.elements;
  }

  // Navigation methods
  async navigate() {
    await this.page.goto(uiMapping.pages.quizTestRunner.url);
    await this.page.waitForLoadState('networkidle');
    
    // Ensure we're in Local File Mode (not Unity mode)
    await this.ensureLocalFileMode();
  }

  async ensureLocalFileMode() {
    const modeIndicator = await this.page.locator('#modeIndicator').textContent();
    if (modeIndicator.includes('Unity')) {
      await this.click('controls.modeToggle');
      await this.page.waitForTimeout(500);
    }
  }

  // Generic element interaction methods that use mapping
  async click(elementPath) {
    const selector = this.getSelector(elementPath);
    await this.page.click(selector);
  }

  async uploadFile(elementPath, filePath) {
    const selector = this.getSelector(elementPath);
    await this.page.setInputFiles(selector, filePath);
  }

  async getText(elementPath) {
    const selector = this.getSelector(elementPath);
    return await this.page.textContent(selector);
  }

  async isVisible(elementPath) {
    const selector = this.getSelector(elementPath);
    return await this.page.locator(selector).isVisible();
  }

  // Quiz loading methods
  async loadQuizFromJson(jsonFilePath) {
    // Ensure we're in local file mode first
    await this.ensureLocalFileMode();
    
    // Upload the file
    await this.uploadFile('fileUpload.jsonUpload', jsonFilePath);
    
    // Wait for the file to be processed and quiz to load
    await this.page.waitForFunction(() => {
      return document.querySelectorAll('.question').length > 0;
    }, { timeout: 15000 });
  }

  async loadQuizFromZip(zipFilePath) {
    await this.uploadFile('fileUpload.zipUpload', zipFilePath);
    
    // Wait for quiz to load
    await this.page.waitForSelector('.question', { timeout: 10000 });
  }

  // Quiz interaction methods
  async getQuestionCount() {
    const questions = await this.page.locator('.question').count();
    return questions;
  }

  async getQuestionText(questionIndex = 0) {
    const questionSelector = `.question:nth-child(${questionIndex + 1}) .quiz-question-content`;
    return await this.page.textContent(questionSelector);
  }

  async getQuestionOptions(questionIndex = 0) {
    const optionSelectors = `.question:nth-child(${questionIndex + 1}) label`;
    const options = await this.page.locator(optionSelectors).allTextContents();
    return options;
  }

  async selectAnswer(questionIndex, optionIndex) {
    // Radio buttons have name like "q0", "q1" and values like "0", "1", "A", "B"
    const radioSelector = `input[name="q${questionIndex}"][value="${optionIndex}"]`;
    await this.page.check(radioSelector);
  }

  async selectAnswerByText(questionIndex, answerText) {
    const labelSelector = `.question:nth-child(${questionIndex + 1}) label:has-text("${answerText}")`;
    await this.page.click(labelSelector);
  }

  async submitQuiz() {
    await this.click('quiz.submitButton');
    
    // Wait for results to appear
    await this.page.waitForSelector('#resultContainer', { timeout: 10000 });
  }

  // Results validation methods
  async getQuizResults() {
    const resultsText = await this.getText('results.resultContainer');
    return resultsText;
  }

  async getScore() {
    const resultsText = await this.getQuizResults();
    // WebTest format: "Correct Answers: X / Y"
    const scoreMatch = resultsText.match(/Correct Answers:\s*(\d+)\s*\/\s*(\d+)/);
    if (scoreMatch) {
      return {
        correct: parseInt(scoreMatch[1]),
        total: parseInt(scoreMatch[2]),
        percentage: Math.round((parseInt(scoreMatch[1]) / parseInt(scoreMatch[2])) * 100)
      };
    }
    return null;
  }

  // Rich text validation methods
  async validateRichTextOption(questionIndex, optionIndex, expectedHtml) {
    const optionSelector = `.question:nth-child(${questionIndex + 1}) label:nth-child(${optionIndex + 1})`;
    const innerHTML = await this.page.locator(optionSelector).innerHTML();
    expect(innerHTML).toContain(expectedHtml);
  }

  async validateFormulaRendering(questionIndex, expectedFormula) {
    const questionContent = await this.getQuestionText(questionIndex);
    const options = await this.getQuestionOptions(questionIndex);
    
    // Check if mathematical notation is preserved
    const hasFormula = questionContent.includes(expectedFormula) || 
                      options.some(option => option.includes(expectedFormula));
    
    expect(hasFormula).toBe(true);
  }

  // Helper methods for selector resolution
  getSelector(elementPath) {
    const element = this.getElementConfig(elementPath);
    return element.selector || element.editor || element;
  }

  getElementConfig(elementPath) {
    const pathParts = elementPath.split('.');
    let current = this.mapping;
    
    for (const part of pathParts) {
      current = current[part];
      if (!current) {
        throw new Error(`UI element not found in mapping: ${elementPath}`);
      }
    }
    
    return current;
  }

  // Validation methods
  async expectVisible(elementPath) {
    const selector = this.getSelector(elementPath);
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async expectText(elementPath, expectedText) {
    const selector = this.getSelector(elementPath);
    await expect(this.page.locator(selector)).toContainText(expectedText);
  }

  async expectQuestionCount(expectedCount) {
    const actualCount = await this.getQuestionCount();
    expect(actualCount).toBe(expectedCount);
  }
}

module.exports = WebTestPage;