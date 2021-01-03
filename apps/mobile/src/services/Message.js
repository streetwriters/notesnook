import { Actions } from '../provider/Actions';
import { db } from '../utils/DB';
import {
  eOpenLoginDialog,
  eOpenProgressDialog
} from '../utils/Events';
import { MMKV } from '../utils/mmkv';
import { eSendEvent, ToastEvent } from './EventManager';
import PremiumService from './PremiumService';

export function setLoginMessage(dispatch) {
  dispatch({
    type: Actions.MESSAGE_BOARD_STATE,
    state: {
      visible: true,
      message: 'You are not logged in',
      actionText: 'Login to sync your data.',
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
      message: 'Email not verified',
      actionText: 'Please verify your email to sync.',
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
