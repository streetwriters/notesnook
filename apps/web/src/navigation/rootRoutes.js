import React from "react";
import ReactDOM from "react-dom";
import App from "../App";
import { MotionConfig, AnimationFeature, GesturesFeature } from "framer-motion";
import Splash from "../views/splash";
import AccountRecovery from "../views/recovery";
import EmailConfirmed from "../views/emailconfirmed";

const rootroutes = {
  "/": () => (
    <MotionConfig features={[AnimationFeature, GesturesFeature]}>
      <Splash
        onLoadingFinished={() => {
          ReactDOM.render(
            <MotionConfig features={[AnimationFeature, GesturesFeature]}>
              <App />
            </MotionConfig>,
            document.getElementById("root")
          );
        }}
      />
    </MotionConfig>
  ),
  "/accountRecovery": () => <AccountRecovery />,
  "/emailConfirmed": () => <EmailConfirmed />,
};

export default rootroutes;
