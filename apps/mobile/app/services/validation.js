/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { strings } from "@notesnook/intl";
import isEmail from "validator/lib/isEmail";

export function validateEmail(email) {
  if (email && email.length > 0) {
    return isEmail(email);
  } else {
    return false;
  }
}

export const ERRORS_LIST = {
  SHORT_PASS: strings.passTooShort()
};

export function validatePass(password) {
  let errors = {
    SHORT_PASS: false
  };

  if (password?.length < 8) {
    errors.SHORT_PASS = true;
  } else {
    errors.SHORT_PASS = false;
  }

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
