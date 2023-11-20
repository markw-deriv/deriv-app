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

        // await sleep(1000);

        const header = await page.locator('header');

        // await cashierLink.innerHTML();

        const reportsAriaCurrent = await header.getByRole('link', { name: 'Reports' }).getAttribute('aria-current');
        const cashierAriaCurrent = await header.getByRole('link', { name: 'Cashier' }).getAttribute('aria-current');

        expect(reportsAriaCurrent).toEqual(null);
        expect(cashierAriaCurrent).toEqual('page');
    });
});
