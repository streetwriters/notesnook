import React from 'react';
import { Linking, Platform, View } from 'react-native';
import { Button } from '../../components/ui/button';
import { eSendEvent, presentSheet, ToastEvent } from '../../services/event-manager';
import PremiumService from '../../services/premium';
import { useUserStore } from '../../stores/use-user-store';
import { SUBSCRIPTION_PROVIDER, SUBSCRIPTION_STATUS } from '../../utils/constants';
import { eOpenPremiumDialog } from '../../utils/events';
import { usePricing } from '../../hooks/use-pricing';
import { SIZE } from '../../utils/size';

export const Subscription = () => {
  const user = useUserStore(state => state.user);
  const monthlyPlan = usePricing('monthly');
  const isNotPro =
    user?.subscription?.type !== SUBSCRIPTION_STATUS.PREMIUM &&
    user?.subscription?.type !== SUBSCRIPTION_STATUS.BETA;

  const subscriptionProviderInfo = SUBSCRIPTION_PROVIDER[user?.subscription?.provider];

  const manageSubscription = () => {
    if (!user?.isEmailConfirmed) {
      PremiumService.showVerifyEmailDialog();
      return;
    }
    if (
      user?.subscription?.type === SUBSCRIPTION_STATUS.PREMIUM_CANCELLED &&
      Platform.OS === 'android'
    ) {
      if (user.subscription?.provider === 3) {
        ToastEvent.show({
          heading: 'Subscribed on web',
          message: 'Open your web browser to manage your subscription.',
          type: 'success'
        });
        return;
      }
      Linking.openURL('https://play.google.com/store/account/subscriptions');

      /**
         *   
         * Platform.OS === 'ios'
            ? 'https://apps.apple.com/account/subscriptions'
            : 'https://play.google.com/store/account/subscriptions'
         */
    } else {
      eSendEvent(eOpenPremiumDialog);
    }
  };

  return (
    <View>
      {isNotPro ? (
        <Button
          height={35}
          style={{
            borderRadius: 100,
            paddingHorizontal: 16,
            alignSelf: 'flex-start'
          }}
          fontSize={SIZE.sm}
          type="accent"
          onPress={manageSubscription}
          title={
            !user?.isEmailConfirmed
              ? 'Confirm your email'
              : user.subscription?.provider === 3 &&
                user.subscription?.type === SUBSCRIPTION_STATUS.PREMIUM_CANCELLED
              ? 'Manage subscription from desktop app'
              : user.subscription?.type === SUBSCRIPTION_STATUS.PREMIUM_CANCELLED &&
                Platform.OS === 'android'
              ? `Resubscribe from Google Playstore`
              : user.subscription?.type === SUBSCRIPTION_STATUS.PREMIUM_EXPIRED
              ? `Resubscribe to Pro (${monthlyPlan?.product?.localizedPrice} / mo)`
              : `Get Pro (${monthlyPlan?.product?.localizedPrice} / mo)`
          }
        />
      ) : null}

      {subscriptionProviderInfo &&
      user.subscription?.type !== SUBSCRIPTION_STATUS.PREMIUM_EXPIRED &&
      user.subscription?.type !== SUBSCRIPTION_STATUS.BASIC ? (
        <Button
          title={subscriptionProviderInfo?.title}
          onPress={() => {
            presentSheet({
              title: subscriptionProviderInfo.title,
              paragraph: subscriptionProviderInfo.desc
            });
          }}
          style={{
            alignSelf: 'flex-start',
            borderRadius: 100
          }}
          fontSize={SIZE.sm}
          height={30}
          type="grayAccent"
        />
      ) : null}
    </View>
  );
};
