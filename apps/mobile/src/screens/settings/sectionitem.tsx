import { NavigationProp, StackActions, useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import React, { ReactElement } from 'react';
import { Linking, Platform, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ToggleSwitch from 'toggle-switch-react-native';
import { Button } from '../../components/ui/button';
import { PressableButton } from '../../components/ui/pressable';
import Seperator from '../../components/ui/seperator';
import Paragraph from '../../components/ui/typography/paragraph';
import { eSendEvent, presentSheet, ToastEvent } from '../../services/event-manager';
import PremiumService from '../../services/premium';
import SettingsService from '../../services/settings';
import { useSettingStore, useUserStore } from '../../stores/stores';
import { useThemeStore } from '../../stores/theme';
import { SUBSCRIPTION_PROVIDER, SUBSCRIPTION_STATUS } from '../../utils/constants';
import { eOpenPremiumDialog } from '../../utils/events';
import { usePricing } from '../../utils/hooks/use-pricing';
import { SIZE } from '../../utils/size';
import { AccentColorPicker, HomagePageSelector } from './appearance';
import { AutomaticBackupsSelector } from './backup-restore';
import { RouteParams, SettingSection } from './types';
import { getTimeLeft } from './user-section';

const Subscription = () => {
  const user: any = useUserStore(state => state.user);
  const monthlyPlan = usePricing('monthly');
  const colors = useThemeStore(state => state.colors);
  const isNotPro =
    user.subscription?.type !== SUBSCRIPTION_STATUS.PREMIUM &&
    user.subscription?.type !== SUBSCRIPTION_STATUS.BETA;

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
        />
      ) : null}

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
            alignSelf: 'flex-start',
            paddingHorizontal: 0
          }}
          fontSize={SIZE.sm}
          textStyle={{
            fontWeight: 'normal'
          }}
          height={30}
          type="transparent"
        />
      ) : null}
    </View>
  );
};

const components: { [name: string]: ReactElement } = {
  colorpicker: <AccentColorPicker wrap={true} />,
  homeselector: <HomagePageSelector />,
  autobackups: <AutomaticBackupsSelector />,
  subscription: <Subscription />
};

export const SectionItem = ({ item }: { item: SettingSection }) => {
  const colors = useThemeStore(state => state.colors);
  const settings = useSettingStore(state => state.settings);
  const navigation = useNavigation<NavigationProp<RouteParams>>();
  const current = item.useHook && item.useHook(item);
  const isHidden = item.hidden && item.hidden(item.property || current);

  const onChangeSettings = () => {
    if (item.modifer) {
      item.modifer(item.property || current);
      return;
    }
    if (!item.property) return;
    SettingsService.set({
      [item.property]: !settings[item.property]
    });
  };

  const styles =
    item.type === 'danger'
      ? {
          backgroundColor: colors.errorBg
        }
      : {};

  return isHidden ? null : (
    <PressableButton
      disabled={item.type === 'component'}
      customStyle={{
        width: '100%',
        alignItems: 'center',
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 20,
        ...styles
      }}
      onPress={() => {
        switch (item.type) {
          case 'screen':
            navigation.dispatch(StackActions.push('SettingsGroup', item));
            break;
          case 'switch':
            onChangeSettings();
            break;
          default:
            item.modifer && item.modifer(current);
            break;
        }
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          flexShrink: 1
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
            backgroundColor: item.component === 'colorpicker' ? colors.accent : undefined,
            borderRadius: 100
          }}
        >
          {!!item.icon && (
            <Icon
              color={item.type === 'danger' ? colors.errorText : colors.icon}
              name={item.icon}
              size={30}
            />
          )}
        </View>

        <View
          style={{
            flexShrink: 1,
            paddingRight: item.type === 'switch' ? 10 : 0
          }}
        >
          <Paragraph
            color={item.type === 'danger' ? colors.errorText : colors.heading}
            size={SIZE.md + 1}
          >
            {typeof item.name === 'function' ? item.name(current) : item.name}
          </Paragraph>
          {!!item.description && (
            <Paragraph
              color={item.type === 'danger' ? colors.errorText : colors.pri}
              size={SIZE.sm}
            >
              {typeof item.description === 'function'
                ? item.description(current)
                : item.description}
            </Paragraph>
          )}

          {!!item.component && (
            <>
              <Seperator half />
              {components[item.component]}
            </>
          )}
        </View>
      </View>

      {item.type === 'switch' && item.property && (
        <ToggleSwitch
          isOn={item.getter ? item.getter(item.property || current) : settings[item.property]}
          onColor={colors.accent}
          offColor={colors.icon}
          size="small"
          animationSpeed={150}
          onToggle={onChangeSettings}
        />
      )}
    </PressableButton>
  );
};
