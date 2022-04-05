import React, { useRef, useState } from 'react';
import { Dimensions, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../stores/theme';
import { useUserStore } from '../../stores/stores';
import { DDS } from '../../services/device-detection';
import { eSendEvent, ToastEvent } from '../../services/event-manager';
import { clearMessage, setEmailVerifyMessage } from '../../services/message';
import PremiumService from '../../services/premium';
import { db } from '../../utils/database';
import { eCloseLoginDialog } from '../../utils/events';
import { openLinkInBrowser } from '../../utils/functions';
import { SIZE } from '../../utils/size';
import { sleep } from '../../utils/time';
import umami from '../../utils/analytics';
import { IconButton } from '../ui/icon-button';
import { Button } from '../ui/button';
import BaseDialog from '../dialog/base-dialog';
import Input from '../ui/input';
import { SvgView } from '../ui/svg';
import { BouncingView } from '../ui/transitions/bouncing-view';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';
import { SVG } from './background';

export const Signup = ({ changeMode, welcome, trial }) => {
  const colors = useThemeStore(state => state.colors);
  const email = useRef();
  const emailInputRef = useRef();
  const passwordInputRef = useRef();
  const password = useRef();
  const confirmPasswordInputRef = useRef();
  const confirmPassword = useRef();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const insets = useSafeAreaInsets();

  const setUser = useUserStore(state => state.setUser);
  const setLastSynced = useUserStore(state => state.setLastSynced);

  const validateInfo = () => {
    if (!password.current || !email.current || !confirmPassword.current) {
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

  const signup = async () => {
    if (!validateInfo() || error) return;
    setLoading(true);
    try {
      await db.user.signup(email.current.toLowerCase(), password.current);
      let user = await db.user.getUser();
      setUser(user);
      setLastSynced(await db.lastSynced());
      clearMessage();
      setEmailVerifyMessage();
      eSendEvent(eCloseLoginDialog);
      umami.pageView('/account-created', '/welcome/signup');
      await sleep(300);
      if (trial) {
        PremiumService.sheet(null, null, true);
      } else {
        PremiumService.showVerifyEmailDialog();
      }
    } catch (e) {
      setLoading(false);
      ToastEvent.show({
        heading: 'Signup failed',
        message: e.message,
        type: 'error',
        context: 'local'
      });
    }
  };

  return (
    <>
      {!welcome && (
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
      )}

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
          <BouncingView initialScale={1.05} duration={5000}>
            <SvgView src={SVG(colors.night ? colors.icon : 'black')} height={700} />
          </BouncingView>
        </View>

        <BouncingView initialScale={0.98} duration={5000}>
          <View
            style={{
              width: '100%',
              justifyContent: 'center',
              alignSelf: 'center',
              paddingHorizontal: 12,
              marginBottom: 30,
              marginTop: Dimensions.get('window').height < 700 ? -75 : 15
            }}
          >
            <Heading
              style={{
                textAlign: 'center'
              }}
              size={30}
              color={colors.heading}
            >
              Create your account
            </Heading>
            <Paragraph
              style={{
                textDecorationLine: 'underline',
                textAlign: 'center'
              }}
              onPress={() => {
                changeMode(0);
              }}
              size={SIZE.md}
            >
              Already have an account? Log in
            </Paragraph>
          </View>
          <View
            style={{
              width: '100%',
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
              testID="input.email"
              onErrorCheck={e => setError(e)}
              returnKeyLabel="Next"
              returnKeyType="next"
              autoComplete="email"
              validationType="email"
              autoCorrect={false}
              autoCapitalize="none"
              errorMessage="Email is invalid"
              placeholder="Email"
              onSubmit={() => {
                passwordInputRef.current?.focus();
              }}
            />

            <Input
              fwdRef={passwordInputRef}
              onChangeText={value => {
                password.current = value;
              }}
              testID="input.password"
              onErrorCheck={e => setError(e)}
              returnKeyLabel="Next"
              returnKeyType="next"
              secureTextEntry
              autoComplete="password"
              autoCapitalize="none"
              validationType="password"
              autoCorrect={false}
              placeholder="Password"
              onSubmit={() => {
                confirmPasswordInputRef.current?.focus();
              }}
            />

            <Input
              fwdRef={confirmPasswordInputRef}
              onChangeText={value => {
                confirmPassword.current = value;
              }}
              testID="input.confirmPassword"
              onErrorCheck={e => setError(e)}
              returnKeyLabel="Signup"
              returnKeyType="done"
              secureTextEntry
              autoComplete="password"
              autoCapitalize="none"
              autoCorrect={false}
              validationType="confirmPassword"
              customValidator={() => password.current}
              placeholder="Confirm password"
              marginBottom={5}
              onSubmit={signup}
            />
            <Paragraph size={SIZE.xs} color={colors.icon}>
              By signing up, you agree to our{' '}
              <Paragraph
                size={SIZE.xs}
                onPress={() => {
                  openLinkInBrowser('https://notesnook.com/tos', colors)
                    .catch(e => {})
                    .then(r => {});
                }}
                style={{
                  textDecorationLine: 'underline'
                }}
                color={colors.accent}
              >
                terms of service{' '}
              </Paragraph>
              and{' '}
              <Paragraph
                size={SIZE.xs}
                onPress={() => {
                  openLinkInBrowser('https://notesnook.com/privacy', colors)
                    .catch(e => {})
                    .then(r => {});
                }}
                style={{
                  textDecorationLine: 'underline'
                }}
                color={colors.accent}
              >
                privacy policy.
              </Paragraph>
            </Paragraph>

            <View
              style={{
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
                onPress={signup}
                type="accent"
                title={loading ? null : 'Agree and continue'}
              />

              {loading || !welcome ? null : (
                <Button
                  style={{
                    marginTop: 10,
                    width: 250,
                    borderRadius: 100
                  }}
                  onPress={() => {
                    eSendEvent(eCloseLoginDialog);
                  }}
                  type="grayBg"
                  title="Skip for now"
                />
              )}
            </View>
          </View>
        </BouncingView>
      </View>
    </>
  );
};
