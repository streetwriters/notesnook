import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import { useTracked } from '../../provider';
import { DDS } from '../../services/DeviceDetection';
import { ToastEvent } from '../../services/EventManager';
import { db } from '../../utils/database';
import { MMKV } from '../../utils/mmkv';
import { ActionIcon } from '../ActionIcon';
import { Button } from '../Button';
import DialogHeader from '../Dialog/dialog-header';
import Input from '../Input';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const ForgotPassword = () => {
  const [state] = useTracked();
  const colors = state.colors;
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
            <ActionIcon
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
              autoCompleteType="email"
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
