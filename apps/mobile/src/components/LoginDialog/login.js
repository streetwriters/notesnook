import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { eCloseLoginDialog } from '../../utils/Events';
import { useTracked } from '../../provider';
import { useUserStore } from '../../provider/stores';
import { DDS } from '../../services/DeviceDetection';
import { eSendEvent, presentSheet, ToastEvent } from '../../services/EventManager';
import { clearMessage } from '../../services/Message';
import PremiumService from '../../services/PremiumService';
import { db } from '../../utils/database';
import { MMKV } from '../../utils/mmkv';
import { SIZE } from '../../utils/SizeUtils';
import { sleep } from '../../utils/TimeUtils';
import { ActionIcon } from '../ActionIcon';
import { Button } from '../Button';
import BaseDialog from '../Dialog/base-dialog';
import Input from '../Input';
import { SvgToPngView } from '../ListPlaceholders';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import { SVG } from './background';
import { ForgotPassword } from './forgot-password';
import { SheetManager } from 'react-native-actions-sheet';

export const Login = ({ changeMode }) => {
  const [state] = useTracked();
  const colors = state.colors;
  const email = useRef();
  const emailInputRef = useRef();
  const passwordInputRef = useRef();
  const password = useRef();

  const [focused, setFocused] = useState(false);

  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const setUser = useUserStore(state => state.setUser);

  const validateInfo = () => {
    if (!password.current || !email.current) {
      ToastEvent.show({
        heading: 'All fields required',
        message: 'Fill all the fields and try again',
        type: 'error',
        context: 'local'
      });

      return false;
    }

    return true;
  };

  useEffect(() => {
    async () => {
      await sleep(500);
      emailInputRef.current?.focus();
      setFocused(true);
    };
  }, []);

  const login = async () => {
    if (!validateInfo() || error) return;
    setLoading(true);
    let user;
    try {
      await db.user.login(email.toLowerCase(), password);
      user = await db.user.getUser();
      if (!user) throw new Error('Email or password incorrect!');
      PremiumService.setPremiumStatus();
      setUser(user);
      clearMessage();
      ToastEvent.show({
        heading: 'Login successful',
        message: `Logged in as ${user.email}`,
        type: 'success',
        context: 'global'
      });
      eSendEvent(eCloseLoginDialog);
      await MMKV.removeItem('loginSessionHasExpired');
      eSendEvent('userLoggedIn', true);
      await sleep(500);
      presentSheet({
        title: 'Syncing your data',
        paragraph: 'Please wait while we sync all your data.',
        progress: true
      });
    } catch (e) {
      setLoading(false);
      ToastEvent.show({
        heading: user ? 'Failed to sync' : 'Login failed',
        message: e.message,
        type: 'error',
        context: 'local'
      });
    }
  };

  return (
    <>
      <ActionIcon
        name="arrow-left"
        onPress={() => {
          eSendEvent(eCloseLoginDialog);
        }}
        color={colors.pri}
        customStyle={{
          position: 'absolute',
          zIndex: 999,
          left: 12,
          top: 12
        }}
      />

      <ForgotPassword />

      {loading ? <BaseDialog transparent={true} visible={true} animation="fade" /> : null}
      <View
        style={{
          borderRadius: DDS.isTab ? 5 : 0,
          backgroundColor: colors.bg,
          zIndex: 10,
          width: '100%',
          minHeight: '100%'
        }}
      >
        <View
          style={{
            height: 250,
            overflow: 'hidden'
          }}
        >
          <SvgToPngView src={SVG(colors.night ? 'white' : 'black')} height={700} />
        </View>

        <View
          style={{
            width: '100%',
            justifyContent: 'center',
            alignSelf: 'center',
            paddingHorizontal: 12,
            marginBottom: 30,
            marginTop: 15
          }}
        >
          <Heading
            style={{
              textAlign: 'center'
            }}
            size={30}
            color={colors.heading}
          >
            Welcome back!
          </Heading>
          <Paragraph
            style={{
              textDecorationLine: 'underline',
              textAlign: 'center',
              marginTop: 5
            }}
            onPress={() => {
              changeMode(1);
            }}
            size={SIZE.md}
          >
            Don't have an account? Sign up
          </Paragraph>
        </View>
        <View
          style={{
            width: focused ? '100%' : '99.9%',
            padding: 12,
            backgroundColor: colors.bg,
            flexGrow: 1
          }}
        >
          <Input
            fwdRef={emailInputRef}
            onChangeText={value => {
              email.current = value;
            }}
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

          <Input
            fwdRef={passwordInputRef}
            onChangeText={value => {
              password.current = value;
            }}
            onErrorCheck={e => setError(e)}
            returnKeyLabel="Done"
            returnKeyType="done"
            secureTextEntry
            autoCompleteType="password"
            autoCapitalize="none"
            validationType="password"
            autoCorrect={false}
            placeholder="Password"
            marginBottom={0}
          />
          <Button
            title="Forgot your password?"
            style={{
              alignSelf: 'flex-end',
              height: 30,
              paddingHorizontal: 0
            }}
            onPress={() => {
              SheetManager.show('forgotpassword_sheet', email.current);
            }}
            textStyle={{
              textDecorationLine: 'underline'
            }}
            fontSize={SIZE.xs}
            type="gray"
          />

          <View
            style={{
              // position: 'absolute',
              marginTop: 50,
              alignSelf: 'center'
            }}
          >
            <Button
              style={{
                marginTop: 10,
                width: 250,
                borderRadius: 100
              }}
              loading={loading}
              onPress={login}
              //  width="100%"
              type="accent"
              title={loading ? null : 'Login to your account'}
            />
          </View>
        </View>
      </View>
    </>
  );
};
