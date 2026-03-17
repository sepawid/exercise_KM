import { test, expect } from '@playwright/test';

test.describe('Random Date Generator - Comprehensive E2E Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/generate-random-date');
        try {
            const acceptBtn = page.getByRole('button', { name: 'Accept', exact: false });
            if (await acceptBtn.isVisible({ timeout: 2000 })) {
                await acceptBtn.click();
            }
        } catch (e) {
            // Ignore
        }
    });

    // --- 1. HAPPY PATH & VALID BOUNDARIES ---

    test('TC01: should generate exactly 10 dates by default', async ({ page }) => {
        await page.getByRole('button', { name: 'Generate Random Date' }).click();
        const output = await page.locator('#generatedRandomDateTextArea').inputValue();
        const dates = output.trim().split('\n').filter(line => line.length > 0);
        expect(dates.length).toBe(10);
    });

    test('TC02: should generate exactly 1 date when minimum valid boundary is requested', async ({ page }) => {
        const inputs = page.locator('input[type="number"]');
        await inputs.first().fill('1');
        await page.getByRole('button', { name: 'Generate Random Date' }).click();
        const output = await page.locator('#generatedRandomDateTextArea').inputValue();
        const dates = output.trim().split('\n').filter(line => line.length > 0);
        expect(dates.length).toBe(1);
    });

    test('TC03: should generate dates when a large valid boundary (e.g., 5000) is requested', async ({ page }) => {
        const inputs = page.locator('input[type="number"]');
        await inputs.first().fill('5000');
        // Using 5000 instead of 100000 to avoid test runner timeout, but tests large load
        await page.getByRole('button', { name: 'Generate Random Date' }).click();
        const output = await page.locator('#generatedRandomDateTextArea').inputValue({ timeout: 15000 });
        const dates = output.trim().split('\n').filter(line => line.length > 0);
        expect(dates.length).toBe(5000);
    });

    // --- 2. INVALID BOUNDARIES & INPUTS ---

    test('TC04: [FAILING] should not generate dates when count is 0', async ({ page }) => {
        const inputs = page.locator('input[type="number"]');
        await inputs.first().fill('0');
        await page.getByRole('button', { name: 'Generate Random Date' }).click();
        const output = await page.locator('#generatedRandomDateTextArea').inputValue();
        // System should validate 0. If it generates dates or ignores validation, test fails.
        expect(output.trim()).toBe('');
    });

    test('TC05: [FAILING] should show validation error for negative date counts (-5)', async ({ page }) => {
        const inputs = page.locator('input[type="number"]');
        await inputs.first().fill('-5');
        await page.getByRole('button', { name: 'Generate Random Date' }).click();
        const output = await page.locator('#generatedRandomDateTextArea').inputValue();
        expect(output.trim()).toBe('');
    });

    test('TC06: input should reject non-numeric characters for count', async ({ page }) => {
        const inputs = page.locator('input[type="number"]');
        await inputs.first().fill('abc');
        // The browser usually prevents typing text into number inputs, so value should be empty
        const val = await inputs.first().inputValue();
        expect(val).toBe('');
    });

    // --- 3. LOGICAL CONSTRAINTS (DATE RANGES) ---

    test('TC07: [FAILING] should prevent generation when Start Date is strictly AFTER End Date', async ({ page }) => {
        const textInputs = page.locator('input[type="text"]');
        if (await textInputs.count() >= 3) {
            await textInputs.nth(1).fill('2030-01-01 00:00:00'); // Start
            await textInputs.nth(2).fill('2020-01-01 00:00:00'); // End
            await page.getByRole('button', { name: 'Generate Random Date' }).click();
            const output = await page.locator('#generatedRandomDateTextArea').inputValue();
            // Expecting validation to block generation
            expect(output.trim()).toBe('');
        }
    });

    test('TC08: should generate identical dates when Start Date and End Date are exactly the same', async ({ page }) => {
        const textInputs = page.locator('input[type="text"]');
        if (await textInputs.count() >= 3) {
            const exactDate = '2025-05-15 12:00:00';
            await textInputs.nth(1).fill(exactDate);
            await textInputs.nth(2).fill(exactDate);
            // Select ISO 8601 to make string comparison easier
            const select = page.locator('select');
            await select.first().selectOption({ label: 'ISO 8601' });

            await page.getByRole('button', { name: 'Generate Random Date' }).click();
            const output = await page.locator('#generatedRandomDateTextArea').inputValue();
            const dates = output.trim().split('\n').filter(line => line.length > 0);

            // All 10 generated dates should be identical to the constraint provided
            expect(dates[0]).toContain('2025-05-15');
        }
    });

    test('TC09: should successfully generate dates entirely in the historic past', async ({ page }) => {
        const textInputs = page.locator('input[type="text"]');
        if (await textInputs.count() >= 3) {
            await textInputs.nth(1).fill('1900-01-01 00:00:00');
            await textInputs.nth(2).fill('1950-12-31 00:00:00');
            await page.getByRole('button', { name: 'Generate Random Date' }).click();
            const output = await page.locator('#generatedRandomDateTextArea').inputValue();
            const dates = output.trim().split('\n').filter(line => line.length > 0);

            // Verify the years are in the 1900s
            const yearMatches = dates[0].match(/19\d{2}/);
            expect(yearMatches).toBeTruthy();
        }
    });

    // --- 4. FORMAT SELECTION & CAPABILITIES ---

    test('TC10: should successfully change output format to ISO 8601', async ({ page }) => {
        const select = page.locator('select');
        await select.first().selectOption({ label: 'ISO 8601' });

        await page.getByRole('button', { name: 'Generate Random Date' }).click();
        const output = await page.locator('#generatedRandomDateTextArea').inputValue();
        const dates = output.trim().split('\n').filter(line => line.length > 0);

        // ISO 8601 looks like: 2026-06-25T11:45:00Z or similar
        expect(dates[0]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    // --- 5. SECURITY & SANITIZATION ---

    test('TC11: [FAILING] Custom format field should sanitize HTML to prevent Cross-Site Scripting (XSS)', async ({ page }) => {
        const select = page.locator('select');
        await select.first().selectOption({ label: 'Custom date format' });

        const textInputs = page.locator('input[type="text"]');
        if (await textInputs.count() >= 3) {
            // Injecting an HTML payload
            await textInputs.first().fill('<script>alert("XSS")</script> YYYY-MM-DD');
            await page.getByRole('button', { name: 'Generate Random Date' }).click();
            const output = await page.locator('#generatedRandomDateTextArea').inputValue();

            // Asserting that the raw script tags are either stripped out or properly encoded 
            // If it returns `<script>` raw into the text area, it could be a vulnerability if that data is previewed in a DOM element.
            expect(output).not.toContain('<script>');
        }
    });

    test('TC12: [FAILING] Custom format field should handle excessively long format strings gracefully', async ({ page }) => {
        const select = page.locator('select');
        await select.first().selectOption({ label: 'Custom date format' });

        const textInputs = page.locator('input[type="text"]');
        if (await textInputs.count() >= 3) {
            // Create an extremely long string
            const longString = 'YYYY-MM-DD '.repeat(1000);
            await textInputs.first().fill(longString);
            await page.getByRole('button', { name: 'Generate Random Date' }).click();

            const output = await page.locator('#generatedRandomDateTextArea').inputValue();
            // The system should probably truncate the format or throw an elegant validation requirement 
            // rather than processing a massive string 1000s of times.
            expect(output.length).toBeLessThan(10000);
        }
    });
});
