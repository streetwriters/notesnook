import {
  Home,
  SettingsContainer,
  Favorites,
  Trash,
  NotebooksContainer,
  Notes,
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
import { showLogInDialog } from "../../components/dialogs/logindialog";
import { changeTheme, isDarkTheme } from "../../utils/theme";
import { db } from "../../common";

/*For color Search*/
const colorRoutes = {
  ...createColorRoute("Red", Notes, "#ed2d37", {
    onClick: () => {
      onClickMethod("Red", "red");
    }
  }),
  ...createColorRoute("Orange", Notes, "#ec6e05", {
    onClick: () => {
      onClickMethod("Orange", "orange");
    }
  }),
  ...createColorRoute("Yellow", Notes, "yellow", {
    onClick: () => {
      onClickMethod("Yellow", "yellow");
    }
  }),
  ...createColorRoute("Green", Notes, "green", {
    onClick: () => {
      onClickMethod("Green", "green");
    }
  }),
  ...createColorRoute("Blue", Notes, "blue", {
    onClick: () => {
      onClickMethod("Blue", "blue");
    }
  }),
  ...createColorRoute("Purple", Notes, "purple", {
    onClick: () => {
      onClickMethod("Purple", "purple");
    }
  }),
  ...createColorRoute("Gray", Notes, "gray", {
    onClick: () => {
      onClickMethod("Gray", "gray");
    }
  })
};

function onClickMethod(Title, label) {
  RootNavigator.navigate(Title, {
    notes: db.notes.colored(label),
    context: { colors: [label] }
  });
}

const bottomRoutes = {
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
