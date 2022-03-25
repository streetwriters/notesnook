import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, ScrollView, View } from 'react-native';
import { APP_VERSION } from '../../../version';
import { Button as MButton } from '../../components/ui/button/index';
import { ContainerHeader } from '../../components/container/containerheader';
import { Issue } from '../../components/sheets/github/issue';
import { Header as TopHeader } from '../../components/header/index';
import Seperator from '../../components/ui/seperator';
import Paragraph from '../../components/ui/typography/paragraph';
import { useThemeStore } from '../../stores/theme';
import { eSendEvent, presentSheet } from '../../services/event-manager';
import Navigation from '../../services/navigation';
import { InteractionManager } from '../../utils';
import { STORE_LINK } from '../../utils/constants';
import { eScrollEvent, eUpdateSearchState } from '../../utils/events';
import { openLinkInBrowser } from '../../utils/functions';
import SettingsAppearanceSection from './appearance';
import SettingsBackupAndRestore from './backup-restore';
import { CustomButton } from './button';
import SettingsDeveloperOptions from './developeroptions';
import SettingsGeneralOptions from './general';
import AccoutLogoutSection from './logout';
import SettingsPrivacyAndSecurity from './privacy';
import SectionHeader from './section-header';
import SettingsUserSection from './user-section';
import TwoFactorAuth from './2fa';

const format = ver => {
  let parts = ver.toString().split('');
  return `v${parts[0]}.${parts[1]}.${parts[2]?.startsWith('0') ? '' : parts[2]}${
    !parts[3] ? '' : parts[3]
  } `;
};

