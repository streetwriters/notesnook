import {
  Home,
  SettingsContainer,
  Favorites,
  Trash,
  NotebooksContainer
} from "../../views";
import * as Icon from "react-feather";
import {
  createRoute,
  createNormalRoute,
  createColorRoute,
  createDeadRoute,
  makeBottomRoute
} from "../routes";
import Navigator from "../index";
import { showSignInDialog } from "../../components/dialogs";
import { changeTheme } from "../../utils/theme";

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
  ...makeBottomRoute(
    createDeadRoute("nightmode", Icon.Moon, () => {
      changeTheme();
    })
  ),
  ...makeBottomRoute(
    createDeadRoute("signin", Icon.LogIn, () => {
      showSignInDialog(Icon.LogIn, "Login", "");
    })
  ),
  ...makeBottomRoute(
    createRoute("settings", SettingsContainer, { icon: Icon.Settings })
  )
};

const routes = {
  ...createNormalRoute("home", Home, Icon.Home),
  ...createRoute("notebooks", NotebooksContainer, {
    icon: Icon.Book
  }),
  ...createNormalRoute("favorites", Favorites, Icon.Star),
  ...createNormalRoute("trash", Trash, Icon.Trash2),
  ...colorRoutes,
  ...bottomRoutes
};

const RootNavigator = new Navigator("RootNavigator", routes, {
  backButtonEnabled: false
});
export default RootNavigator;
