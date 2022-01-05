import { EVENTS } from "@notesnook/desktop/events";
import { render } from "react-dom";
import { AppEventManager } from "./common/app-events";
import { updateStatus } from "./hooks/use-status";
import { getCurrentHash, getCurrentPath, makeURL } from "./navigation";
import * as serviceWorker from "./serviceWorkerRegistration";
import Config from "./utils/config";
import { isTesting } from "./utils/platform";
import { getServiceWorkerVersion } from "./utils/version";
if (process.env.REACT_APP_PLATFORM === "desktop") require("./commands");

const ROUTES = {
  "/account/recovery": {
    component: () => import("./views/recovery"),
    props: {},
  },
  "/account/verified": {
    component: () => import("./views/email-confirmed"),
    props: {},
  },
  "/signup": {
    component: () => import("./views/auth"),
    props: { type: "signup" },
  },
  "/sessionexpired": {
    component: () => import("./views/auth"),
    props: { type: "sessionexpired" },
  },
  "/login": {
    component: () => import("./views/auth"),
    props: { type: "login" },
  },
  "/recover": {
    component: () => import("./views/auth"),
    props: { type: "recover" },
  },
  default: { component: () => import("./app"), props: {} },
};

const sessionExpiryExceptions = ["/recover", "/account/recovery"];

function getRoute() {
  const path = getCurrentPath();
  const isSessionExpired = Config.get("sessionExpired", false);
  if (isSessionExpired && !sessionExpiryExceptions.includes(path)) {
    window.history.replaceState(
      {},
      null,
      makeURL("/sessionexpired", getCurrentHash())
    );
    return ROUTES["/sessionexpired"];
  }

  if (!isTesting() && !shouldSkipInitiation() && !ROUTES[path]) {
    window.history.replaceState({}, null, makeURL("/signup", getCurrentHash()));
    return ROUTES["/signup"];
  }
  return ROUTES[path] || ROUTES.default;
}

const route = getRoute();
route?.component()?.then(({ default: Component }) => {
  render(
    <Component {...route.props} />,
    document.getElementById("root"),
    () => {
      document.getElementById("splash").remove();
    }
  );
});

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
if (process.env.REACT_APP_PLATFORM !== "desktop") {
  serviceWorker.register({
    onUpdate: async (registration) => {
      if (!registration.waiting) return;
      const { formatted } = await getServiceWorkerVersion(registration.waiting);
      AppEventManager.publish(EVENTS.updateDownloadCompleted, {
        version: formatted,
      });
    },
    onSuccess: () => {
      updateStatus({
        key: "pwaStatus",
        status: "Ready for offline use.",
        icon: "online",
      });
    },
    onError: () => {
      updateStatus({
        key: "pwaStatus",
        status: "Offline",
        icon: "offline",
      });
    },
  });
} else serviceWorker.unregister();

function shouldSkipInitiation() {
  return localStorage.getItem("skipInitiation") || false;
}
