import React from "react";
import { initializeDatabase } from "./common/db";
import "./index.css";
import * as serviceWorker from "./serviceWorker";
// import { init, showReportDialog } from "@sentry/react";
// import { Integrations } from "@sentry/tracing";
// import { getAppVersion } from "./utils/useVersion";
// const App = React.lazy(() => import("./App"));

// if (process.env.NODE_ENV === "production") {
//   console.log = () => {};
//   init({
//     dsn:
//       "https://647084abf3de441c83c17d2b603633b8@o477952.ingest.sentry.io/5520885",
//     integrations: [new Integrations.BrowserTracing()],
//     beforeSend: (event) => {
//       if (event.exception || event.extra.report === true) {
//         showReportDialog();
//       }
//       return event;
//     },
//     release: `notesnook-web@${getAppVersion().formatted}`,
//     ignoreErrors: [/ResizeObserver loop limit exceeded/],
//     // We recommend adjusting this value in production, or using tracesSampler
//     // for finer control
//     tracesSampleRate: 1.0,
//   });
// }
initializeDatabase().then(() => {
  import("react-dom").then(({ render }) => {
    import("./App").then(({ default: App }) => {
      render(<App />, document.getElementById("root"), () => {
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
serviceWorker.unregister();
