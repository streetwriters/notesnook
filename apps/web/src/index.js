import { render } from "react-dom";
import { getCurrentPath } from "./navigation";
import * as serviceWorker from "./serviceWorkerRegistration";
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

function getRoute() {
  const path = getCurrentPath();
  return ROUTES[path] || ROUTES.default;
}

const route = getRoute();
route.component().then(({ default: Component }) => {
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
if (process.env.REACT_APP_PLATFORM !== "desktop") serviceWorker.register();
else serviceWorker.unregister();
