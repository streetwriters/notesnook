import isEmail from 'validator/lib/isEmail';

export function validateEmail(email) {
  if (email && email.length > 0) {
    return isEmail(email);
  } else {
    return false;
  }
}

export const ERRORS_LIST = {
  SHORT_PASS: 'Atleast 8 characters'
  // NO_ABC: 'Atleast 1 lowercase letter.',
  // NO_CAPS_ABC: 'Atleast 1 capital letter.',
  // NO_NUM: 'Atleast 1 number',
  // SPECIAL: 'Atleast 1 special character',
};

export function validatePass(password) {
  if (password?.length <= 0) {
    return false;
  }

  let errors = {
    SHORT_PASS: true
    //  NO_ABC: true,
    //  NO_CAPS_ABC: true,
    //  NO_NUM: true,
    // SPECIAL: true,
  };

  if (password.length >= 8) {
    errors.SHORT_PASS = false;
  }

  /*   if (password.match(/[a-z]+/)) {
    errors.NO_ABC = false;
  }
  if (password.match(/[A-Z]+/)) {
    errors.NO_CAPS_ABC = false;
  }
  if (password.match(/[0-9]+/)) {
    errors.NO_NUM = false;
  }
  if (password.match(/[$@#&!_]+/)) {
    errors.SPECIAL = false;
  } */
  return errors;
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
  //let user = await db.user.get();
  return false;
}
