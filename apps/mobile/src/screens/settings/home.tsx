import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, Linking, Platform, View } from 'react-native';
import { enabled } from 'react-native-privacy-snapshot';
import { APP_VERSION } from '../../../version';
import { ChangePassword } from '../../components/auth/change-password';
import { ContainerHeader } from '../../components/container/containerheader';
import { Header } from '../../components/header';
import { Issue } from '../../components/sheets/github/issue';
import { Progress } from '../../components/sheets/progress';
import BackupService from '../../services/backup';
import { eSendEvent, openVault, presentSheet, ToastEvent } from '../../services/event-manager';
import Notifications from '../../services/notifications';
import PremiumService from '../../services/premium';
import SettingsService from '../../services/settings';
import { useSettingStore, useUserStore } from '../../stores/stores';
import { useThemeStore } from '../../stores/theme';
import { AndroidModule } from '../../utils';
import { toggleDarkMode } from '../../utils/color-scheme/utils';

import * as RNIap from 'react-native-iap';
import {
  eCloseProgressDialog,
  eOpenAttachmentsDialog,
  eOpenLoginDialog,
  eOpenRecoveryKeyDialog,
  eOpenRestoreDialog
} from '../../utils/events';
import { openLinkInBrowser } from '../../utils/functions';
import { useVaultStatus } from '../../utils/hooks/use-vault-status';
import { sleep } from '../../utils/time';
import AppLock from './app-lock';
import { verifyUser } from './functions';
import { SectionGroup } from './section-group';
import { RouteParams, SettingSection } from './types';
import SettingsUserSection from './user-section';
import Sync from '../../services/sync';
import { MFARecoveryCodes, MFASheet } from './2fa';
import { db } from '../../utils/database';
const format = (ver: number) => {
  let parts = ver.toString().split('');
  return `v${parts[0]}.${parts[1]}.${parts[2]?.startsWith('0') ? '' : parts[2]}${
    !parts[3] ? '' : parts[3]
  } `;
};

