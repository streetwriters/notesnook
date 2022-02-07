import React, { useEffect, useRef, useState } from 'react';
import { useTracked } from '../../provider/index';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import { eCloseLoginDialog, eOpenLoginDialog } from '../../utils/Events';
import { sleep } from '../../utils/TimeUtils';
import BaseDialog from '../Dialog/base-dialog';
import { Toast } from '../Toast';
import { Login } from './login';
import { Signup } from './signup';

const MODES = {
  login: 0,
  signup: 1,
  welcomeSignup: 2
};

const LoginDialog = () => {
  const [state] = useTracked();
  const colors = state.colors;
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState(MODES.login);
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
    setMode(mode ? mode : MODES.login);
    setVisible(true);
    await sleep(10);
    actionSheetRef.current?.show();
  }

  const close = () => {
    actionSheetRef.current?.hide();
    setMode(MODES.login);
    setVisible(false);
  };

  return !visible ? null : (
    <BaseDialog
      overlayOpacity={0}
      statusBarTranslucent={false}
      onRequestClose={MODES.sessionExpired !== mode && close}
      visible={true}
      onClose={close}
      background={colors.bg}
      transparent={true}
    >
      <Toast context="local" />

      {mode === MODES.signup || mode === MODES.welcomeSignup ? (
        <Signup changeMode={mode => setMode(mode)} welcome={mode === MODES.welcomeSignup} />
      ) : (
        <Login changeMode={mode => setMode(mode)} />
      )}
    </BaseDialog>
  );
};

export default LoginDialog;
