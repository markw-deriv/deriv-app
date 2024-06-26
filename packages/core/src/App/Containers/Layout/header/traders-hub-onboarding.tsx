import React from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { Icon, Popover } from '@deriv/components';
import { observer, useStore } from '@deriv/stores';
import { Localize } from '@deriv/translations';

const TradersHubOnboarding = observer(() => {
    const { client, traders_hub, ui } = useStore();
    const { has_wallet } = client;
    const { setIsFirstTimeVisit, toggleIsTourOpen, is_tour_open } = traders_hub;
    const { is_dark_mode_on, is_mobile } = ui;
    const [, setWalletsOnboarding] = useLocalStorage('walletsOnboarding', '');

    const onClickHandler = has_wallet
        ? () => {
              setWalletsOnboarding('started');
          }
        : () => {
              if (!is_tour_open) {
                  toggleIsTourOpen(true);
              }
              setIsFirstTimeVisit(false);
          };

    return (
        <div data-testid='dt_traders_hub_onboarding'>
            <div className='traders-hub-header__tradershub--onboarding--logo'>
                <Popover
                    classNameBubble='account-settings-toggle__tooltip'
                    alignment='bottom'
                    message={!is_mobile && <Localize i18n_default_text='View tutorial' />}
                    should_disable_pointer_events
                    zIndex='9999'
                >
                    <Icon
                        data_testid='dt_traders_hub_onboarding_icon'
                        icon={is_dark_mode_on ? 'IcAppstoreTradingHubOnboardingDark' : 'IcAppstoreTradingHubOnboarding'}
                        size={20}
                        onClick={onClickHandler}
                    />
                </Popover>
            </div>
        </div>
    );
});

export default TradersHubOnboarding;
