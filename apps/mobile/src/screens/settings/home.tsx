import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { FlatList, Linking, Platform, View } from 'react-native';
import { enabled } from 'react-native-privacy-snapshot';
import { APP_VERSION } from '../../../version';
import { ChangePassword } from '../../components/auth/change-password';
import { ContainerHeader } from '../../components/container/containerheader';
import { Header } from '../../components/header';
import { Issue } from '../../components/sheets/github/issue';
import { Progress } from '../../components/sheets/progress';
import BackupService from '../../services/backup';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  openVault,
  presentSheet,
  ToastEvent
} from '../../services/event-manager';
import Notifications from '../../services/notifications';
import PremiumService from '../../services/premium';
import SettingsService from '../../services/settings';
import { useSettingStore, useUserStore } from '../../stores/stores';
import { useThemeStore } from '../../stores/theme';
import { AndroidModule } from '../../utils';
import { toggleDarkMode } from '../../utils/color-scheme/utils';

import AnimatedProgress from 'react-native-reanimated-progress-bar';
import * as RNIap from 'react-native-iap';
import {
  eCloseProgressDialog,
  eCloseSimpleDialog,
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
import SettingsUserSection, { getTimeLeft } from './user-section';
import Sync from '../../services/sync';
import { MFARecoveryCodes, MFASheet } from './2fa';
import { db } from '../../utils/database';
import { SUBSCRIPTION_STATUS } from '../../utils/constants';
import dayjs from 'dayjs';
import BiometicService from '../../services/biometrics';
import { presentDialog } from '../../components/dialog/functions';
import { checkVersion } from 'react-native-check-version';
import { Update } from '../../components/sheets/update';
import BaseDialog from '../../components/dialog/base-dialog';
import Heading from '../../components/ui/typography/heading';
import Paragraph from '../../components/ui/typography/paragraph';
import { SIZE } from '../../utils/size';
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
        useHook: () => useUserStore(state => state.user),
        name: current => {
          const user = current;
          const isBasic = user.subscription?.type === SUBSCRIPTION_STATUS.BASIC;
          const isTrial = user.subscription?.type === SUBSCRIPTION_STATUS.TRIAL;
          return isBasic
            ? 'Subscribe to Pro'
            : isTrial
            ? 'Your free trial has started'
            : 'Subscription details';
        },
        type: 'component',
        component: 'subscription',
        icon: 'crown',
        description: current => {
          const user = current;
          const subscriptionDaysLeft = user && getTimeLeft(parseInt(user.subscription?.expiry));
          const expiryDate = dayjs(user?.subscription?.expiry).format('MMMM D, YYYY');
          const startDate = dayjs(user?.subscription?.start).format('MMMM D, YYYY');

          return user.subscription?.type === 2
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
            : 'Never hesitate to choose privacy';
        }
      },
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
          },
          {
            name: 'Log out',
            description: 'Clear all your data and reset the app.',
            icon: 'logout',
            modifer: () => {
              presentDialog({
                title: 'Logout',
                paragraph: 'Clear all your data and reset the app.',
                positiveText: 'Logout',
                positivePress: async () => {
                  try {
                    eSendEvent(eCloseSimpleDialog);
                    await sleep(100);
                    eSendEvent('settings-loading', true);
                    await db.user?.logout();
                    await BiometicService.resetCredentials();
                    await SettingsService.set({
                      introCompleted: true
                    });
                    eSendEvent('settings-loading', false);
                  } catch (e) {
                    eSendEvent('settings-loading', false);
                  }
                }
              });
            }
          },
          {
            type: 'danger',
            name: 'Delete account',
            icon: 'alert',
            description: `All your data will be removed permanantly. Make sure you have saved backup of your notes. This action is IRREVERSIBLE.`,
            modifer: () => {
              presentDialog({
                title: 'Delete account',
                paragraphColor: 'red',
                paragraph:
                  'All your data will be removed permanantly. Make sure you have saved backup of your notes. This action is IRREVERSIBLE.',
                positiveType: 'errorShade',
                input: true,
                inputPlaceholder: 'Enter account password',
                positiveText: 'Delete',
                positivePress: async value => {
                  try {
                    let verified = await db.user?.verifyPassword(value);
                    if (verified) {
                      eSendEvent('settings-loading', true);
                      await db.user?.deleteUser(value);
                      await BiometicService.resetCredentials();
                      SettingsService.set({
                        introCompleted: true
                      });
                    } else {
                      ToastEvent.show({
                        heading: 'Incorrect password',
                        message: 'The account password you entered is incorrect',
                        type: 'error',
                        context: 'global'
                      });
                    }

                    eSendEvent('settings-loading', false);
                  } catch (e) {
                    eSendEvent('settings-loading', false);
                    console.log(e);
                    ToastEvent.show({
                      heading: 'Failed to delete account',
                      message: e?.message,
                      type: 'error',
                      context: 'global'
                    });
                  }
                }
              });
            }
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
        description: 'Learn about every feature and how it works.',
        icon: 'file-document'
      },
      {
        type: 'switch',
        name: 'Debug mode',
        description: 'Show debug options on items',
        property: 'devMode'
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
        description: 'Get Notesnook app on your desktop and access all notes'
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
        name: 'Check for updates',
        icon: 'cellphone-arrow-down',
        description: 'Check for new version of Notesnook',
        modifer: async () => {
          const version = await checkVersion();
          if (!version.needsUpdate) return false;
          presentSheet({
            component: ref => <Update version={version} fwdRef={ref} />
          });
        }
      },
      {
        name: 'App version',
        icon: 'alpha-v',
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
  const [loading, setLoading] = useState(false);

  const renderItem = ({ item, index }: { item: SettingSection; index: number }) =>
    item.name === 'account' ? <SettingsUserSection item={item} /> : <SectionGroup item={item} />;

  useEffect(() => {
    eSubscribeEvent('settings-loading', setLoading);

    return () => {
      eUnSubscribeEvent('settings-loading', setLoading);
    };
  }, []);

  return (
    <View>
      <ContainerHeader>
        <Header title="Settings" isBack={false} screen="Settings" />
      </ContainerHeader>

      {loading && (
        <BaseDialog bounce={false} visible={true}>
          <View
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: colors.bg,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Heading color={colors.pri} size={SIZE.lg}>
              Logging out
            </Heading>
            <Paragraph color={colors.icon}>
              Please wait while we log out and clear app data.
            </Paragraph>
            <View
              style={{
                flexDirection: 'row',
                height: 10,
                width: 100,
                marginTop: 15
              }}
            >
              <AnimatedProgress fill={colors.accent} total={8} current={8} />
            </View>
          </View>
        </BaseDialog>
      )}

      <FlatList
        data={groups}
        keyExtractor={(item, index) =>
          typeof item.name === 'function'
            ? item.name({}) || index.toString()
            : item.name || index.toString()
        }
        ListFooterComponent={<View style={{ height: 200 }} />}
        renderItem={renderItem}
      />
    </View>
  );
};

export default Home;
