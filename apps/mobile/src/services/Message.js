import {Actions} from '../provider/Actions';
import {
  eCloseProgressDialog,
  eOpenLoginDialog,
  eOpenProgressDialog,
} from '../utils/Events';
import {eSendEvent} from './EventManager';

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
      type:"normal"
    },
  });
}

export function setEmailVerifyMessage(dispatch) {
  dispatch({
    type: Actions.MESSAGE_BOARD_STATE,
    state: {
      visible: true,
      message: 'Account not verified',
      actionText: 'Please verify account to sync your data',
      onPress: () => {
        eSendEvent(eOpenProgressDialog, {
          title: 'Account not verified',
          paragraph:
            'We have sent you an account confirmation link. Please check your email to verify your account.',
          action: () => {
            eSendEvent(eCloseProgressDialog);
          },
          noProgress: true,
        });
      },
      data: {},
      icon: 'alert',
      type:"error"
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
