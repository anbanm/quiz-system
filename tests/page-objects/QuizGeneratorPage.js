const { expect } = require('@playwright/test');
const uiMapping = require('../ui-mapping.json');

/**
 * Page Object Model for Quiz Generator using UI mapping abstraction
 * This separates logical test actions from implementation details
 */
class QuizGeneratorPage {
  constructor(page) {
    this.page = page;
    this.mapping = uiMapping.pages.quizGenerator.elements;
  }

  // Navigation methods
  async navigate() {
    await this.page.goto(uiMapping.pages.quizGenerator.url);
    await this.page.waitForLoadState('networkidle');
  }

  async createNewQuiz(quizName = 'Test Quiz') {
    await this.click('navigation.createNewQuizButton');
    if (quizName) {
      await this.fill('quizDetails.quizNameInput', quizName);
    }
    await this.ensureCleanState();
  }

  // Generic element interaction methods that use mapping
  async click(elementPath) {
    const selector = this.getSelector(elementPath);
    await this.page.click(selector);
  }

  async fill(elementPath, text) {
    const selector = this.getSelector(elementPath);
    await this.page.fill(selector, text);
  }

  async select(elementPath, value) {
    const selector = this.getSelector(elementPath);
    await this.page.selectOption(selector, value);
  }

  async getText(elementPath) {
    const selector = this.getSelector(elementPath);
    return await this.page.textContent(selector);
  }

  async isVisible(elementPath) {
    const selector = this.getSelector(elementPath);
    return await this.page.locator(selector).isVisible();
  }

  // Rich text editor methods
  async typeInRichEditor(elementPath, text, formatting = {}) {
    const element = this.getElementConfig(elementPath);
    const editorSelector = element.selector || element.editor;
    const toolbarSelector = element.toolbar;

    // Click and clear editor (handle Quill contenteditable)
    await this.page.locator(editorSelector).click();
    await this.page.locator(editorSelector).selectText();
    await this.page.keyboard.press('Delete');

    // Apply formatting if specified
    if (formatting.bold && toolbarSelector) {
      await this.page.locator(`${toolbarSelector} .ql-bold`).click();
    }
    if (formatting.italic && toolbarSelector) {
      await this.page.locator(`${toolbarSelector} .ql-italic`).click();
    }
    if (formatting.underline && toolbarSelector) {
      await this.page.locator(`${toolbarSelector} .ql-underline`).click();
    }

    // Type main text
    await this.page.locator(editorSelector).type(text);

    // Add subscript/superscript if specified
    if (formatting.subscript && toolbarSelector) {
      await this.page.locator(`${toolbarSelector} .ql-script[value="sub"]`).click();
      await this.page.locator(editorSelector).type(formatting.subscript);
      await this.page.locator(`${toolbarSelector} .ql-script[value="sub"]`).click(); // Toggle off
    }

    if (formatting.superscript && toolbarSelector) {
      await this.page.locator(`${toolbarSelector} .ql-script[value="super"]`).click();
      await this.page.locator(editorSelector).type(formatting.superscript);
      await this.page.locator(`${toolbarSelector} .ql-script[value="super"]`).click(); // Toggle off
    }
  }

  // High-level workflow methods
  async addBasicQuestion(questionData) {
    const { text, options, correctAnswer, category = 'Test', difficulty = 'easy', points = '1' } = questionData;

    // Fill question text
    await this.typeInRichEditor('questionForm.questionEditor', text);

    // Fill answer options
    const optionKeys = ['option1', 'option2', 'option3', 'option4'];
    for (let i = 0; i < options.length && i < optionKeys.length; i++) {
      if (options[i]) {
        await this.typeInRichEditor(`questionForm.answerOptions.${optionKeys[i]}`, options[i]);
      }
    }

    // Set other details
    await this.select('questionForm.correctAnswer', correctAnswer);
    await this.fill('questionForm.category', category);
    await this.select('questionForm.difficulty', difficulty);
    await this.fill('questionForm.points', points);

    // Add question
    await this.click('questionForm.addQuestionButton');
    
    // Handle success dialog
    await this.dismissSuccessDialog();
  }

