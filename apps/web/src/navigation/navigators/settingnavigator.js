import { Settings, Account, General, TOS } from "../../views";
import Navigator from "../index";
import { createRoute } from "../routes";

const routes = {
  ...createRoute("settings", Settings, { title: "Settings" }),
  ...createRoute("account", Account, { title: "Account" }),
  ...createRoute("general", General),
  ...createRoute("TOS", TOS),
  ...createRoute("about", TOS),
  ...createRoute("privacy", TOS)
};
const SettingsNavigator = new Navigator("SettingsNavigator", routes, {
  backButtonEnabled: true
});
export default SettingsNavigator;
