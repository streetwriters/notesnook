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

import "@notesnook/core/types";
import { EVENTS } from "@notesnook/desktop/events";
import { AppEventManager } from "./common/app-events";
import { render } from "react-dom";
import { getCurrentHash, getCurrentPath, makeURL } from "./navigation";
import Config from "./utils/config";
import { isTesting } from "./utils/platform";
import { initalizeLogger, logger } from "./utils/logger";
import { Buffer } from "buffer";
import { AuthProps } from "./views/auth";
global.Buffer = Buffer;

initalizeLogger();
if (process.env.REACT_APP_PLATFORM === "desktop") require("./commands");

type Route<TProps = null> = {
  component: () => Promise<{
    default: TProps extends null
      ? () => JSX.Element
      : (props: TProps) => JSX.Element;
  }>;
  props: TProps | null;
};

type RouteWithPath<T = null> = {
  route: Route<T>;
  path: Routes;
};

type Routes = keyof typeof routes;
// | "/account/recovery"
// | "/account/verified"
// | "/signup"
// | "/login"
// | "/sessionexpired"
// | "/recover"
// | "/mfa/code"
// | "/mfa/select"
// | "default";

const routes = {
  "/account/recovery": {
    component: () => import("./views/recovery"),
    props: { route: "methods" }
  },
  "/account/verified": {
    component: () => import("./views/email-confirmed"),
    props: {}
  },
  "/signup": {
    component: () => import("./views/auth"),
    props: { route: "signup" }
  },
  "/sessionexpired": {
    component: () => import("./views/auth"),
    props: { route: "sessionExpiry" }
  },
  "/login": {
    component: () => import("./views/auth"),
    props: { route: "login:email" }
  },
  "/login/password": {
    component: () => import("./views/auth"),
    props: { route: "login:email" }
  },
  "/recover": {
    component: () => import("./views/auth"),
    props: { route: "recover" }
  },
  "/login/mfa/code": {
    component: () => import("./views/auth"),
    props: { route: "login:email" }
  },
  "/login/mfa/select": {
    component: () => import("./views/auth"),
    props: { route: "login:email" }
  },
  default: { component: () => import("./app"), props: null }
} as const;

const sessionExpiryExceptions: Routes[] = [
  "/recover",
  "/account/recovery",
  "/sessionexpired",
  "/login/mfa/code",
  "/login/mfa/select",
  "/login/password"
];

const serviceWorkerWhitelist: Routes[] = ["default"];

function getRoute(): RouteWithPath<AuthProps> | RouteWithPath {
  const path = getCurrentPath() as Routes;
  logger.info(`Getting route for path: ${path}`);

  const signup = redirectToRegistration(path);
  const sessionExpired = isSessionExpired(path);
  const fallback = fallbackRoute();
  const route = (
    routes[path] ? { route: routes[path], path } : null
  ) as RouteWithPath<AuthProps> | null;

  return signup || sessionExpired || route || fallback;
}

function fallbackRoute(): RouteWithPath {
  return { route: routes.default, path: "default" };
}

function redirectToRegistration(path: Routes): RouteWithPath<AuthProps> | null {
  if (!isTesting() && !shouldSkipInitiation() && !routes[path]) {
    window.history.replaceState({}, "", makeURL("/signup", getCurrentHash()));
    return { route: routes["/signup"], path: "/signup" };
  }
  return null;
}

function isSessionExpired(path: Routes): RouteWithPath<AuthProps> | null {
  const isSessionExpired = Config.get("sessionExpired", false);
  if (isSessionExpired && !sessionExpiryExceptions.includes(path)) {
    logger.info(`User session has expired. Routing to /sessionexpired`);

    window.history.replaceState(
      {},
      "",
      makeURL("/sessionexpired", getCurrentHash())
    );
    return { route: routes["/sessionexpired"], path: "/sessionexpired" };
  }
  return null;
}

renderApp();

async function renderApp() {
  const {
    path,
    route: { component, props }
  } = getRoute();

  if (serviceWorkerWhitelist.includes(path)) await initializeServiceWorker();

  logger.measure("app render");

  const { default: Component } = await component();
  render(
    <Component route={props?.route || "login:email"} />,
    document.getElementById("root"),
    () => {
      logger.measure("app render");

      document.getElementById("splash")?.remove();
    }
  );
}

async function initializeServiceWorker() {
  logger.info("Initializing service worker...");
  const serviceWorker = await import("./service-worker-registration");

  // If you want your app to work offline and load faster, you can change
  // unregister() to register() below. Note this comes with some pitfalls.
  // Learn more about service workers: https://bit.ly/CRA-PWA
  if (process.env.REACT_APP_PLATFORM !== "desktop") {
    serviceWorker.register({
      onUpdate: async (registration: ServiceWorkerRegistration) => {
        if (!registration.waiting) return;
        const { getServiceWorkerVersion } = await import("./utils/version");
        const { formatted } = await getServiceWorkerVersion(
          registration.waiting
        );
        AppEventManager.publish(EVENTS.updateDownloadCompleted, {
          version: formatted
        });
      }
    });
    // window.addEventListener("beforeinstallprompt", () => showInstallNotice());
  } else serviceWorker.unregister();
}

function shouldSkipInitiation() {
  return localStorage.getItem("skipInitiation") || false;
}
