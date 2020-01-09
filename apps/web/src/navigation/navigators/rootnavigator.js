import Home from "../../views/Home";
import Settings from "../../views/Settings";
import Trash from "../../views/Trash";
import Notebooks from "../../views/Notebooks";
import * as Icon from "react-feather";
import Favorites from "../../views/Favorites";
import { createRoute, createNormalRoute, createColorRoute } from "../routes";
import Navigator from "../index";

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
  ...createRoute("notebooks", Notebooks, { icon: Icon.Book }),
  ...createNormalRoute("favorites", Favorites, Icon.Star),
  ...createNormalRoute("trash", Trash, Icon.Trash2),
  ...createNormalRoute("settings", Settings, Icon.Settings),
  ...colorRoutes
};

const RootNavigator = new Navigator("RootNavigator", routes, {
  backButtonEnabled: false
});
export default RootNavigator;
