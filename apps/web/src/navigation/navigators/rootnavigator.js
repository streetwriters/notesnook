import {
  Home,
  SettingsContainer,
  Favorites,
  Trash,
  NotebooksContainer,
  TagsContainer
} from "../../views";
import * as Icon from "react-feather";
import {
  createRoute,
  createNormalRoute,
  createColorRoute,
  createDeadRoute
} from "../routes";
import Navigator from "../index";
import { showSignInDialog } from "../../components/dialogs";
import { changeTheme, isDarkTheme } from "../../utils/theme";

/*For color Search*/
const colorRoutes = {
  ...createColorRoute("red", "#ed2d37"),
  ...createColorRoute("orange", "#ec6e05"),
  ...createColorRoute("yellow", "yellow"),
  ...createColorRoute("green", "green"),
  ...createColorRoute("blue", "blue"),
  ...createColorRoute("purple", "purple"),
  ...createColorRoute("gray", "gray")
};

const bottomRoutes = {
  ...createDeadRoute("nightmode", Icon.Moon, {
    onClick: () => changeTheme(),
    bottom: true,
    isToggled: () => isDarkTheme()
  }),
  ...createDeadRoute("signin", Icon.LogIn, {
    onClick: () => showSignInDialog(Icon.LogIn, "Login", ""),
    bottom: true
  }),
  ...createRoute("settings", SettingsContainer, {
    icon: Icon.Settings,
    bottom: true
  })
};

const routes = {
  ...createNormalRoute("home", Home, Icon.Home),
  ...createRoute("notebooks", NotebooksContainer, {
    icon: Icon.Book
  }),
  ...createNormalRoute("favorites", Favorites, Icon.Star),
  ...createNormalRoute("trash", Trash, Icon.Trash2),
  ...createRoute("tags", TagsContainer, { icon: Icon.Tag }),
  ...colorRoutes,
  ...bottomRoutes
};

const RootNavigator = new Navigator("RootNavigator", routes, {
  backButtonEnabled: false
});
export default RootNavigator;
