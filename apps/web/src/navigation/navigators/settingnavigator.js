import { Settings, Account } from "../../views";
import Navigator from "../index";
import { createRoute } from "../routes";

const routes = {
  ...createRoute("settings", Settings, { title: "Settings" }),
  ...createRoute("account", Account, { title: "Account" })
};

const SettingsNavigator = new Navigator("SettingsNavigator", routes, {
  backButtonEnabled: true
});

export default SettingsNavigator;
