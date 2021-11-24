import React, {useState} from 'react';
import {Platform, TouchableOpacity, View} from 'react-native';
import ToggleSwitch from 'toggle-switch-react-native';
import Paragraph from '../../components/Typography/Paragraph';
import {useTracked} from '../../provider';
import {useSettingStore, useUserStore} from '../../provider/stores';
import Backup from '../../services/Backup';
import {
  eSendEvent,
  presentSheet,
  ToastEvent
} from '../../services/EventManager';
import PremiumService from '../../services/PremiumService';
import SettingsService from '../../services/SettingsService';
import {
  eCloseProgressDialog,
  eOpenLoginDialog,
  eOpenRestoreDialog
} from '../../utils/Events';
import {openLinkInBrowser} from '../../utils/functions';
import {MMKV} from '../../utils/mmkv';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {CustomButton} from './button';
import {verifyUser} from './functions';
import SectionHeader from './section-header';

const SettingsBackupAndRestore = ({isSheet}) => {
  const [state] = useTracked();
  const {colors} = state;
  const settings = useSettingStore(state => state.settings);
  const user = useUserStore(state => state.user);

  const [collapsed, setCollapsed] = useState(isSheet ? false : true);

  const optItems = isSheet
    ? []
    : [
        {
          name: 'Restore backup',
          func: async () => {
            if (!user || !user?.email) {
              ToastEvent.show({
                heading: 'Login required',
                message: 'Please login to your account to restore backup',
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
              noProgress: true,
              action: async () => {
                try {
                  await openLinkInBrowser(
                    'https://importer.notesnook.com',
                    colors
                  );
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

  const backupItemsList = [
    {
      name: 'Backup now',
      func: async () => {
        if (isSheet) {
          eSendEvent(eCloseProgressDialog);
          await sleep(300);
        }
        if (!user) {
          await Backup.run();
          return;
        }
        verifyUser(null, Backup.run);
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
    await SettingsService.set('encryptedBackup', !settings.encryptedBackup);
  };

  const updateAskForBackup = async () => {
    await MMKV.setItem(
      'askForBackup',
      JSON.stringify({
        timestamp: Date.now() + 86400000 * 3
      })
    );
  };

  return (
    <>
      {!isSheet && (
        <SectionHeader
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          title="Backup & restore"
        />
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
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 50,
              paddingHorizontal: 12
            }}>
            <View
              style={{
                maxWidth: '60%'
              }}>
              <Paragraph
                size={SIZE.md}
                style={{
                  textAlignVertical: 'center',
                  maxWidth: '100%'
                }}>
                Automatic backups
              </Paragraph>
              <Paragraph color={colors.icon} size={SIZE.sm}>
                Backup your data automatically.
              </Paragraph>
            </View>

            <View
              style={{
                flexDirection: 'row',
                overflow: 'hidden',
                borderRadius: 5,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
              {[
                {
                  title: 'Never',
                  value: 'off'
                },
                {
                  title: 'Daily',
                  value: 'daily'
                },
                {
                  title: 'Weekly',
                  value: 'weekly'
                }
              ].map(item => (
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={async () => {
                    if (item.value === 'off') {
                      await SettingsService.set('reminder', item.value);
                    } else {
                      await PremiumService.verify(async () => {
                        if (Platform.OS === 'android') {
                          let granted = await Backup.checkBackupDirExists();
                          if (!granted) {
                            console.log('returning');
                            return;
                          }
                        }
                        await SettingsService.set('reminder', item.value);
                      });
                    }
                    updateAskForBackup();
                  }}
                  key={item.value}
                  style={{
                    backgroundColor:
                      settings.reminder === item.value
                        ? colors.accent
                        : colors.nav,
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 50,
                    height: 20
                  }}>
                  <Paragraph
                    color={
                      settings.reminder === item.value ? 'white' : colors.icon
                    }
                    size={SIZE.xs}>
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
