import { test, expect } from '@playwright/test';
import { mock_residents_list, mock_states_list, mock_general, mock_loggedIn, setupMocks } from '@deriv/integration';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

test.describe('Cashier - Menu', () => {
    test('the navigation menu highlights the active page', async ({ page, baseURL }) => {
        await setupMocks({
            baseURL,
            page,
            mocks: [mock_general, mock_loggedIn, mock_residents_list, mock_states_list],
        });
        await page.goto(`${baseURL}/cashier/deposit`);

        await sleep(1000);

        const header = await page.locator('header'); // Select the header element

        // const tradersHubLink = await header.getByRole('link', { name: `Trader's Hub` });
        const reportsLink = await header.getByRole('link', { name: 'Reports' }).first();
        const cashierLink = await header.getByRole('link', { name: 'Cashier' }).first();

        await cashierLink.innerHTML();

        // expect(tradersHubLink).not.toHaveAttribute('aria-current', 'page');
        // expect(reportsLink).not.toHaveAttribute('aria-current', 'page');
        expect(reportsLink).not.toHaveAttribute('aria-current', 'page');
        expect(cashierLink).toHaveAttribute('aria-current', 'page');
    });
});