export const Settings = ({ navigation }) => {
  const colors = useThemeStore(state => state.colors);
  const [collapsed, setCollapsed] = useState(false);

  let pageIsLoaded = false;

  const onFocus = useCallback(() => {
    eSendEvent(eUpdateSearchState, {
      placeholder: '',
      data: [],
      noSearch: true,
      type: '',
      color: null
    });

    if (!pageIsLoaded) {
      pageIsLoaded = true;
      return;
    }
    Navigation.setHeaderState(
      'Settings',
      {
        menu: true
      },
      {
        heading: 'Settings',
        id: 'settings_navigation'
      }
    );
  }, []);

  // const checkAppUpdateAvailable = async () => {
  //   try {
  //     const version = await checkVersion();
  //     if (!version.needsUpdate) {
  //       ToastEvent.show({
  //         heading: 'You are on the latest version',
  //         type: 'success'
  //       });
  //       return false;
  //     }
  //     presentSheet({
  //       noIcon: true,
  //       noProgess: true,
  //       component: ref => <Update version={version} fwdRef={ref} />
  //     });
  //     return true;
  //   } catch (e) {
  //     ToastEvent.show({
  //       heading: 'You are on the latest version',
  //       type: 'success'
  //     });
  //     return false;
  //   }
  // };

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      navigation.addListener('focus', onFocus);
    });

    return () => {
      pageIsLoaded = false;
      navigation.removeListener('focus', onFocus);
    };
  }, []);

  const otherItems = [
    {
      name: 'Terms of service',
      func: async () => {
        try {
          await openLinkInBrowser('https://notesnook.com/tos', colors);
        } catch (e) {}
      },
      desc: 'Read our terms of service'
    },
    {
      name: 'Privacy policy',
      func: async () => {
        try {
          await openLinkInBrowser('https://notesnook.com/privacy', colors);
        } catch (e) {}
      },
      desc: 'Read our privacy policy'
    },
    {
      name: `Report an issue`,
      func: async () => {
        presentSheet({
          component: <Issue />
        });
      },
      desc: `Faced an issue or have a suggestion? Click here to create a bug report`
    },
    {
      name: 'Join our Telegram group',
      desc: "We are on telegram, let's talk",
      func: () => {
        Linking.openURL('https://t.me/notesnook').catch(console.log);
      }
    },
    {
      name: 'Join our Discord community',
      func: async () => {
        presentSheet({
          title: 'Join our Discord Community',
          iconColor: 'discord',
          paragraph: 'We are not ghosts, chat with us and share your experience.',
          valueArray: [
            'Talk with us anytime.',
            'Follow the development process',
            'Give suggestions and report issues.',
            'Get early access to new features',
            'Meet other people using Notesnook'
          ],
          icon: 'discord',
          action: async () => {
            try {
              Linking.openURL('https://discord.gg/zQBK97EE22').catch(console.log);
            } catch (e) {}
          },
          actionText: 'Join Now'
        });
      },
      desc: 'We are not ghosts, chat with us and share your experience.'
    },
    {
      name: 'Download on desktop',
      func: async () => {
        try {
          await openLinkInBrowser('https://notesnook.com', colors);
        } catch (e) {}
      },
      desc: 'Notesnook app can be downloaded on all platforms'
    },
    {
      name: 'Documentation',
      func: async () => {
        try {
          await openLinkInBrowser('https://docs.notesnook.com', colors);
        } catch (e) {}
      },
      desc: 'Learn about every feature and how it works.'
    },
    {
      name: 'Roadmap',
      func: async () => {
        try {
          await openLinkInBrowser('https://docs.notesnook.com/roadmap/', colors);
        } catch (e) {}
      },
      desc: 'See what the future of Notesnook is going to be like.'
    },
    {
      name: 'About Notesnook',
      func: async () => {
        try {
          await openLinkInBrowser('https://notesnook.com', colors);
        } catch (e) {}
      },
      desc: format(APP_VERSION)
    }
  ];

  return (
    <>
      <ContainerHeader>
        <TopHeader title="Settings" isBack={false} screen="Settings" />
      </ContainerHeader>
      <View
        style={{
          height: '100%',
          backgroundColor: colors.bg
        }}
      >
        <ScrollView
          onScroll={e =>
            eSendEvent(eScrollEvent, {
              y: e.nativeEvent.contentOffset.y,
              screen: 'Settings'
            })
          }
          scrollEventThrottle={1}
          style={{
            paddingHorizontal: 0
          }}
        >
          <SettingsUserSection />

          <SettingsAppearanceSection />

          {Platform.OS === 'android' ? <SettingsGeneralOptions /> : null}

          <SettingsPrivacyAndSecurity />

          <SettingsBackupAndRestore />

          <SettingsDeveloperOptions />

          <SectionHeader collapsed={collapsed} setCollapsed={setCollapsed} title="Other" />

          {!collapsed && (
            <>
              <View
                style={{
                  borderRadius: 5,
                  paddingVertical: 10,
                  width: '95%',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  marginTop: 10,
                  backgroundColor: colors.nav,
                  alignSelf: 'center'
                }}
              >
                <Paragraph
                  style={{
                    flexWrap: 'wrap',
                    flexBasis: 1,
                    textAlign: 'center'
                  }}
                  color={colors.pri}
                >
                  It took us a year to bring Notesnook to you. Help us make it better by rating it
                  on {Platform.OS === 'ios' ? 'Appstore' : 'Playstore'}
                </Paragraph>
                <Seperator />
                <MButton
                  type="accent"
                  width="100%"
                  title={`Rate us on ${Platform.OS === 'ios' ? 'Appstore' : 'Playstore'}`}
                  onPress={async () => {
                    try {
                      await Linking.openURL(STORE_LINK);
                    } catch (e) {}
                  }}
                />
              </View>

              {otherItems.map(item => (
                <CustomButton
                  key={item.name}
                  title={item.name}
                  tagline={item.desc}
                  onPress={item.func}
                />
              ))}
            </>
          )}

          <AccoutLogoutSection />

          <View
            style={{
              height: 400
            }}
          />
        </ScrollView>
      </View>
    </>
  );
};

export default Settings;
