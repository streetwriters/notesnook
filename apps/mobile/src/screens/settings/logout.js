import React, { useState } from 'react';
import { View } from 'react-native';
import AnimatedProgress from 'react-native-reanimated-progress-bar';
import BaseDialog from '../../components/dialog/base-dialog';
import { presentDialog } from '../../components/dialog/functions';
import { PressableButton } from '../../components/ui/pressable';
import Heading from '../../components/ui/typography/heading';
import Paragraph from '../../components/ui/typography/paragraph';
import { useThemeStore } from '../../stores/theme';
import { useUserStore } from '../../stores/stores';
import BiometricService from '../../services/biometrics';
import { ToastEvent } from '../../services/event-manager';
import { db } from '../../utils/database';
import { SIZE } from '../../utils/size';
import Storage from '../../utils/database/storage';
import { sleep } from '../../utils/time';

const AccoutLogoutSection = () => {
  const colors = useThemeStore(state => state.colors);
  const user = useUserStore(state => state.user);
  const [loading, setLoading] = useState(false);

  return !user ? null : (
    <>
      {loading && (
        <BaseDialog visible={true}>
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

      {[
        {
          name: 'Logout',
          func: async () => {
            presentDialog({
              title: 'Logout',
              paragraph: 'Clear all your data and reset the app.',
              positiveText: 'Logout',
              positivePress: async () => {
                try {
                  setLoading(true);
                  await sleep(10);
                  await db.user.logout();
                  await BiometricService.resetCredentials();
                  await Storage.write('introCompleted', 'true');
                  setLoading(false);
                } catch (e) {
                  setLoading(false);
                }
              }
            });
          }
        }
      ].map((item, index) => (
        <PressableButton
          onPress={item.func}
          key={item.name}
          type="gray"
          customStyle={{
            height: 50,
            borderTopWidth: index === 0 ? 1 : 0,
            borderTopColor: colors.nav,
            width: '100%',
            alignItems: 'flex-start',
            paddingHorizontal: 12,
            marginTop: index === 0 ? 25 : 0,
            borderRadius: 0
          }}
        >
          <Heading
            color={item.name === 'Logout' ? colors.pri : colors.red}
            style={{
              fontSize: SIZE.md
            }}
          >
            {item.name}
          </Heading>
        </PressableButton>
      ))}

      <PressableButton
        onPress={() => {
          presentDialog({
            title: 'Delete account',
            paragraphColor: colors.red,
            paragraph:
              'All your data will be removed permanantly. Make sure you have saved backup of your notes. This action is IRREVERSIBLE.',
            positiveType: 'errorShade',
            input: true,
            inputPlaceholder: 'Enter account password',
            positiveText: 'Delete',
            positivePress: async value => {
              try {
                let verified = await db.user.verifyPassword(value);
                if (verified) {
                  setLoading(true);
                  await db.user.deleteUser(value);
                  await BiometricService.resetCredentials();
                  await Storage.write('introCompleted', 'true');
                  setLoading(false);
                } else {
                  setLoading(false);
                  ToastEvent.show({
                    heading: 'Incorrect password',
                    message: 'The account password you entered is incorrect',
                    type: 'error',
                    context: 'global'
                  });
                }
              } catch (e) {
                console.log(e);
                setLoading(false);
                ToastEvent.show({
                  heading: 'Failed to delete account',
                  message: e.message,
                  type: 'error',
                  context: 'global'
                });
              }
            }
          });
        }}
        type="error"
        customStyle={{
          borderWidth: 1,
          borderRadius: 5,
          paddingVertical: 10,
          width: '95%',
          alignItems: 'flex-start',
          paddingHorizontal: 12,
          marginTop: 25,
          borderColor: colors.red
        }}
      >
        <Heading
          color={colors.red}
          style={{
            fontSize: SIZE.md
          }}
        >
          Delete account
        </Heading>
        <Paragraph
          style={{
            flexWrap: 'wrap',
            flexBasis: 1
          }}
          color={colors.red}
        >
          Your account will be deleted and all your data will be removed permanantly. Make sure you
          have saved backup of your notes. This action is IRREVERSIBLE.
        </Paragraph>
      </PressableButton>
    </>
  );
};

export default AccoutLogoutSection;
