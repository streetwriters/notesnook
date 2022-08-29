import "@notesnook/core/types";
import { EVENTS } from "@notesnook/desktop/events";
import { AppEventManager } from "./common/app-events";
import { render } from "react-dom";
import { getCurrentHash, getCurrentPath, makeURL } from "./navigation";
import Config from "./utils/config";
import { isTesting } from "./utils/platform";
import { initalizeLogger, logger } from "./utils/logger";
import { Buffer } from "buffer";
global.Buffer = Buffer;

initalizeLogger();
if (process.env.REACT_APP_PLATFORM === "desktop") require("./commands");

type Route = {
  component: () => Promise<{ default: (...props: any[]) => JSX.Element }>;
  props: Record<string, any>;
};

type RouteWithPath = {
  route: Route;
  path: Routes;
};

type Routes =
  | "/account/recovery"
  | "/account/verified"
  | "/signup"
  | "/login"
  | "/sessionexpired"
  | "/recover"
  | "/mfa/code"
  | "/mfa/select"
  | "default";

const routes: Record<Routes, Route> = {
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
    props: { route: "login" }
  },
  "/recover": {
    component: () => import("./views/auth"),
    props: { route: "recover" }
  },
  "/mfa/code": {
    component: () => import("./views/auth"),
    props: { route: "login" }
  },
  "/mfa/select": {
    component: () => import("./views/auth"),
    props: { route: "login" }
  },
  default: { component: () => import("./app"), props: {} }
};

const sessionExpiryExceptions: Routes[] = [
  "/recover",
  "/account/recovery",
  "/sessionexpired"
];

const serviceWorkerWhitelist: Routes[] = ["default"];

function getRoute(): RouteWithPath {
  const path = getCurrentPath() as Routes;
  logger.info(`Getting route for path: ${path}`);

  const signup = redirectToRegistration(path);
  const sessionExpired = isSessionExpired(path);
  const fallback = fallbackRoute();
  const route: RouteWithPath | null = routes[path]
    ? { route: routes[path], path }
    : null;

  return signup || sessionExpired || route || fallback;
}

function fallbackRoute(): RouteWithPath {
  return { route: routes.default, path: "default" };
}

function redirectToRegistration(path: Routes): RouteWithPath | null {
  if (!isTesting() && !shouldSkipInitiation() && !routes[path]) {
    window.history.replaceState({}, "", makeURL("/signup", getCurrentHash()));
    return { route: routes["/signup"], path: "/signup" };
  }
  return null;
}

function isSessionExpired(path: Routes): RouteWithPath | null {
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

if (process.env.NODE_ENV === "development") {
  (async function dev() {
    const { initializeDatabase } = await import("./common/db");
    await initializeDatabase();
    renderApp();
  })();
} else {
  renderApp();
}

async function renderApp() {
  const {
    path,
    route: { component, props }
  } = getRoute();

  if (serviceWorkerWhitelist.includes(path)) await initializeServiceWorker();

  logger.measure("app render");

  const { default: Component } = await component();
  render(<Component {...props} />, document.getElementById("root"), () => {
    logger.measure("app render");

    document.getElementById("splash")?.remove();
  });
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
