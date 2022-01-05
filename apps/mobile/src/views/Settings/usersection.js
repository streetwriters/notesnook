import dayjs from 'dayjs';
import React from 'react';
import {Linking, Platform, View} from 'react-native';
import * as RNIap from 'react-native-iap';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Button} from '../../components/Button';
import Seperator from '../../components/Seperator';
import {Card} from '../../components/SimpleList/card';
import Heading from '../../components/Typography/Heading';
import Paragraph from '../../components/Typography/Paragraph';
import {useTracked} from '../../provider';
import {useMessageStore, useUserStore} from '../../provider/stores';
import {
  eSendEvent,
  presentSheet,
  ToastEvent
} from '../../services/EventManager';
import PremiumService from '../../services/PremiumService';
import Sync from '../../services/Sync';
import {
  SUBSCRIPTION_PROVIDER,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_STATUS_STRINGS
} from '../../utils';
import {
  eCloseProgressDialog,
  eOpenLoginDialog,
  eOpenPremiumDialog,
  eOpenRecoveryKeyDialog
} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {CustomButton} from './button';
import {verifyUser} from './functions';

const getTimeLeft = t2 => {
  let daysRemaining = dayjs(t2).diff(dayjs(), 'days');
  return {
    time: dayjs(t2).diff(dayjs(), daysRemaining === 0 ? 'hours' : 'days'),
    isHour: daysRemaining === 0
  };
};

