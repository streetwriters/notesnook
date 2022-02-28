import React, { useEffect, useRef, useState } from 'react';
import { useTracked } from '../../provider/index';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import { eCloseLoginDialog, eOpenLoginDialog } from '../../utils/events';
import { sleep } from '../../utils/time';
import BaseDialog from '../dialog/base-dialog';
import { Toast } from '../toast';
import { Login } from './login';
import { Signup } from './signup';

export const AuthMode = {
  login: 0,
  signup: 1,
  welcomeSignup: 2,
  trialSignup: 3
};

const Auth = () => {
  const [state] = useTracked();
  const colors = state.colors;
  const [visible, setVisible] = useState(false);
  const [currentAuthMode, setCurrentAuthMode] = useState(AuthMode.login);
  const actionSheetRef = useRef();

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
      <Toast context="local" />

      {currentAuthMode !== AuthMode.login ? (
        <Signup
          changeMode={mode => setCurrentAuthMode(mode)}
          trial={AuthMode.trialSignup === currentAuthMode}
          welcome={currentAuthMode === AuthMode.welcomeSignup}
        />
      ) : (
        <Login changeMode={mode => setCurrentAuthMode(mode)} />
      )}
    </BaseDialog>
  );
};

export default Auth;
