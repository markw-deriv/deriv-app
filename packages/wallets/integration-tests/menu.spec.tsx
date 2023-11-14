import { mockGeneral, mockLoggedIn, setupMocks } from '@deriv/integration';
import { expect, test } from '@playwright/test';
import { mockBalance } from './mocks/mockBalance';
import { mockCryptoConfig } from './mocks/mockCryptoConfig';
import { mockGetAccountTypes } from './mocks/mockGetAccountTypes';
import { mockProposalOpenContract } from './mocks/mockProposalOpenContract';
import mockWalletsAuthorize, { DEFAULT_WALLET_ACCOUNTS } from './mocks/mockWalletsAuthorize';

test.describe('Wallets - Traders Hub', () => {
    test('render header', async ({ baseURL, page }) => {
        await setupMocks({
            baseURL,
            mocks: [
                mockGeneral,
                mockLoggedIn,
                mockWalletsAuthorize,
                mockGetAccountTypes,
                mockCryptoConfig,
                mockProposalOpenContract,
                mockBalance,
            ],
            page,
            state: {
                accounts: DEFAULT_WALLET_ACCOUNTS,
            },
        });
        await page.goto(`${baseURL}/wallets`);

        await expect(page.getByText(`Trader's Hub`)).toBeVisible();
        await expect(page.getByText(`Cashier`)).toBeVisible();
    });
});
