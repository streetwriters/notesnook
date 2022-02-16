import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { useTracked } from '../../provider';
import { eSendEvent, presentSheet, ToastEvent } from '../../services/EventManager';
import { db } from '../../utils/database';
import { eCloseProgressDialog } from '../../utils/Events';
import { Button } from '../Button';
import DialogHeader from '../Dialog/dialog-header';
import Input from '../Input';
import { Notice } from '../Notice';
import Seperator from '../Seperator';

export const ChangePassword = () => {
  const [state] = useTracked();
  const colors = state.colors;
  const passwordInputRef = useRef();
  const password = useRef();
  const oldPasswordInputRef = useRef();
  const oldPassword = useRef();

  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const changePassword = async () => {
    if (error || !oldPassword || !password) {
      ToastEvent.show({
        heading: 'All fields required',
        message: 'Fill all the fields and try again.',
        type: 'error',
        context: 'local'
      });
      return;
    }
    eSendEvent(eCloseProgressDialog);
    setLoading(true);
    try {
      await db.user.changePassword(oldPassword, password);
      ToastEvent.show({
        heading: `Account password updated`,
        type: 'success',
        context: 'local'
      });
    } catch (e) {
      ToastEvent.show({
        heading: 'Failed to change password',
        message: e.message,
        type: 'error',
        context: 'local'
      });
    }
    setLoading(false);
  };

  return (
    <View
      style={{
        width: '100%',
        padding: 12
      }}
    >
      <DialogHeader title="Change password" paragraph="Enter your old and new passwords" />
      <Seperator />

      <Input
        fwdRef={oldPasswordInputRef}
        onChangeText={value => {
          oldPassword.current = value;
        }}
        returnKeyLabel="Next"
        returnKeyType="next"
        secureTextEntry
        autoCompleteType="password"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Old Password"
      />

      <Input
        fwdRef={passwordInputRef}
        onChangeText={value => {
          password.current = value;
        }}
        onErrorCheck={e => setError(e)}
        returnKeyLabel="Next"
        returnKeyType="next"
        secureTextEntry
        validationType="password"
        autoCompleteType="password"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="New password"
      />

      <Notice
        text="Changing password is a non-undoable process. Please make sure you do not close the app while your password is changing and have good internet connection"
        type="alert"
      />

      <Button
        style={{
          marginTop: 10,
          width: '100%'
        }}
        loading={loading}
        onPress={changePassword}
        type="accent"
        title={loading ? null : 'I understand, change my password'}
      />
    </View>
  );
};

ChangePassword.present = () => {
  presentSheet({
    component: <ChangePassword />
  });
};
