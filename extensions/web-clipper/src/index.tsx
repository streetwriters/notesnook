import "../assets/16x16.png";
import "../assets/32x32.png";
import "../assets/48x48.png";
import "../assets/64x64.png";
import "../assets/128x128.png";
import "../assets/256x256.png";
import React from "react";
import ReactDOM from "react-dom";
import { App } from "./app";
import "./index.css";

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

// @ts-ignore
if (module.hot) module.hot.accept();
