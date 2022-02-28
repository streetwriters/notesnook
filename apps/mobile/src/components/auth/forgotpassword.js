import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import { useThemeStore } from '../../stores/theme';
import { DDS } from '../../services/device-detection';
import { ToastEvent } from '../../services/event-manager';
import { db } from '../../utils/database';
import { MMKV } from '../../utils/database/mmkv';
import { IconButton } from '../ui/icon-button';
import { Button } from '../ui/button';
import DialogHeader from '../dialog/dialog-header';
import Input from '../ui/input';
import Seperator from '../ui/seperator';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';

export const ForgotPassword = () => {
  const colors = useThemeStore(state => state.colors);
  const email = useRef();
  const emailInputRef = useRef();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const sendRecoveryEmail = async () => {
    if (!email.current || error) {
      ToastEvent.show({
        heading: 'Account email is required.',
        type: 'error',
        context: 'local'
      });
      return;
    }
    setLoading(true);
    try {
      let lastRecoveryEmailTime = await MMKV.getItem('lastRecoveryEmailTime');
      if (lastRecoveryEmailTime && Date.now() - JSON.parse(lastRecoveryEmailTime) < 60000 * 3) {
        throw new Error('Please wait before requesting another email');
      }
      await db.user.recoverAccount(email.current.toLowerCase());
      await MMKV.setItem('lastRecoveryEmailTime', JSON.stringify(Date.now()));
      ToastEvent.show({
        heading: `Check your email to reset password`,
        message: `Recovery email has been sent to ${email.current.toLowerCase()}`,
        type: 'success',
        context: 'local',
        duration: 7000
      });
      setLoading(false);
      setSent(true);
    } catch (e) {
      setLoading(false);
      ToastEvent.show({
        heading: 'Recovery email not sent',
        message: e.message,
        type: 'error',
        context: 'local'
      });
    }
  };

  return (
    <>
      <ActionSheet
        onBeforeShow={data => (email.current = data)}
        onClose={() => {
          setSent(false);
          setLoading(false);
        }}
        keyboardShouldPersistTaps="always"
        onOpen={() => {
          emailInputRef.current?.setNativeProps({
            text: email.current
          });
        }}
        gestureEnabled
        id="forgotpassword_sheet"
      >
        {sent ? (
          <View
            style={{
              padding: 12,
              justifyContent: 'center',
              alignItems: 'center',
              paddingBottom: 50
            }}
          >
            <IconButton
              customStyle={{
                width: null,
                height: null
              }}
              color={colors.accent}
              name="email"
              size={50}
            />
            <Heading>Recovery email sent!</Heading>
            <Paragraph
              style={{
                textAlign: 'center'
              }}
            >
              Please follow the link in the email to recover your account.
            </Paragraph>
          </View>
        ) : (
          <View
            style={{
              borderRadius: DDS.isTab ? 5 : 0,
              backgroundColor: colors.bg,
              zIndex: 10,
              width: '100%',
              padding: 12
            }}
          >
            <DialogHeader
              title="Account recovery"
              paragraph="We will send you an email with steps on how to reset your password."
            />
            <Seperator />

            <Input
              fwdRef={emailInputRef}
              onChangeText={value => {
                email.current = value;
              }}
              defaultValue={email.current}
              onErrorCheck={e => setError(e)}
              returnKeyLabel="Next"
              returnKeyType="next"
              autoComplete="email"
              validationType="email"
              autoCorrect={false}
              autoCapitalize="none"
              errorMessage="Email is invalid"
              placeholder="Email"
              onSubmit={() => {}}
            />

            <Button
              style={{
                marginTop: 10,
                width: '100%'
              }}
              loading={loading}
              onPress={sendRecoveryEmail}
              type="accent"
              title={loading ? null : 'Next'}
            />
          </View>
        )}
      </ActionSheet>
    </>
  );
};
