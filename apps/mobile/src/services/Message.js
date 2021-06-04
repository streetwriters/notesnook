import { Actions } from '../provider/Actions';
import { eOpenLoginDialog } from '../utils/Events';
import { eSendEvent } from './EventManager';
import PremiumService from './PremiumService';

export function setLoginMessage(dispatch) {
  dispatch({
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
    },
  });
}

export function setEmailVerifyMessage(dispatch) {
  dispatch({
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
  });
}

export function clearMessage(dispatch) {
  dispatch({
    type: Actions.MESSAGE_BOARD_STATE,
    state: {
      visible: false,
      message: '',
      actionText: '',
      onPress: null,
      data: {},
      icon: 'account-outline',
    },
  });
}
