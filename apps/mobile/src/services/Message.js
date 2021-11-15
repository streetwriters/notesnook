import { useMessageStore } from '../provider/stores';
import { eOpenLoginDialog } from '../utils/Events';
import { eSendEvent } from './EventManager';
import PremiumService from './PremiumService';

const loginMessage = {
  visible: true,
  message: 'You are not logged in',
  actionText: 'Login to encrypt and sync notes',
  onPress: () => {
    eSendEvent(eOpenLoginDialog);
  },
  data: {},
  icon: 'account-outline',
  type: 'normal',
};

export function setLoginMessage() {
  useMessageStore.getState().setMessage(loginMessage);
}

const emailMessage = {
  visible: true,
  message: 'Email not confirmed',
  actionText: 'Confirm now to get 7 more days of free trial',
  onPress: () => {
    PremiumService.showVerifyEmailDialog();
  },
  data: {},
  icon: 'email',
  type: 'normal',
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
  icon: 'account-outline',
};

export function clearMessage() {
  useMessageStore.getState().setMessage(noMessage);
}
