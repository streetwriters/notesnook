import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import "@notesnook/editor/styles/katex.min.css";
import "@notesnook/editor/styles/prism-theme.css";
import "@notesnook/editor/styles/fonts.mobile.css";
import "@notesnook/editor/styles/katex-fonts.mobile.css";
import "@notesnook/editor/styles/styles.css";

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
