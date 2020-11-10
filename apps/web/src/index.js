import "react-app-polyfill/ie11";
import "react-app-polyfill/ie9";
import "./utils/dimensions";
import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import Modal from "react-modal";
import { MotionConfig, AnimationFeature, GesturesFeature } from "framer-motion";
import Splash from "./views/splash";

Modal.setAppElement("#root");
ReactDOM.render(
  <MotionConfig features={[AnimationFeature, GesturesFeature]}>
    <Splash
      onLoadingFinished={() => {
        ReactDOM.render(
          <MotionConfig features={[AnimationFeature, GesturesFeature]}>
            <App />
          </MotionConfig>,
          document.getElementById("root")
        );

        // If you want your app to work offline and load faster, you can change
        // unregister() to register() below. Note this comes with some pitfalls.
        // Learn more about service workers: https://bit.ly/CRA-PWA
        serviceWorker.unregister();
      }}
    />
  </MotionConfig>,
  document.getElementById("root"),
  () => {}
);
