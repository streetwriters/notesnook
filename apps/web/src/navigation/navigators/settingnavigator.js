import {
  Settings,
  Account,
  General,
  TOS,
  About,
  PrivacyPolicy
} from "../../views";
import Navigator from "../index";
import { createRoute } from "../routes";

const routes = {
  ...createRoute("settings", Settings, { title: "Settings" }),
  ...createRoute("account", Account),
  ...createRoute("general", General),
  ...createRoute("TOS", TOS),
  ...createRoute("about", About),
  ...createRoute("privacy", PrivacyPolicy)
};
const SettingsNavigator = new Navigator("SettingsNavigator", routes, {
  backButtonEnabled: true
});
export default SettingsNavigator;
