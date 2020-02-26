import {
  Home,
  SettingsContainer,
  Favorites,
  Trash,
  NotebooksContainer,
  TagsContainer,
  Notes
} from "../../views";
import * as Icon from "react-feather";
import { createRoute, createNormalRoute, createDeadRoute } from "../routes";
import Navigator from "../index";
import { showLogInDialog } from "../../components/dialogs/logindialog";
import { changeTheme, isDarkTheme } from "../../utils/theme";

export const bottomRoutes = {
  ...createDeadRoute("nightmode", Icon.Moon, {
    onClick: () => changeTheme(),
    bottom: true,
    isToggled: () => isDarkTheme()
  }),
  ...createDeadRoute("signin", Icon.LogIn, {
    onClick: () => showLogInDialog(),
    bottom: true
  }),
  ...createRoute("settings", SettingsContainer, {
    icon: Icon.Settings,
    bottom: true
  })
};

export const routes = {
  ...createNormalRoute("home", Home, Icon.Home, { title: "Home" }),
  ...createRoute("notebooks", NotebooksContainer, {
    icon: Icon.Book
  }),
  ...createNormalRoute("favorites", Favorites, Icon.Star, {
    title: "Favorites"
  }),
  ...createNormalRoute("trash", Trash, Icon.Trash, { title: "Trash" }),
  ...createRoute("tags", TagsContainer, { icon: Icon.Tag })
};

const invisibleRoutes = {
  ...createNormalRoute("color", Notes, Icon.Circle)
};

const RootNavigator = new Navigator(
  "RootNavigator",
  { ...routes, ...invisibleRoutes },
  {
    backButtonEnabled: false
  }
);
export default RootNavigator;
