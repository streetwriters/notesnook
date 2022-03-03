import React, { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { SheetManager } from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../stores/theme';
import { useUserStore } from '../../stores/stores';
import { DDS } from '../../services/device-detection';
import { eSendEvent, presentSheet, ToastEvent } from '../../services/event-manager';
import { clearMessage } from '../../services/message';
import PremiumService from '../../services/premium';
import { db } from '../../utils/database';
import { eCloseLoginDialog } from '../../utils/events';
import { MMKV } from '../../utils/database/mmkv';
import { SIZE } from '../../utils/size';
import { sleep } from '../../utils/time';
import { IconButton } from '../ui/icon-button';
import { Button } from '../ui/button';
import BaseDialog from '../dialog/base-dialog';
import Input from '../ui/input';
import { SvgView } from '../ui/svg';
import { BouncingView } from '../ui/transitions/bouncing-view';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';
import { SVG } from './background';
import { ForgotPassword } from './forgot-password';
import SettingsService from '../../services/settings';

export const Login = ({ changeMode }) => {
  const colors = useThemeStore(state => state.colors);
  const email = useRef();
  const emailInputRef = useRef();
  const passwordInputRef = useRef();
  const password = useRef();
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

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
      await db.user.login(email.current.toLowerCase(), password.current);
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
      await SettingsService.set({
        sessionExpired: false,
        userEmailConfirmed: user.isEmailConfirmed
      });
      eSendEvent('userLoggedIn', true);
      await sleep(500);
      presentSheet({
        title: 'Syncing your data',
        paragraph: 'Please wait while we sync all your data.',
        progress: true
      });
    } catch (e) {
      console.log(e.stack);
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
      <IconButton
        name="arrow-left"
        onPress={() => {
          eSendEvent(eCloseLoginDialog);
        }}
        color={colors.pri}
        customStyle={{
          position: 'absolute',
          zIndex: 999,
          left: 12,
          top: Platform.OS === 'ios' ? 12 + insets.top : 12
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
          <BouncingView initialScale={1.2} duration={5000}>
            <SvgView src={SVG(colors.night ? colors.icon : 'black')} height={700} />
          </BouncingView>
        </View>
        <BouncingView initialScale={0.95} duration={3000}>
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
              autoComplete="email"
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
              autoComplete="password"
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
        </BouncingView>
      </View>
    </>
  );
};
