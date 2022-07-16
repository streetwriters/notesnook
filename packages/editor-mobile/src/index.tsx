import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "@streetwriters/editor/styles/katex.min.css";
import "@streetwriters/editor/styles/prism-theme.css";
import "@streetwriters/editor/styles/fonts.mobile.css";
import "@streetwriters/editor/styles/katexfonts.mobile.css";
import "@streetwriters/editor/styles/styles.css";

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
