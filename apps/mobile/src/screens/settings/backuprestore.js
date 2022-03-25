import React, { useEffect, useState } from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import ToggleSwitch from 'toggle-switch-react-native';
import Seperator from '../../components/ui/seperator';
import Paragraph from '../../components/ui/typography/paragraph';
import { useThemeStore } from '../../stores/theme';
import { useSettingStore, useUserStore } from '../../stores/stores';
import Backup from '../../services/backup';
import { eSendEvent, presentSheet, ToastEvent } from '../../services/event-manager';
import PremiumService from '../../services/premium';
import SettingsService from '../../services/settings';
import { eCloseProgressDialog, eOpenLoginDialog, eOpenRestoreDialog } from '../../utils/events';
import { openLinkInBrowser } from '../../utils/functions';
import { MMKV } from '../../utils/database/mmkv';
import { SIZE } from '../../utils/size';
import { sleep } from '../../utils/time';
import { CustomButton } from './button';
import { verifyUser } from './functions';
import SectionHeader from './section-header';

const SettingsBackupAndRestore = ({ isSheet }) => {
  const colors = useThemeStore(state => state.colors);
  const settings = useSettingStore(state => state.settings);
  const user = useUserStore(state => state.user);
  const [collapsed, setCollapsed] = useState(isSheet ? false : true);
  const backupDirectoryAndroid = settings.backupDirectoryAndroid;

  const optItems = isSheet
    ? []
    : [
        {
          name: 'Restore backup',
          func: async () => {
            if (!user || !user?.email) {
              ToastEvent.show({
                heading: 'Login required',
                message: 'Please log in to your account to restore backup',
                type: 'error',
                context: 'global'
              });
              return;
            }
            if (isSheet) {
              eSendEvent(eCloseProgressDialog);
              await sleep(300);
            }
            eSendEvent(eOpenRestoreDialog);
          },
          desc: 'Restore backup from phone storage.'
        },
        {
          name: 'Import notes from other note apps',
          desc: 'Get all your notes in one place with Notesnook Importer.',
          func: async () => {
            if (isSheet) {
              eSendEvent(eCloseProgressDialog);
              await sleep(300);
            }
            presentSheet({
              title: 'Notesnook Importer',
              icon: 'import',
              action: async () => {
                try {
                  await openLinkInBrowser('https://importer.notesnook.com', colors);
                } catch (e) {}
              },
              actionText: 'Go to Notesnook Importer',
              learnMore: 'Learn how this works',
              learnMorePress: async () => {
                try {
                  await openLinkInBrowser(
                    'https://docs.notesnook.com/importing/notesnook-importer/',
                    colors
                  );
                } catch (e) {}
              },
              paragraph:
                'Now you can import your notes from all the popular note taking apps. Go to https://importer.notesnook.com to import your notes.'
            });
          },
          new: true
        }
      ];

  if (Platform.OS === 'android' && !isSheet) {
    optItems.push({
      name: backupDirectoryAndroid ? 'Change backups directory' : 'Select backups directory',
      func: async () => {
        let dir;
        try {
          let dir = await Backup.checkBackupDirExists(true);
        } catch (e) {
        } finally {
          if (!dir) {
            ToastEvent.show({
              heading: 'No directory selected',
              type: 'error'
            });
          }
        }
      },
      desc: backupDirectoryAndroid ? backupDirectoryAndroid.name : 'No backup directory selected'
    });
  }

  const backupItemsList = [
    {
      name: 'Backup now',
      func: async () => {
        if (isSheet) {
          eSendEvent(eCloseProgressDialog);
          await sleep(300);
        }
        if (!user) {
          await Backup.run(true);
          return;
        }
        verifyUser(null, () => Backup.run(true));
      },
      desc: 'Backup your data to phone storage'
    },
    ...optItems
  ];

  const toggleEncryptedBackups = async () => {
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
  };

  const updateAskForBackup = async () => {
    SettingsService.set({
      nextBackupRequestTime: Date.now() + 86400000 * 3
    });
  };

  return (
    <>
      {!isSheet && (
        <SectionHeader collapsed={collapsed} setCollapsed={setCollapsed} title="Backup & restore" />
      )}

      {!collapsed && (
        <>
          {backupItemsList.map(item => (
            <CustomButton
              key={item.name}
              title={item.name}
              tagline={item.desc}
              onPress={item.func}
            />
          ))}

          <View
            style={{
              width: '100%',
              marginHorizontal: 0,
              paddingHorizontal: 12,
              flexShrink: 1,
              paddingVertical: 10
            }}
          >
            <Paragraph
              size={SIZE.md}
              style={{
                textAlignVertical: 'center',
                maxWidth: '100%'
              }}
            >
              Automatic backups
            </Paragraph>
            <Paragraph color={colors.icon} size={SIZE.sm}>
              Backup your data once every week or daily automatically.
            </Paragraph>
            <Seperator half />
            <View
              style={{
                flexDirection: 'row',
                borderRadius: 5,
                overflow: 'hidden',
                flexShrink: 1,
                width: '100%'
              }}
            >
              {[
                {
                  title: 'Never',
                  value: 'useroff'
                },
                {
                  title: 'Daily',
                  value: 'daily'
                },
                {
                  title: 'Weekly',
                  value: 'weekly'
                },
                {
                  title: 'Monthly',
                  value: 'monthly'
                }
              ].map((item, index) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={async () => {
                    if (item.value === 'useroff') {
                      await SettingsService.set({ reminder: item.value });
                    } else {
                      await PremiumService.verify(async () => {
                        if (Platform.OS === 'android') {
                          let granted = await Backup.checkBackupDirExists();
                          if (!granted) {
                            console.log('returning');
                            return;
                          }
                        }
                        await SettingsService.set({ reminder: item.value });
                      });
                    }
                    updateAskForBackup();
                  }}
                  key={item.value}
                  style={{
                    backgroundColor: settings.reminder === item.value ? colors.accent : colors.nav,
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '25%',
                    height: 35,
                    borderRightWidth: index !== 3 ? 1 : 0,
                    borderRightColor: colors.border
                  }}
                >
                  <Paragraph
                    color={settings.reminder === item.value ? 'white' : colors.icon}
                    size={SIZE.sm - 1}
                  >
                    {item.title}
                  </Paragraph>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {!isSheet && (
            <CustomButton
              title="Backup encryption"
              tagline="Encrypt all your backups."
              onPress={toggleEncryptedBackups}
              customComponent={
                <ToggleSwitch
                  isOn={settings.encryptedBackup}
                  onColor={colors.accent}
                  offColor={colors.icon}
                  size="small"
                  animationSpeed={150}
                  onToggle={toggleEncryptedBackups}
                />
              }
            />
          )}
        </>
      )}
    </>
  );
};

export default SettingsBackupAndRestore;