const groups: SettingSection[] = [
  {
    name: 'account',
    sections: [
      {
        type: 'screen',
        name: 'Account Settings',
        icon: 'account-cog',
        description: 'Manage account',
        sections: [
          {
            name: 'Save data recovery key',
            modifer: async () => {
              verifyUser(null, async () => {
                await sleep(300);
                eSendEvent(eOpenRecoveryKeyDialog);
              });
            },
            description: 'Recover your data using the recovery key if your password is lost.'
          },
          {
            name: 'Manage attachments',
            icon: 'attachment',
            modifer: () => {
              eSendEvent(eOpenAttachmentsDialog);
            },
            description: 'Manage all attachments in one place.'
          },
          {
            name: 'Change password',
            modifer: async () => {
              ChangePassword.present();
            },
            description: 'Setup a new password for your account.'
          },
          {
            type: 'screen',
            name: 'Two factor authentication',
            description: 'Manage 2FA settings',
            icon: 'two-factor-authentication',
            sections: [
              {
                name: 'Enable two-factor authentication',
                modifer: () => {
                  verifyUser('global', async () => {
                    MFASheet.present();
                  });
                },
                hidden: () => {
                  let user = useUserStore.getState().user;
                  return !!user?.mfa?.isEnabled;
                },
                description: 'Increased security for your account'
              },
              {
                name: 'Add fallback 2FA method',
                hidden: () => {
                  let user = useUserStore.getState().user;

                  return !!user?.mfa?.secondaryMethod || !user?.mfa?.isEnabled;
                },
                modifer: () => {
                  verifyUser('global', async () => {
                    MFASheet.present(true);
                  });
                },
                description:
                  'You can use fallback 2FA method incase you are unable to login via primary method'
              },
              {
                name: 'Reconfigure fallback 2FA method',
                hidden: () => {
                  let user = useUserStore.getState().user;
                  return !user?.mfa?.secondaryMethod || !user?.mfa?.isEnabled;
                },
                modifer: () => {
                  verifyUser('global', async () => {
                    MFASheet.present(true);
                  });
                },
                description:
                  'You can use fallback 2FA method incase you are unable to login via primary method'
              },
              {
                name: 'View recovery codes',
                modifer: () => {
                  verifyUser('global', async () => {
                    MFARecoveryCodes.present('sms');
                  });
                },
                hidden: () => {
                  let user = useUserStore.getState().user;
                  return !user?.mfa?.isEnabled;
                },
                description: 'View and save recovery codes for to recover your account'
              },
              {
                name: 'Disable two-factor authentication',
                modifer: () => {
                  verifyUser('global', async () => {
                    await db.mfa?.disable();
                    let user = await db.user?.fetchUser();
                    useUserStore.getState().setUser(user);
                  });
                },
                hidden: () => {
                  let user = useUserStore.getState().user;
                  return !user?.mfa?.isEnabled;
                },
                description: 'Decreased security for your account'
              }
            ]
          },
          {
            name: 'Subscription not activated?',
            hidden: () => Platform.OS !== 'ios',
            modifer: async () => {
              if (Platform.OS === 'android') return;
              presentSheet({
                title: 'Loading subscriptions',
                paragraph: `Please wait while we fetch your subscriptions.`
              });
              let subscriptions = await RNIap.getPurchaseHistory();
              subscriptions.sort((a, b) => b.transactionDate - a.transactionDate);
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
                  await PremiumService.subscriptions.verify(currentSubscription);
                  eSendEvent(eCloseProgressDialog);
                },
                icon: 'information-outline',
                actionText: 'Verify'
              });
            },
            description: 'Verify your subscription to Notesnook Pro'
          }
        ]
      },
      {
        name: 'Having problems with sync',
        description: 'Try force sync to resolve issues with syncing',
        icon: 'sync-alert',
        modifer: async () => {
          Progress.present();
          await Sync.run('global', true);
          eSendEvent(eCloseProgressDialog);
        }
      }
    ]
  },
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
            name: 'Use system theme',
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
              toggleDarkMode();
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
        description: 'Change app homepage',
        sections: [
          {
            type: 'component',
            name: 'Homepage',
            description: 'Default screen to open on app startup',
            component: 'homeselector'
          }
        ]
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
        name: 'Vault',
        description: 'Multi-layer encryption to most important notes',
        icon: 'key',
        sections: [
          {
            name: 'Create vault',
            description: 'Set a password to create vault and lock notes.',
            icon: 'key',
            useHook: useVaultStatus,
            hidden: current => current?.exists,
            modifer: () => {
              PremiumService.verify(() => {
                openVault({
                  item: {},
                  novault: false,
                  title: 'Create vault',
                  description: 'Set a password to create vault and lock notes.'
                });
              });
            }
          },
          {
            useHook: useVaultStatus,
            name: 'Change vault password',
            description: 'Setup a new password for your vault.',
            hidden: current => !current?.exists,
            modifer: () =>
              openVault({
                item: {},
                changePassword: true,
                novault: true,
                title: 'Change vault password',
                description: 'Set a new password for your vault.'
              })
          },
          {
            useHook: useVaultStatus,
            name: 'Clear vault',
            description: 'Unlock all locked notes',
            hidden: current => !current?.exists,
            modifer: () => {
              openVault({
                item: {},
                clearVault: true,
                novault: true,
                title: 'Clear vault',
                description: 'Enter vault password to unlock and remove all notes from the vault.'
              });
            }
          },
          {
            name: 'Delete vault',
            description: 'Delete vault (and optionally remove all notes).',
            useHook: useVaultStatus,
            hidden: current => !current?.exists,
            modifer: () => {
              openVault({
                item: {},
                deleteVault: true,
                novault: true,
                title: 'Delete vault',
                description: 'Enter your account password to delete your vault.'
              });
            }
          },
          {
            type: 'switch',
            name: 'Biometric unlocking',
            icon: 'fingerprint',
            useHook: useVaultStatus,
            description: 'Access notes in vault using biometrics',
            hidden: current => !current?.exists || !current?.isBiometryAvailable,
            getter: current => current?.biometryEnrolled,
            modifer: current => {
              openVault({
                item: {},
                fingerprintAccess: !current.biometryEnrolled,
                revokeFingerprintAccess: current.biometryEnrolled,
                novault: true,
                title: current.biometryEnrolled
                  ? 'Revoke biometric unlocking'
                  : 'Enable biometery unlock',
                description: current.biometryEnrolled
                  ? 'Disable biometric unlocking for notes in vault'
                  : 'Enable biometric unlocking for notes in vault'
              });
            }
          }
        ]
      },
      {
        type: 'switch',
        icon: 'eye-off-outline',
        name: 'Privacy mode',
        description: `Hide app contents when you switch to other apps. This will also disable screenshot taking in the app.`,
        modifer: () => {
          const settings = SettingsService.get();
          Platform.OS === 'android'
            ? AndroidModule.setSecureMode(!settings.privacyScreen)
            : enabled(true);

          SettingsService.set({ privacyScreen: !settings.privacyScreen });
        },
        property: 'privacyScreen'
      },
      {
        name: 'App lock',
        description: 'Change app lock mode to suit your needs',
        icon: 'fingerprint',
        modifer: () => {
          AppLock.present();
        }
      }
    ]
  },
  {
    name: 'Backup and restore',
    sections: [
      {
        type: 'screen',
        name: 'Backups',
        icon: 'backup-restore',
        description: 'Create a backup or change backup settings',
        sections: [
          {
            name: 'Backup now',
            description: 'Create a backup of your data',
            modifer: async () => {
              const user = useUserStore.getState().user;
              if (!user) {
                await BackupService.run(true);
                return;
              }
              verifyUser(null, () => BackupService.run(true));
            }
          },
          {
            type: 'component',
            name: 'Automatic backups',
            description: 'Backup your data once every week or daily automatically.',
            component: 'autobackups'
          },
          {
            name: 'Select backup directory',
            description: 'Select directory to store backups',
            icon: 'folder',
            hidden: () =>
              !!SettingsService.get().backupDirectoryAndroid || Platform.OS !== 'android',
            property: 'backupDirectoryAndroid',
            modifer: async () => {
              let dir;
              try {
                let dir = await BackupService.checkBackupDirExists(true);
              } catch (e) {
              } finally {
                if (!dir) {
                  ToastEvent.show({
                    heading: 'No directory selected',
                    type: 'error'
                  });
                }
              }
            }
          },
          {
            name: 'Change backup directory',
            description: () => SettingsService.get().backupDirectoryAndroid?.name || '',
            icon: 'folder',
            hidden: () =>
              !SettingsService.get().backupDirectoryAndroid || Platform.OS !== 'android',
            property: 'backupDirectoryAndroid',
            modifer: async () => {
              let dir;
              try {
                dir = await BackupService.checkBackupDirExists(true);
              } catch (e) {
              } finally {
                if (!dir) {
                  ToastEvent.show({
                    heading: 'No directory selected',
                    type: 'error'
                  });
                }
              }
            }
          },
          {
            type: 'switch',
            name: 'Backup encryption',
            description: 'Encrypt all your backups.',
            icon: 'lock',
            property: 'encryptedBackup',
            modifer: async () => {
              const user = useUserStore.getState().user;
              const settings = SettingsService.get();
              if (!user) {
                ToastEvent.show({
                  heading: 'Login required to enable encryption',
                  type: 'error',
                  func: () => {
                    eSendEvent(eOpenLoginDialog);
                  },
                  actionText: 'Login'
                });
                return;
              }
              await SettingsService.set({ encryptedBackup: !settings.encryptedBackup });
            }
          }
        ]
      },
      {
        name: 'Restore backup',
        description: `Restore backup from phone storage.`,
        modifer: () => {
          const user = useUserStore.getState().user;
          if (!user || !user?.email) {
            ToastEvent.show({
              heading: 'Login required',
              message: 'Please log in to your account to restore backup',
              type: 'error',
              context: 'global'
            });
            return;
          }
          eSendEvent(eOpenRestoreDialog);
        }
      }
    ]
  },
  {
    name: 'Productivity',
    hidden: () => Platform.OS !== 'android',
    sections: [
      {
        type: 'switch',
        name: 'Notes in notifications',
        description: `Add quick notes from notifications without opening the app.`,
        property: 'notifNotes',
        icon: 'form-textbox',
        modifer: () => {
          const settings = SettingsService.get();
          if (settings.notifNotes) {
            Notifications.unpinQuickNote();
          } else {
            Notifications.pinQuickNote(false);
          }
          SettingsService.toggle('notifNotes');
        }
      }
    ]
  },
  {
    name: 'Help and support',
    sections: [
      {
        name: 'Report an issue',
        icon: 'bug',
        modifer: () => {
          presentSheet({
            component: <Issue />
          });
        },
        description: 'Faced an issue or have a suggestion? Click here to create a bug report'
      },
      {
        name: 'Documentation',
        modifer: async () => {
          Linking.openURL('https://docs.notesnook.com');
        },
        description: 'Learn about every feature and how it works.'
      }
    ]
  },
  {
    name: 'community',
    sections: [
      {
        name: 'Join our Telegram group',
        description: "We are on telegram, let's talk",
        icon: 'telegram',
        modifer: () => {
          Linking.openURL('https://t.me/notesnook').catch(console.log);
        }
      },
      {
        name: 'Join our Discord community',
        icon: 'discord',
        modifer: async () => {
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
        description: 'We are not ghosts, chat with us and share your experience.'
      }
    ]
  },
  {
    name: 'legal',
    sections: [
      {
        name: 'Terms of service',
        modifer: async () => {
          try {
            await Linking.openURL('https://notesnook.com/tos');
          } catch (e) {}
        },
        description: 'Read our terms of service'
      },
      {
        name: 'Privacy policy',
        modifer: async () => {
          try {
            await Linking.openURL('https://notesnook.com/privacy');
          } catch (e) {}
        },
        description: 'Read our privacy policy'
      }
    ]
  },
  {
    name: 'about',
    sections: [
      {
        name: 'Download on desktop',
        icon: 'monitor',
        modifer: async () => {
          try {
            await Linking.openURL('https://notesnook.com');
          } catch (e) {}
        },
        description: 'Notesnook app can be downloaded on all platforms'
      },
      {
        name: 'Roadmap',
        icon: 'chart-timeline',
        modifer: async () => {
          try {
            await Linking.openURL('https://docs.notesnook.com/roadmap/');
          } catch (e) {}
        },
        description: 'See what the future of Notesnook is going to be like.'
      },
      {
        name: 'About Notesnook',
        modifer: async () => {
          try {
            await Linking.openURL('https://notesnook.com');
          } catch (e) {}
        },
        description: format(APP_VERSION)
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

  const renderItem = ({ item, index }: { item: SettingSection; index: number }) =>
    item.name === 'account' ? <SettingsUserSection item={item} /> : <SectionGroup item={item} />;

  return (
    <View>
      <ContainerHeader>
        <Header title="Settings" isBack={false} screen="Settings" />
      </ContainerHeader>

      <FlatList
        data={groups}
        keyExtractor={(item, index) => item.name || index.toString()}
        ListFooterComponent={<View style={{ height: 200 }} />}
        renderItem={renderItem}
      />
    </View>
  );
};

export default Home;