const SettingsUserSection = () => {
  const [state] = useTracked();
  const {colors} = state;

  const user = useUserStore(state => state.user);
  const messageBoardState = useMessageStore(state => state.message);
  const subscriptionDaysLeft =
    user && getTimeLeft(parseInt(user.subscription?.expiry));
  const isExpired = user && subscriptionDaysLeft.time < 0;
  const expiryDate = dayjs(user?.subscription?.expiry).format('MMMM D, YYYY');
  const startDate = dayjs(user?.subscription?.start).format('MMMM D, YYYY');

  const manageSubscription = () => {
    if (!user.isEmailConfirmed) {
      PremiumService.showVerifyEmailDialog();
      return;
    }
    if (
      user.subscription?.type === SUBSCRIPTION_STATUS.PREMIUM_CANCELLED &&
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
      Linking.openURL(
        Platform.OS === 'ios'
          ? 'https://apps.apple.com/account/subscriptions'
          : 'https://play.google.com/store/account/subscriptions'
      );
    } else {
      eSendEvent(eOpenPremiumDialog);
    }
  };

  return (
    <>
      {user ? (
        <>
          <View
            style={{
              paddingHorizontal: 12,
              marginTop: 15,
              marginBottom: 15
            }}>
            <View
              style={{
                alignSelf: 'center',
                width: '100%',
                paddingVertical: 12,
                backgroundColor: colors.bg,
                borderRadius: 5
              }}>
              <View
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexDirection: 'row',
                  paddingBottom: 4,
                  borderBottomWidth: 1,
                  borderColor: colors.accent
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                  <View
                    style={{
                      borderWidth: 1,
                      borderRadius: 100,
                      borderColor: colors.accent,
                      width: 20,
                      height: 20,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                    <Icon
                      size={SIZE.md}
                      color={colors.accent}
                      name="account-outline"
                    />
                  </View>

                  <Paragraph
                    color={colors.heading}
                    size={SIZE.sm}
                    style={{
                      marginLeft: 5
                    }}>
                    {user?.email}
                  </Paragraph>
                </View>
                <View
                  style={{
                    borderRadius: 5,
                    padding: 5,
                    paddingVertical: 2.5
                  }}>
                  <Heading color={colors.accent} size={SIZE.sm}>
                    {SUBSCRIPTION_STATUS_STRINGS[user.subscription?.type]}
                  </Heading>
                </View>
              </View>
              <View>
                {user.subscription?.type !== SUBSCRIPTION_STATUS.BASIC ? (
                  <View>
                    <Seperator />
                    <Paragraph
                      size={SIZE.lg}
                      style={{
                        textAlign: 'center'
                      }}
                      color={
                        (subscriptionDaysLeft.time > 5 &&
                          !subscriptionDaysLeft.isHour) ||
                        user.subscription?.type !== 6
                          ? colors.accent
                          : colors.red
                      }>
                      {isExpired
                        ? 'Your subscription has ended.'
                        : user.subscription?.type === 1
                        ? `Your free trial has started`
                        : `Subscribed to Notesnook Pro`}
                    </Paragraph>
                    <Paragraph
                      style={{
                        textAlign: 'center'
                      }}
                      color={colors.pri}>
                      {user.subscription?.type === 2
                        ? 'You signed up on ' + startDate
                        : user.subscription?.type === 1
                        ? 'Your free trial will end on ' + expiryDate
                        : user.subscription?.type === 6
                        ? subscriptionDaysLeft.time < -3
                          ? 'Your subscription has ended'
                          : 'Your account will be downgraded to Basic in 3 days'
                        : user.subscription?.type === 7
                        ? `Your subscription will end on ${expiryDate}.`
                        : user.subscription?.type === 5
                        ? `Your subscription will renew on ${expiryDate}.`
                        : null}
                    </Paragraph>
                  </View>
                ) : null}

                {user.subscription?.type !== SUBSCRIPTION_STATUS.PREMIUM &&
                  user.subscription?.type !== SUBSCRIPTION_STATUS.BETA && (
                    <>
                      <Seperator />
                      <Button
                        onPress={manageSubscription}
                        width="100%"
                        style={{
                          paddingHorizontal: 0
                        }}
                        fontSize={SIZE.md}
                        title={
                          !user.isEmailConfirmed
                            ? 'Confirm your email to get 7 days more'
                            : user.subscription?.provider === 3 &&
                              user.subscription?.type ===
                                SUBSCRIPTION_STATUS.PREMIUM_CANCELLED
                            ? 'Manage subscription from desktop app'
                            : user.subscription?.type ===
                                SUBSCRIPTION_STATUS.PREMIUM_CANCELLED &&
                              Platform.OS === 'android'
                            ? `Resubscribe from Google Playstore`
                            : user.subscription?.type ===
                              SUBSCRIPTION_STATUS.PREMIUM_EXPIRED
                            ? `Resubscribe to Notesnook Pro (${
                                PremiumService.getMontlySub().localizedPrice
                              } / mo)`
                            : `Subscribe to Notesnook Pro (${
                                PremiumService.getMontlySub().localizedPrice
                              } / mo)`
                        }
                        height={50}
                        type="accent"
                      />
                    </>
                  )}
              </View>

              {user?.subscription?.provider &&
              user.subscription?.type !== SUBSCRIPTION_STATUS.PREMIUM_EXPIRED &&
              user.subscription?.type !== SUBSCRIPTION_STATUS.BASIC &&
              SUBSCRIPTION_PROVIDER[user?.subscription?.provider] ? (
                <Button
                  title={
                    SUBSCRIPTION_PROVIDER[user?.subscription?.provider]?.title
                  }
                  onPress={() => {
                    presentSheet({
                      title:
                        SUBSCRIPTION_PROVIDER[user?.subscription?.provider]
                          .title,
                      paragraph:
                        SUBSCRIPTION_PROVIDER[user?.subscription?.provider]
                          .desc,
                      noProgress: true
                    });
                  }}
                  style={{
                    alignSelf: 'flex-end',
                    marginTop: 10,
                    borderRadius: 3,
                    zIndex: 10
                  }}
                  fontSize={11}
                  textStyle={{
                    fontWeight: 'normal'
                  }}
                  height={20}
                  type="accent"
                />
              ) : null}
            </View>
          </View>

          {[
            {
              name: 'Save data recovery key',
              func: async () => {
                verifyUser(null, async () => {
                  await sleep(300);
                  eSendEvent(eOpenRecoveryKeyDialog);
                });
              },
              desc: 'Recover your data using the recovery key if your password is lost.'
            },
            {
              name: 'Change password',
              func: async () => {
                eSendEvent(eOpenLoginDialog, 3);
              },
              desc: 'Setup a new password for your account.'
            },
            {
              name: 'Having problems with syncing?',
              func: async () => {
                await Sync.run('global', true);
              },
              desc: 'Try force sync to resolve issues with syncing.'
            },
            {
              name: 'Subscription not activated?',
              func: async () => {
                if (Platform.OS === 'android') return;
                presentSheet({
                  title: 'Loading subscriptions',
                  paragraph: `Please wait while we fetch your subscriptions.`
                });
                let subscriptions = await RNIap.getPurchaseHistory();
                subscriptions.sort(
                  (a, b) => b.transactionDate - a.transactionDate
                );
                let currentSubscription = subscriptions[0];
                presentSheet({
                  title: 'Notesnook Pro',
                  paragraph: `You subscribed to Notesnook Pro on ${new Date(
                    currentSubscription.transactionDate
                  ).toLocaleString()}. Verify this subscription?`,
                  action: async () => {
                    presentSheet({
                      title: 'Verifying subscription',
                      paragraph: `Please wait while we verify your subscription.`
                    });
                    await PremiumService.subscriptions.verify(
                      currentSubscription
                    );
                    eSendEvent(eCloseProgressDialog);
                  },
                  icon: 'information-outline',
                  actionText: 'Verify',
                  noProgress: true
                });
              },
              desc: 'Verify your subscription to Notesnook Pro'
            }
          ].map(item =>
            item.name === 'Subscription not activated?' &&
            (Platform.OS !== 'ios' || PremiumService.get()) ? null : (
              <CustomButton
                key={item.name}
                title={item.name}
                onPress={item.func}
                tagline={item.desc}
                color={item.name === 'Logout' ? colors.errorText : colors.pri}
              />
            )
          )}
        </>
      ) : null}
    </>
  );
};

export default SettingsUserSection;
