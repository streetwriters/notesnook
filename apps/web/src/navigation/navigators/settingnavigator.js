import { Settings, Account, General } from "../../views";
import Navigator from "../index";
import { createRoute } from "../routes";

const routes = {
  ...createRoute("settings", Settings, { title: "Settings" }),
  ...createRoute("account", Account),
  ...createRoute("general", General)
};
const SettingsNavigator = new Navigator("SettingsNavigator", routes, {
  backButtonEnabled: true
});
export default SettingsNavigator;
