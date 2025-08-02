const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Question Reordering', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to quiz generator
        const filePath = path.join(__dirname, '..', 'src', 'frontend', 'quizGenerator.html');
        await page.goto(`file://${filePath}`);
        
        // Create a new test
        await page.click('button:has-text("✨ Create New Quiz")');
        
        // Add multiple questions for reordering tests
        const questions = [
            { text: "First Question", option1: "A1", option2: "B1", option3: "C1", option4: "D1", correct: "option1" },
            { text: "Second Question", option1: "A2", option2: "B2", option3: "C2", option4: "D2", correct: "option2" },
            { text: "Third Question", option1: "A3", option2: "B3", option3: "C3", option4: "D3", correct: "option3" }
        ];
        
        for (const q of questions) {
            await page.fill('#question', q.text);
            await page.fill('#option1', q.option1);
            await page.fill('#option2', q.option2);
            await page.fill('#option3', q.option3);
            await page.fill('#option4', q.option4);
            await page.selectOption('#correctAnswer', q.correct);
            await page.fill('#category', 'Test Category');
            await page.click('button:has-text("➕ Add Question to Quiz")');
            
            // Close the success dialog that appears after adding a question
            const closeButton = page.locator('button:has-text("✕ Just Close This")');
            if (await closeButton.isVisible()) {
                await closeButton.click();
            }
        }
    });

    test('should display question order numbers correctly', async ({ page }) => {
        // Check that questions are numbered 1, 2, 3
        const orderNumbers = await page.locator('.question-order').allTextContents();
        const trimmedNumbers = orderNumbers.map(num => num.trim());
        expect(trimmedNumbers).toEqual(['1', '2', '3']);
    });

    test('should show arrow buttons for reordering', async ({ page }) => {
        // Check that up arrows are present (except for first question)
        const upButtons = page.locator('button[title="Move up"]');
        await expect(upButtons).toHaveCount(3);
        
        // Check that down arrows are present (except for last question)
        const downButtons = page.locator('button[title="Move down"]');
        await expect(downButtons).toHaveCount(3);
        
        // Check that question cards are not draggable (we removed drag & drop)
        const questionCards = page.locator('.question-card');
        for (let i = 0; i < 3; i++) {
            const card = questionCards.nth(i);
            const draggable = await card.getAttribute('draggable');
            expect(draggable).toBeFalsy();
        }
    });

    test('should move question up with arrow button', async ({ page }) => {
        // Get initial question text
        const initialFirstQuestion = await page.locator('.question-card').first().locator('h4').textContent();
        const initialSecondQuestion = await page.locator('.question-card').nth(1).locator('h4').textContent();
        
        expect(initialFirstQuestion).toBe('First Question');
        expect(initialSecondQuestion).toBe('Second Question');
        
        // Click up arrow on second question
        await page.locator('.question-card').nth(1).locator('button[title="Move up"]').click();
        
        // Check that order changed
        const newFirstQuestion = await page.locator('.question-card').first().locator('h4').textContent();
        const newSecondQuestion = await page.locator('.question-card').nth(1).locator('h4').textContent();
        
        expect(newFirstQuestion).toBe('Second Question');
        expect(newSecondQuestion).toBe('First Question');
        
        // Check that order numbers updated
        const orderNumbers = await page.locator('.question-order').allTextContents();
        const trimmedNumbers = orderNumbers.map(num => num.trim());
        expect(trimmedNumbers).toEqual(['1', '2', '3']);
    });

    test('should move question down with arrow button', async ({ page }) => {
        // Get initial question text
        const initialSecondQuestion = await page.locator('.question-card').nth(1).locator('h4').textContent();
        const initialThirdQuestion = await page.locator('.question-card').nth(2).locator('h4').textContent();
        
        expect(initialSecondQuestion).toBe('Second Question');
        expect(initialThirdQuestion).toBe('Third Question');
        
        // Click down arrow on second question
        await page.locator('.question-card').nth(1).locator('button[title="Move down"]').click();
        
        // Check that order changed
        const newSecondQuestion = await page.locator('.question-card').nth(1).locator('h4').textContent();
        const newThirdQuestion = await page.locator('.question-card').nth(2).locator('h4').textContent();
        
        expect(newSecondQuestion).toBe('Third Question');
        expect(newThirdQuestion).toBe('Second Question');
    });

    test('should disable up arrow for first question', async ({ page }) => {
        const firstQuestionUpButton = page.locator('.question-card').first().locator('button[title="Move up"]');
        await expect(firstQuestionUpButton).toBeDisabled();
        await expect(firstQuestionUpButton).toHaveCSS('background-color', 'rgb(189, 195, 199)'); // #bdc3c7
    });

    test('should disable down arrow for last question', async ({ page }) => {
        const lastQuestionDownButton = page.locator('.question-card').last().locator('button[title="Move down"]');
        await expect(lastQuestionDownButton).toBeDisabled();
        await expect(lastQuestionDownButton).toHaveCSS('background-color', 'rgb(189, 195, 199)'); // #bdc3c7
    });

    test('should maintain question order in JSON export', async ({ page }) => {
        // Reorder questions: move second question up
        await page.locator('.question-card').nth(1).locator('button[title="Move up"]').click();
        
        // Ensure sidebar is closed to prevent interference
        const sidebar = page.locator('#sidebar');
        if (await sidebar.isVisible()) {
            await page.locator('.sidebar-toggle').click();
        }
        
        // Set test name
        await page.fill('#testName', 'Reorder Test');
        
        // Scroll to download section
        await page.locator('button:has-text("📄 Download JSON Only")').scrollIntoViewIfNeeded();
        
        // Start download and capture the JSON
        const downloadPromise = page.waitForEvent('download');
        await page.locator('button:has-text("📄 Download JSON Only")').click();
        const download = await downloadPromise;
        
        // Save and read the downloaded file
        const downloadPath = path.join(__dirname, 'temp_reorder_test.json');
        await download.saveAs(downloadPath);
        
        const fs = require('fs');
        const jsonContent = fs.readFileSync(downloadPath, 'utf8');
        const quizData = JSON.parse(jsonContent);
        
        // Check that questions are in the new order
        const questions = quizData.tests[0].questions;
        expect(questions[0].question).toBe('Second Question');
        expect(questions[1].question).toBe('First Question');
        expect(questions[2].question).toBe('Third Question');
        
        // Clean up
        fs.unlinkSync(downloadPath);
    });

    test('should show success dialog after adding new question', async ({ page }) => {
        // Add a fourth question to trigger the success dialog
        await page.fill('#question', 'Fourth Question');
        await page.fill('#option1', 'A4');
        await page.fill('#option2', 'B4');
        await page.fill('#option3', 'C4');
        await page.fill('#option4', 'D4');
        await page.selectOption('#correctAnswer', 'option1');
        await page.fill('#category', 'Test Category');
        await page.click('button:has-text("➕ Add Question to Quiz")');
        
        // Check that success dialog appears
        const successDialog = page.locator('#success-choices');
        await expect(successDialog).toBeVisible();
        
        // Check that it has the expected options
        await expect(page.locator('button:has-text("Add Another Question")')).toBeVisible();
        await expect(page.locator('button:has-text("Review & Reorder Questions")')).toBeVisible();
        await expect(page.locator('button:has-text("Save & Export Quiz")')).toBeVisible();
        
        // Close the dialog
        await page.click('button:has-text("✕ Just Close This")');
        await expect(successDialog).not.toBeVisible();
    });
});

