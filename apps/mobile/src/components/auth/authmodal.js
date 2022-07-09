import React, { useEffect, useRef, useState } from 'react';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import { useThemeStore } from '../../stores/use-theme-store';
import { eCloseLoginDialog, eOpenLoginDialog } from '../../utils/events';
import { SIZE } from '../../utils/size';
import { sleep } from '../../utils/time';
import BaseDialog from '../dialog/base-dialog';
import { Toast } from '../toast';
import { Button } from '../ui/button';
import { IconButton } from '../ui/icon-button';
import { hideAuth, initialAuthMode } from './common';
import { Login } from './login';
import { Signup } from './signup';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View } from 'react-native';

export const AuthMode = {
  login: 0,
  signup: 1,
  welcomeSignup: 2,
  trialSignup: 3
};

const AuthModal = () => {
  const colors = useThemeStore(state => state.colors);
  const [visible, setVisible] = useState(false);
  const [currentAuthMode, setCurrentAuthMode] = useState(AuthMode.login);
  const actionSheetRef = useRef();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    eSubscribeEvent(eOpenLoginDialog, open);
    eSubscribeEvent(eCloseLoginDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenLoginDialog, open);
      eUnSubscribeEvent(eCloseLoginDialog, close);
    };
  }, []);

  async function open(mode) {
    setCurrentAuthMode(mode ? mode : AuthMode.login);
    initialAuthMode.current = mode ? mode : AuthMode.login;
    setVisible(true);
    await sleep(10);
    actionSheetRef.current?.show();
  }

  const close = () => {
    actionSheetRef.current?.hide();
    setCurrentAuthMode(AuthMode.login);
    setVisible(false);
  };

  return !visible ? null : (
    <BaseDialog
      overlayOpacity={0}
      statusBarTranslucent={false}
      onRequestClose={currentAuthMode !== AuthMode.welcomeSignup && close}
      visible={true}
      onClose={close}
      useSafeArea={false}
      bounce={false}
      background={colors.bg}
      transparent={false}
      animated={false}
    >
      {currentAuthMode !== AuthMode.login ? (
        <Signup
          changeMode={mode => setCurrentAuthMode(mode)}
          trial={AuthMode.trialSignup === currentAuthMode}
          welcome={initialAuthMode.current === AuthMode.welcomeSignup}
        />
      ) : (
        <Login
          welcome={initialAuthMode.current === AuthMode.welcomeSignup}
          changeMode={mode => setCurrentAuthMode(mode)}
        />
      )}

      <View
        style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? insets.top : 0,
          zIndex: 999,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          width: '100%',
          height: 50,
          justifyContent: 'space-between'
        }}
      >
        {initialAuthMode.current === AuthMode.welcomeSignup ? null : (
          <IconButton
            name="arrow-left"
            onPress={() => {
              hideAuth();
            }}
            color={colors.pri}
          />
        )}

        {initialAuthMode.current !== AuthMode.welcomeSignup ? null : (
          <Button
            title="Skip for now"
            onPress={() => {
              hideAuth();
            }}
            iconSize={20}
            type="gray"
            iconPosition="right"
            icon="chevron-right"
            height={25}
            iconStyle={{
              marginTop: 2
            }}
            style={{
              paddingHorizontal: 6
            }}
          />
        )}
      </View>

      <Toast context="local" />
    </BaseDialog>
  );
};

export default AuthModal;
