import { Actions } from '../provider/Actions';
import { useMessageStore } from '../provider/stores';
import { eOpenLoginDialog } from '../utils/Events';
import { eSendEvent } from './EventManager';
import PremiumService from './PremiumService';

const loginMessage = {
  type: Actions.MESSAGE_BOARD_STATE,
  state: {
    visible: true,
    message: 'You are not logged in',
    actionText: 'Login to encrypt and sync notes.',
    onPress: () => {
      eSendEvent(eOpenLoginDialog);
    },
    data: {},
    icon: 'account-outline',
    type: 'normal',
  }
}

export function setLoginMessage() {
  useMessageStore.getState().setMessage(loginMessage)

}

const emailMessage = {
  type: Actions.MESSAGE_BOARD_STATE,
  state: {
    visible: true,
    message: 'Email not confirmed',
    actionText: 'Please confrim your email to encrypt and sync notes.',
    onPress: () => {
      PremiumService.showVerifyEmailDialog();
    },
    data: {},
    icon: 'alert',
    type: 'error',
  },
}

export function setEmailVerifyMessage() {
  useMessageStore.getState().setMessage(emailMessage)
}

const noMessage = {
  type: Actions.MESSAGE_BOARD_STATE,
  state: {
    visible: false,
    message: '',
    actionText: '',
    onPress: null,
    data: {},
    icon: 'account-outline',
  },
}

export function clearMessage() {
  useMessageStore.getState().setMessage(noMessage)
}
