import React from "react";
import AccountRecovery from "../views/recovery";
import EmailConfirmed from "../views/emailconfirmed";

const rootroutes = {
  "/account/recovery": () => <AccountRecovery />,
  "/account/verified": () => <EmailConfirmed />,
};

export default rootroutes;