test.describe('Question Reordering - Mobile', () => {
    test.use({ 
        viewport: { width: 375, height: 667 } // iPhone SE size
    });

    test.beforeEach(async ({ page }) => {
        const filePath = path.join(__dirname, '..', 'src', 'frontend', 'quizGenerator.html');
        await page.goto(`file://${filePath}`);
        
        await page.click('button:has-text("✨ Create New Quiz")');
        
        // Add two questions for mobile testing
        const questions = [
            { text: "Mobile Question 1", option1: "A1", option2: "B1", option3: "C1", option4: "D1", correct: "option1" },
            { text: "Mobile Question 2", option1: "A2", option2: "B2", option3: "C2", option4: "D2", correct: "option2" }
        ];
        
        for (const q of questions) {
            await page.fill('#question', q.text);
            await page.fill('#option1', q.option1);
            await page.fill('#option2', q.option2);
            await page.fill('#option3', q.option3);
            await page.fill('#option4', q.option4);
            await page.selectOption('#correctAnswer', q.correct);
            await page.fill('#category', 'Test Category');
            await page.click('button:has-text("➕ Add Question to Quiz")');
            
            // Close the success dialog that appears after adding a question
            const closeButton = page.locator('button:has-text("✕ Just Close This")');
            if (await closeButton.isVisible()) {
                await closeButton.click();
            }
        }
    });

    test('should have touch-friendly arrow buttons on mobile', async ({ page }) => {
        // Check that up/down buttons meet minimum touch target size (44px)
        const upButton = page.locator('.question-card').nth(1).locator('button[title="Move up"]');
        const downButton = page.locator('.question-card').first().locator('button[title="Move down"]');
        
        // Check minimum height
        await expect(upButton).toHaveCSS('min-height', '44px');
        await expect(downButton).toHaveCSS('min-height', '44px');
    });

    test('should have touch-friendly reorder buttons on mobile', async ({ page }) => {
        // Check that up/down buttons are touch-friendly (44px minimum)
        const upButton = page.locator('.question-card').nth(1).locator('button[title="Move up"]');
        const downButton = page.locator('.question-card').first().locator('button[title="Move down"]');
        
        // Check minimum touch target size (our buttons are 44px per accessibility guidelines)
        await expect(upButton).toHaveCSS('min-height', '44px');
        await expect(downButton).toHaveCSS('min-height', '44px');
    });

    test('should work with touch events for reordering', async ({ page }) => {
        // Simulate touch interaction on up arrow (use click as it works for both mouse and touch)
        const upButton = page.locator('.question-card').nth(1).locator('button[title="Move up"]');
        await upButton.click();
        
        // Check that reordering worked
        const newFirstQuestion = await page.locator('.question-card').first().locator('h4').textContent();
        expect(newFirstQuestion).toBe('Mobile Question 2');
    });
});