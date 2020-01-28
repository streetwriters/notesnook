import {
  Home,
  SettingsContainer,
  Favorites,
  Trash,
  NotebooksContainer,
  SignIn
} from "../../views";
import * as Icon from "react-feather";
import {
  createRoute,
  createNormalRoute,
  createColorRoute,
  createFeature,
  createNightMode
} from "../routes";
import Navigator from "../index";
import { navButton } from "../navbuttons";
import { askSign } from "../../components/dialogs";
import React from "react";
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

const routes = {
  ...createNormalRoute("home", Home, Icon.Home),
  ...createRoute("notebooks", NotebooksContainer, {
    icon: Icon.Book
  }),
  ...createNormalRoute("favorites", Favorites, Icon.Star),
  ...createNormalRoute("trash", Trash, Icon.Trash2),
  ...createRoute("settings", SettingsContainer, { icon: Icon.Settings }),
  ...navButton(
    "nightmode",
    () => {
      changeTheme();
    },
    Icon.Moon
  ),
  ...colorRoutes,
  ...navButton(
    "signin",
    () => {
      askSign(Icon.LogIn, "Login", "");
    },
    Icon.LogIn
  )
};

const RootNavigator = new Navigator("RootNavigator", routes, {
  backButtonEnabled: false
});
export default RootNavigator;
