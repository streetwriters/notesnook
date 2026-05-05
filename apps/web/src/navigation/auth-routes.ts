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

import { getCurrentPath } from "./index";

export type AuthRoutes =
  | "sessionExpiry"
  | "login:email"
  | "login:password"
  | "signup"
  | "recover"
  | "mfa:code"
  | "mfa:select";

export const authRoutes: Record<AuthRoutes, string> = {
  "login:email": "/login",
  "login:password": "/login/password",
  "mfa:code": "/login/mfa/code",
  "mfa:select": "/login/mfa/select",
  recover: "/recover",
  sessionExpiry: "/sessionexpired",
  signup: "/signup"
};

const unauthorizedRoutes: AuthRoutes[] = [
  "login:email",
  "login:password",
  "signup",
  "mfa:code",
  "mfa:select",
  "recover"
];

export function isAuthRoute() {
  const path = getCurrentPath();
  return Object.values(authRoutes).includes(path);
}

export function isUnauthorizedRoute(route: AuthRoutes) {
  return unauthorizedRoutes.includes(route);
}
