import {db} from "../utils/DB";

let regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

export function validateEmail(email) {
  if (email && email.length > 0) {
    return regex.test(email);
  } else {
    return false;
  }
}

export function validatePass(password) {
  if (password && password.length <= 0) {
    return false;
  }
  if (password && password.length < 8 && password.length > 0) {
    return false;
  } else if (password && password.length >= 8 && password.length > 0) {
    return true;
  }
}

export function validateUsername(username) {
  let regex = /^[a-z0-9_-]{3,200}$/gim;
  if (username && username.length > 0) {
    return regex.test(username);
  } else {
    return false;
  }
}

export async function checkPremiumUser() {
  let user = await db.user.get();
  return false;
}
