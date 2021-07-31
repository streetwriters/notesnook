import React from "react";
import AccountRecovery from "../views/recovery";
import EmailConfirmed from "../views/emailconfirmed";
import Auth from "../views/auth";

const rootroutes = {
  "/account/recovery": () => ({ component: <AccountRecovery /> }),
  "/account/verified": () => ({ component: <EmailConfirmed /> }),
  "/signup": () => ({ component: <Auth type="signup" /> }),
  "/login": () => ({ component: <Auth type="login" /> }),
  "/recover": () => ({ component: <Auth type="recover" /> }),
};

export default rootroutes;
