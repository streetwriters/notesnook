import { useMessageStore } from '../stores/stores';
import { eOpenLoginDialog, eOpenRateDialog, eOpenRecoveryKeyDialog } from '../utils/events';
import { eSendEvent } from './event-manager';
import PremiumService from './premium';
import { verifyUser } from '../screens/settings/functions';
import { MMKV } from '../utils/database/mmkv';
import { Platform } from 'react-native';
import umami from '../utils/analytics';
import SettingsService from './settings';

const rateAppMessage = {
  visible: true,
  message: 'We would love to know what you think',
  actionText: 'Rate Notesnook on ' + `${Platform.OS === 'ios' ? 'App store' : 'Play store'}`,
  onPress: () => {
    eSendEvent(eOpenRateDialog);
  },
  data: {},
  icon: 'star',
  type: 'normal'
};

export function setRateAppMessage() {
  useMessageStore.getState().setMessage(rateAppMessage);
}

const recoveryKeyMessage = {
  visible: true,
  message: 'Keep your data safe if you lose password',
  actionText: 'Save your account recovery key',
  onPress: () => {
    verifyUser(
      null,
      () => {
        eSendEvent(eOpenRecoveryKeyDialog);
      },
      true,
      async () => {
        SettingsService.set({
          recoveryKeySaved: true
        });
        clearMessage();
      },
      'I have saved my key already'
    );
  },
  data: {},
  icon: 'key',
  type: 'normal'
};

export function setRecoveryKeyMessage() {
  useMessageStore.getState().setMessage(recoveryKeyMessage);
}

const loginMessage = {
  visible: true,
  message: 'You are not logged in',
  actionText: 'Login to encrypt and sync notes',
  onPress: () => {
    umami.pageView('/signup', '/welcome/home');
    eSendEvent(eOpenLoginDialog);
  },
  data: {},
  icon: 'account-outline',
  type: 'normal'
};

export function setLoginMessage() {
  useMessageStore.getState().setMessage(loginMessage);
}

const emailMessage = {
  visible: true,
  message: 'Email not confirmed',
  actionText: 'Please confrim your email to sync notes.',
  onPress: () => {
    PremiumService.showVerifyEmailDialog();
  },
  data: {},
  icon: 'email',
  type: 'error'
};

export function setEmailVerifyMessage() {
  useMessageStore.getState().setMessage(emailMessage);
}

const noMessage = {
  visible: false,
  message: '',
  actionText: '',
  onPress: null,
  data: {},
  icon: 'account-outline'
};

export function clearMessage() {
  useMessageStore.getState().setMessage(noMessage);
}
