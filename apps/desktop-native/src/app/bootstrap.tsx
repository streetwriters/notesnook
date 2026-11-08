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

import type { ComponentType } from "react";
import { environment } from "@platform";
import { getCurrentPath } from "./navigation";
import Config from "./utils/config";
import { shouldShowWrapped } from "./utils/should-show-wrapped";
import App from "./app";
import Plans from "./views/plans";
import Wrapped from "./views/wrapped";
import Checkout from "./views/checkout";
import Payments from "./views/payments";
import Recovery from "./views/recovery";
import EmailConfirmed from "./views/email-confirmed";
import Auth from "./views/auth";

type Route = {
  Component: ComponentType<any>;
  props: Record<string, unknown> | null;
};

type RouteWithPath = { route: Route; path: Routes };

const routes = {
  "/plans": { Component: Plans, props: null },
  "/wrapped": { Component: Wrapped, props: null },
  "/checkout": { Component: Checkout, props: null },
  "/payments": { Component: Payments, props: {} },
  "/account/recovery": { Component: Recovery, props: { route: "methods" } },
  "/account/verified": { Component: EmailConfirmed, props: {} },
  "/signup": { Component: Auth, props: { route: "signup" } },
  "/sessionexpired": { Component: Auth, props: { route: "sessionExpiry" } },
  "/login": { Component: Auth, props: { route: "login" } },
  "/recover": { Component: Auth, props: { route: "recover" } },
  "/login/mfa/code": { Component: Auth, props: { route: "login" } },
  "/login/mfa/select": { Component: Auth, props: { route: "login" } },
  default: { Component: App, props: null }
} as const;

export type Routes = keyof typeof routes;

const sessionExpiryExceptions: Routes[] = [
  "/payments",
  "/recover",
  "/account/recovery",
  "/sessionexpired",
  "/login/mfa/code",
  "/login/mfa/select"
];

export function getRoute(options: { isLoggedIn: boolean }): RouteWithPath {
  let path = getCurrentPath() as Routes;

  if (isAccountRecoveryRoute(path)) path = "/account/recovery";

  const signup = redirectToRegistration(path, options.isLoggedIn);
  const sessionExpired = isSessionExpired(path);
  const route = (
    routes[path as keyof typeof routes]
      ? { route: routes[path as keyof typeof routes], path }
      : null
  ) as RouteWithPath | null;

  if (route?.path === "/wrapped" && !shouldShowWrapped())
    return { route: routes.default, path: "default" };

  return signup || sessionExpired || route || fallbackRoute();
}

export function getPersistence(path: Routes) {
  return isAccountRecoveryRoute(path) ? ("memory" as const) : ("db" as const);
}

function isAccountRecoveryRoute(path: string): boolean {
  return path.startsWith("/account/recovery");
}

function fallbackRoute(): RouteWithPath {
  return { route: routes.default, path: "default" };
}

function shouldSkipInitiation(isLoggedIn: boolean) {
  return (
    environment.isTesting ||
    environment.isDev ||
    isLoggedIn ||
    Config.get("skipInitiation", false)
  );
}

function redirectToRegistration(
  path: Routes,
  isLoggedIn: boolean
): RouteWithPath | null {
  if (!shouldSkipInitiation(isLoggedIn) && !routes[path as keyof typeof routes])
    return { route: routes["/signup"], path: "/signup" };
  return null;
}

function isSessionExpired(path: Routes): RouteWithPath | null {
  const expired = Config.get("sessionExpired", false);
  if (expired && !sessionExpiryExceptions.includes(path))
    return { route: routes["/sessionexpired"], path: "/sessionexpired" };
  return null;
}
