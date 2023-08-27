import { Context } from '../../utils/mocks/mocks';

export default function mock_trading_platform_accounts(context: Context) {
    if (
        'trading_platform_accounts' in context.request &&
        context.request.trading_platform_accounts === 1 &&
        context.request.platform === 'derivez'
    ) {
        context.response = {
            echo_req: {
                platform: 'derivez',
                req_id: context.req_id,
                trading_platform_accounts: 1,
            },
            msg_type: 'trading_platform_accounts',
            req_id: context.req_id,
            trading_platform_accounts: [],
        };
    }
}
