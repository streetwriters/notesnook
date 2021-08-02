import "./commands";
import React from "react";
import { initializeDatabase } from "./common/db";
import "./index.css";
import * as serviceWorker from "./serviceWorkerRegistration";
import "./utils/overrides";
import { loadTrackerScript } from "./utils/analytics";

if (process.env.NODE_ENV === "production") {
  loadTrackerScript();
  console.log = () => {};
}

initializeDatabase().then(async (db) => {
  const isLoggedIn = !!(await db.user.getUser());
  if (!isLoggedIn && window.location.pathname === "/")
    window.location.replace("/signup");

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
