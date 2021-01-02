import React from "react";
import AccountRecovery from "../views/recovery";
import EmailConfirmed from "../views/emailconfirmed";

const rootroutes = {
  "/accountRecovery": () => <AccountRecovery />,
  "/emailConfirmed": () => <EmailConfirmed />,
};

export default rootroutes;
