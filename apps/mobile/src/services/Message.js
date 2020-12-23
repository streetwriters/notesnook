import {Actions} from '../provider/Actions';
import {db} from '../utils/DB';
import {
  eCloseProgressDialog,
  eOpenLoginDialog,
  eOpenProgressDialog,
} from '../utils/Events';
import {MMKV} from '../utils/mmkv';
import {eSendEvent, ToastEvent} from './EventManager';

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
      message: 'Account not verified',
      actionText: 'Please verify account to sync your data',
      onPress: () => {
        eSendEvent(eOpenProgressDialog, {
          title: 'Account not verified',
          paragraph:
            'We have sent you an account confirmation link. Please check your email to verify your account.',
          action: async () => {
            let lastEmailTime = await MMKV.getItem('lastEmailTime');
            if (
              lastEmailTime &&
              Date.now() - JSON.parse(lastEmailTime) < 60000 * 10
            ) {
              ToastEvent.show(
                'Please wait before sending another email.',
                'error',
                'local',
              );
              console.log("error")
              return;
            }
            await db.user.sendVerificationEmail();
            console.log("passed",lastEmailTime)
            await MMKV.setItem('lastEmailTime', JSON.stringify(Date.now()));
            ToastEvent.show('Verification email sent!', 'success', 'local');
          },
          actionText: 'Resend Confirmation Link',
          noProgress: true,
        });
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
