import dayjs from 'dayjs';
import React from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import * as RNIap from 'react-native-iap';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ChangePassword } from '../../components/auth/change-password';
import { Progress } from '../../components/sheets/progress';
import { Button } from '../../components/ui/button';
import Seperator from '../../components/ui/seperator';
import Heading from '../../components/ui/typography/heading';
import Paragraph from '../../components/ui/typography/paragraph';
import { eSendEvent, presentSheet, ToastEvent } from '../../services/event-manager';
import PremiumService from '../../services/premium';
import Sync from '../../services/sync';
import { useUserStore } from '../../stores/stores';
import { useThemeStore } from '../../stores/theme';

import { SectionItem } from './section-item';
import {
  SUBSCRIPTION_PROVIDER,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_STATUS_STRINGS
} from '../../utils/constants';
import {
  eCloseProgressDialog,
  eOpenAttachmentsDialog,
  eOpenPremiumDialog,
  eOpenRecoveryKeyDialog
} from '../../utils/events';
import { usePricing } from '../../utils/hooks/use-pricing';
import { SIZE } from '../../utils/size';
import { sleep } from '../../utils/time';
import TwoFactorAuth from './2fa';
import { CustomButton } from './button';
import { verifyUser } from './functions';
import { TimeSince } from '../../components/ui/time-since';

const getTimeLeft = t2 => {
  let daysRemaining = dayjs(t2).diff(dayjs(), 'days');
  return {
    time: dayjs(t2).diff(dayjs(), daysRemaining === 0 ? 'hours' : 'days'),
    isHour: daysRemaining === 0
  };
};

const SettingsUserSection = ({ item }) => {
  const colors = useThemeStore(state => state.colors);

  const user = useUserStore(state => state.user);
  const subscriptionDaysLeft = user && getTimeLeft(parseInt(user.subscription?.expiry));
  const isExpired = user && subscriptionDaysLeft.time < 0;
  const expiryDate = dayjs(user?.subscription?.expiry).format('MMMM D, YYYY');
  const startDate = dayjs(user?.subscription?.start).format('MMMM D, YYYY');
  const monthlyPlan = usePricing('monthly');

  const lastSynced = useUserStore(state => state.lastSynced);

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
              marginTop: 15
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: '100%',
                paddingVertical: 12,
                backgroundColor: colors.bg,
                borderRadius: 5
              }}
            >
              <View
                style={{
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                  paddingBottom: 4
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    width: '100%',
                    justifyContent: 'space-between'
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row'
                    }}
                  >
                    <View
                      style={{
                        alignItems: 'center'
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: colors.shade,
                          borderRadius: 100,
                          width: 50,
                          height: 50,
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Icon size={SIZE.xl} color={colors.accent} name="camera-outline" />
                      </View>
                    </View>

                    <View
                      style={{
                        marginLeft: 10
                      }}
                    >
                      <Heading color={colors.accent} size={SIZE.xs + 1}>
                        {SUBSCRIPTION_STATUS_STRINGS[user.subscription?.type].toUpperCase()}
                      </Heading>

                      <Paragraph color={colors.heading} size={SIZE.sm}>
                        {user?.email}
                      </Paragraph>
                      <Paragraph color={colors.icon} size={SIZE.xs}>
                        Last synced{' '}
                        <TimeSince
                          style={{ fontSize: SIZE.xs, color: colors.icon }}
                          time={lastSynced}
                        />
                      </Paragraph>
                    </View>
                  </View>

                  <Button
                    height={35}
                    style={{
                      borderRadius: 100,
                      paddingHorizontal: 12
                    }}
                    fontSize={SIZE.xs}
                    type="accent"
                    title="GET PRO"
                  />
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
                        (subscriptionDaysLeft.time > 5 && !subscriptionDaysLeft.isHour) ||
                        user.subscription?.type !== 6
                          ? colors.accent
                          : colors.red
                      }
                    >
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
                      color={colors.pri}
                    >
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

                {/* {user.subscription?.type !== SUBSCRIPTION_STATUS.PREMIUM &&
                  user.subscription?.type !== SUBSCRIPTION_STATUS.BETA && (
                    <>
                      <Seperator />
                      <Button
                        onPress={manageSubscription}
                        style={{
                          paddingHorizontal: 24,
                          borderRadius: 100,
                          height: 40,
                          alignSelf: 'flex-end'
                        }}
                        fontSize={SIZE.sm}
                        title={
                          !user.isEmailConfirmed
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
                        height={50}
                        type="accent"
                      />
                    </>
                  )} */}
              </View>

              {user?.subscription?.provider &&
              user.subscription?.type !== SUBSCRIPTION_STATUS.PREMIUM_EXPIRED &&
              user.subscription?.type !== SUBSCRIPTION_STATUS.BASIC &&
              SUBSCRIPTION_PROVIDER[user?.subscription?.provider] ? (
                <Button
                  title={SUBSCRIPTION_PROVIDER[user?.subscription?.provider]?.title}
                  onPress={() => {
                    presentSheet({
                      title: SUBSCRIPTION_PROVIDER[user?.subscription?.provider].title,
                      paragraph: SUBSCRIPTION_PROVIDER[user?.subscription?.provider].desc
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

          {item.sections.map(item => (
            <SectionItem key={item.name} item={item} />
          ))}
        </>
      ) : null}
    </>
  );
};

export default SettingsUserSection;
