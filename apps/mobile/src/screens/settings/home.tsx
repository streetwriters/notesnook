import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, Linking, View } from 'react-native';
import { APP_VERSION } from '../../../version';
import { ContainerHeader } from '../../components/container/containerheader';
import { Header } from '../../components/header';
import { Issue } from '../../components/sheets/github/issue';
import { presentSheet } from '../../services/event-manager';
import { useSettingStore } from '../../stores/stores';
import { useThemeStore } from '../../stores/theme';
import { openLinkInBrowser } from '../../utils/functions';
import { SectionGroup } from './section-group';
import { RouteParams, SettingSection } from './types';
const format = (ver: number) => {
  let parts = ver.toString().split('');
  return `v${parts[0]}.${parts[1]}.${parts[2]?.startsWith('0') ? '' : parts[2]}${
    !parts[3] ? '' : parts[3]
  } `;
};

const groups: SettingSection[] = [
  {
    name: 'Customize',
    sections: [
      {
        type: 'screen',
        name: 'Theme',
        description: 'Change app look and feel',
        icon: 'shape',
        sections: [
          {
            type: 'component',
            name: 'Accent color',
            description: 'Pick the color that matches your mood',
            component: 'colorpicker'
          },
          {
            type: 'switch',
            name: 'Follow system theme',
            description: 'Automatically switch to dark mode when system theme changes',
            property: 'useSystemTheme',
            icon: 'circle-half'
          },
          {
            type: 'switch',
            name: 'Dark mode',
            description: 'Strain your eyes no more at night',
            property: 'theme',
            icon: 'brightness-6',
            modifer: () => {
              let current = { ...useSettingStore.getState().settings.theme };
              current.dark = !current.dark;
              return {
                theme: current
              };
            },
            getter: () => useSettingStore.getState().settings.theme.dark
          },
          {
            type: 'switch',
            name: 'Pitch black',
            description: 'Save battery on device with amoled screen at night.',
            property: 'pitchBlack',
            icon: 'brightness-1'
          }
        ]
      },
      {
        type: 'screen',
        name: 'Behaviour',
        description: 'Change app homepage'
      }
    ]
  },
  {
    name: 'Privacy and security',
    sections: [
      {
        type: 'switch',
        name: 'Telemetry',
        icon: 'radar',
        description:
          'Contribute towards a better Notesnook. All tracking information is anonymous.',
        property: 'telemetry'
      },
      {
        type: 'screen',
        name: 'Vault'
      },
      {
        type: 'screen',
        name: 'App lock'
      }
    ]
  }
];

const Home = ({ navigation }: NativeStackScreenProps<RouteParams, 'SettingsHome'>) => {
  const colors = useThemeStore(state => state.colors);

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

  const renderItem = ({ item, index }: { item: SettingSection; index: number }) => (
    <SectionGroup item={item} />
  );

  return (
    <View>
      <ContainerHeader>
        <Header title="Settings" isBack={true} screen="Settings" />
      </ContainerHeader>

      <FlatList
        data={groups}
        keyExtractor={(item, index) => item.name || index.toString()}
        renderItem={renderItem}
      />
    </View>
  );
};

export default Home;