  async addRichTextQuestion(questionData) {
    const { text, optionsWithFormatting, correctAnswer, category = 'Test' } = questionData;

    // Fill question text with rich formatting
    await this.typeInRichEditor('questionForm.questionEditor', text);

    // Fill answer options with formatting
    const optionKeys = ['option1', 'option2', 'option3', 'option4'];
    for (let i = 0; i < optionsWithFormatting.length && i < optionKeys.length; i++) {
      const option = optionsWithFormatting[i];
      if (option) {
        await this.typeInRichEditor(
          `questionForm.answerOptions.${optionKeys[i]}`, 
          option.text, 
          option.formatting || {}
        );
      }
    }

    // Set other details
    await this.select('questionForm.correctAnswer', correctAnswer);
    await this.fill('questionForm.category', category);

    // Add question
    await this.click('questionForm.addQuestionButton');
    
    // Handle success dialog
    await this.dismissSuccessDialog();
  }

  async setQuestionType(type) {
    await this.select('questionForm.questionType', type);
    await this.page.waitForTimeout(500); // Wait for UI update
  }

  async setOptionCount(count) {
    await this.select('questionForm.optionCount', count.toString());
    await this.page.waitForTimeout(500); // Wait for UI update
  }

  // Dialog handling
  async dismissSuccessDialog() {
    const dialogSelector = this.getSelector('dialogs.successDialog.container');
    if (await this.page.locator(dialogSelector).isVisible({ timeout: 2000 })) {
      const closeButtonSelector = this.getElementConfig('dialogs.successDialog.elements').closeButton;
      await this.page.click(closeButtonSelector);
      await this.page.waitForTimeout(500);
    }
  }

  // State management
  async ensureCleanState() {
    // Close sidebar if open - force close by clicking outside or using JS
    const sidebarSelector = '#sidebar';
    if (await this.page.locator(sidebarSelector).isVisible()) {
      // Try JavaScript method first
      await this.page.evaluate(() => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
          sidebar.style.display = 'none';
        }
      });
      await this.page.waitForTimeout(300);
      
      // If still visible, try clicking the toggle
      if (await this.page.locator(sidebarSelector).isVisible()) {
        await this.page.locator('.sidebar-toggle').click({ force: true });
        await this.page.waitForTimeout(500);
      }
    }
    
    // Dismiss any open dialogs
    await this.dismissSuccessDialog();
  }

  // Quiz summary methods
  async getQuestionCount() {
    return await this.getText('quizSummary.questionCount');
  }

  async getTotalPoints() {
    return await this.getText('quizSummary.totalPoints');
  }

  async getQuestionsList() {
    const selector = this.getSelector('quizSummary.questionsList');
    return await this.page.textContent(selector);
  }

  // Export methods
  async previewJson() {
    await this.click('exportOptions.previewJsonButton');
  }

  async downloadZip() {
    // Ensure we have a test name set for the download
    const quizNameValue = await this.page.locator('#quizName').inputValue();
    if (!quizNameValue) {
      await this.fill('quizDetails.quizNameInput', 'Test Quiz');
    }
    
    // Ensure sidebar is closed
    await this.ensureCleanState();
    
    // Wait for the page to be fully loaded and JSZip to be available
    await this.page.waitForFunction(() => {
      return typeof JSZip !== 'undefined';
    });
    
    // Check if we have questions before attempting download
    const questionCount = await this.page.locator('#questionCount').textContent();
    if (!questionCount || questionCount === '0') {
      throw new Error('Cannot download empty quiz - no questions added');
    }
    
    // Start download with proper event handling
    const downloadPromise = this.page.waitForEvent('download', { timeout: 15000 });
    
    // Trigger the download with force click to bypass sidebar issues
    const selector = this.getSelector('exportOptions.downloadZipButton');
    await this.page.locator(selector).click({ force: true });
    
    // Wait for download to start
    return await downloadPromise;
  }

  async generateEmbeddedJson() {
    return await this.page.evaluate(() => {
      return window.generateEmbeddedJSON();
    });
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

  async expectValue(elementPath, expectedValue) {
    const selector = this.getSelector(elementPath);
    await expect(this.page.locator(selector)).toHaveValue(expectedValue);
  }
}

module.exports = QuizGeneratorPage;