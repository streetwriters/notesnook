import "./commands";
import React from "react";
import { initializeDatabase } from "./common/db";
import "./index.css";
import * as serviceWorker from "./serviceWorkerRegistration";
import "./utils/overrides";
import { loadTrackerScript } from "./utils/analytics";
import Config from "./utils/config";

if (process.env.NODE_ENV === "production") {
  loadTrackerScript();
  console.log = () => {};
}

const HOMEPAGE_ROUTE = { 1: "/notebooks", 2: "/favorites", 3: "/tags" };

async function checkRedirects(db) {
  const isLoggedIn = !!(await db.user.getUser());
  if (window.location.pathname === "/") {
    const skipInitiation = Config.get("skipInitiation", false);
    const homepage = Config.get("homepage", 0);
    if (!process.env.REACT_APP_CI && !isLoggedIn && !skipInitiation)
      window.location.replace("/signup");
    else if (homepage) {
      const route = HOMEPAGE_ROUTE[homepage];
      window.location.replace(route);
    }
  }
}

initializeDatabase().then(async (db) => {
  await checkRedirects(db);

  import("react-dom").then(({ render }) => {
    import("./App").then(({ default: App }) => {
      render(<App />, document.getElementById("root"), async () => {
        document.getElementById("splash").remove();
        import("react-modal").then(({ default: Modal }) => {
          Modal.setAppElement("#root");
        });
      });
    });
  });
});

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
if (process.env.REACT_APP_PLATFORM !== "desktop") serviceWorker.register();
else serviceWorker.unregister();
