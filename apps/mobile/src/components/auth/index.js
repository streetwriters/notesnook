import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import { useThemeStore } from '../../stores/use-theme-store';
import { eCloseLoginDialog, eOpenLoginDialog } from '../../utils/events';
import { sleep } from '../../utils/time';
import BaseDialog from '../dialog/base-dialog';
import { Toast } from '../toast';
import { IconButton } from '../ui/icon-button';
import { Login } from './login';
import { Signup } from './signup';

export const AuthMode = {
  login: 0,
  signup: 1,
  welcomeSignup: 2,
  trialSignup: 3
};

const Auth = () => {
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
    >
      {currentAuthMode !== AuthMode.login ? (
        <Signup
          changeMode={mode => setCurrentAuthMode(mode)}
          trial={AuthMode.trialSignup === currentAuthMode}
          welcome={currentAuthMode === AuthMode.welcomeSignup}
        />
      ) : (
        <Login changeMode={mode => setCurrentAuthMode(mode)} />
      )}

      {currentAuthMode === AuthMode.welcomeSignup ? null : (
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

      <Toast context="local" />
    </BaseDialog>
  );
};

export default Auth;
