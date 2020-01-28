import {ToastEvent} from '../utils/utils';

let regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

export function validateEmail(email) {
  if (email && email.length > 0) {
    ToastEvent.show('Please enter a valid email address');
    return regex.test(email);
  } else {
    ToastEvent.show('Please enter email or passoword to login');
    return false;
  }
}

export function validatePass(password) {
  if (password && password.length <= 0) {
    ToastEvent.show('No password provided');

    return false;
  }
  if (password && password.length < 8 && password.length > 0) {
    ToastEvent.show('Password too short');

    return false;
  } else if (password && password.length > 8 && password.length > 0) {
    return true;
  }
}

export function validateUsername(username) {
  let regex = /^[a-z0-9_-]{3,16}$/gim;
  if (username && username.length > 0) {
    //ToastEvent.show('Please enter a valid email address');
    return regex.test(username);
  } else {
    //ToastEvent.show('Please enter email or passoword to login');
    return false;
  }
}
