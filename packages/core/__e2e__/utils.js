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

import { authenticator } from "otplib";

export const USER = {
  email: process.env.USER_EMAIL,
  password: process.env.USER_PASSWORD,
  hashed: process.env.USER_HASHED_PASSWORD,
  totpSecret: process.env.USER_TOTP_SECRET
};

export async function login(db, user = USER) {
  await db.user.authenticateEmail(user.email);

  const token = authenticator.generate(user.totpSecret);
  await db.user.authenticateMultiFactorCode(token, "app");

  await db.user.authenticatePassword(user.email, user.password, user.hashed);
}

export async function logout(db) {
  await db.user.logout(true);
}
