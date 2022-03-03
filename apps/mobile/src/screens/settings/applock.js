import React, { useState } from 'react';
import { LayoutAnimation, Platform, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BiometricService from '../../services/biometrics';
import { PressableButton } from '../../components/ui/pressable';
import Seperator from '../../components/ui/seperator';
import Heading from '../../components/ui/typography/heading';
import Paragraph from '../../components/ui/typography/paragraph';
import { useThemeStore } from '../../stores/theme';
import { useSettingStore } from '../../stores/stores';
import { presentSheet } from '../../services/event-manager';
import SettingsService from '../../services/settings';
import { SIZE } from '../../utils/size';
import { db } from '../../utils/database';
import { WelcomeNotice } from '../../components/intro/welcome';
import { Button } from '../../components/ui/button';
import { getElevation } from '../../utils';
import umami from '../../utils/analytics';

const AppLock = ({ welcome, s = 0 }) => {
  const colors = useThemeStore(state => state.colors);
  const appLockMode = useSettingStore(state => state.settings.appLockMode);

  const [step, setStep] = useState(s);

  const modes = [
    {
      title: 'No privacy',
      value: 'none',
      desc: 'Your notes are always unlocked. Anyone who has access to your phone can read them.',
      activeColor: colors.errorText
    },
    {
      title: 'Medium privacy',
      value: 'launch',
      desc: 'Your notes are locked when you exit the app but remain unlocked when you switch to other apps or background.',
      activeColor: colors.accent
    },
    {
      title: 'Maximum privacy (Recommended)',
      value: 'background',
      desc: `Your notes are locked immediately when you switch to other apps or background. ${
        Platform.OS === 'ios'
          ? 'App contents are hidden in app switcher'
          : 'Screenshots are disabled and app contents are hidden in app switcher.'
      }`,
      activeColor: colors.accent
    }
  ];

  return (
    <>
      {step === 0 ? (
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              width: '95%',
              paddingVertical: 12,
              paddingHorizontal: 0,
              alignSelf: 'center',
              minHeight: 125,
              borderBottomWidth: 1,
              borderBottomColor: colors.nav
            }}
          >
            <Icon
              name="shield-lock"
              color={colors.border}
              size={100}
              style={{
                position: 'absolute',
                right: 0,
                top: 6
              }}
            />

            <View>
              <Heading>Protect your notes</Heading>
              <Paragraph size={SIZE.md}>
                Choose how you want to secure your notes locally.
              </Paragraph>
            </View>
          </View>
          <Seperator />
          <View
            style={{
              paddingHorizontal: 12
            }}
          >
            {modes.map(item => (
              <PressableButton
                key={item.title}
                type={appLockMode === item.value ? 'grayBg' : 'transparent'}
                onPress={() => {
                  SettingsService.set({ appLockMode: item.value });
                }}
                customStyle={{
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  marginTop: 0,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: appLockMode === item.value ? item.activeColor : colors.nav
                }}
                style={{
                  marginBottom: 10
                }}
              >
                <Heading
                  color={appLockMode === item.value ? item.activeColor : colors.pri}
                  style={{ maxWidth: '95%' }}
                  size={SIZE.md}
                >
                  {item.title}
                </Heading>
                <Paragraph
                  color={appLockMode === item.value ? item.activeColor : colors.icon}
                  style={{ maxWidth: '95%' }}
                  size={SIZE.sm}
                >
                  {item.desc}
                </Paragraph>
              </PressableButton>
            ))}

            {welcome && (
              <Button
                fontSize={SIZE.md}
                height={45}
                width={250}
                onPress={async () => {
                  LayoutAnimation.configureNext({
                    ...LayoutAnimation.Presets.linear,
                    delete: {
                      duration: 50,
                      property: 'opacity',
                      type: 'linear'
                    }
                  });
                  umami.pageView('/privacymode', '/welcome');
                  setStep(1);
                }}
                style={{
                  paddingHorizontal: 24,
                  alignSelf: 'center',
                  borderRadius: 100,
                  ...getElevation(5),
                  marginTop: 30
                }}
                type="accent"
                title="Next"
              />
            )}
          </View>
        </>
      ) : (
        <WelcomeNotice />
      )}
    </>
  );
};

AppLock.present = async isWelcome => {
  let available = await BiometricService.isBiometryAvailable();
  let user = await db.user.getUser();
  presentSheet({
    component: <AppLock welcome={isWelcome} s={!available && !user ? 1 : 0} />,
    disableClosing: isWelcome
  });
};

export default AppLock;
