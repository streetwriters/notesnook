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
import SelectionModeOptions from "../../common/selectionoptions";

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
  ...createNormalRoute("home", Home, Icon.Home, {
    title: "Home",
    options: SelectionModeOptions.NotesOptions
  }),
  ...createRoute("notebooks", NotebooksContainer, {
    icon: Icon.Book,
    options: SelectionModeOptions.NotebooksOptions
  }),
  ...createNormalRoute("favorites", Favorites, Icon.Star, {
    title: "Favorites",
    options: SelectionModeOptions.FavoritesOptions
  }),
  ...createNormalRoute("trash", Trash, Icon.Trash, {
    title: "Trash",
    options: SelectionModeOptions.TrashOptions
  }),
  ...createRoute("tags", TagsContainer, {
    icon: Icon.Tag,
    options: SelectionModeOptions.NotesOptions
  })
};

const invisibleRoutes = {
  ...createNormalRoute("color", Notes, Icon.Circle, {
    options: SelectionModeOptions.NotesOptions
  })
};

const RootNavigator = new Navigator(
  "RootNavigator",
  { ...routes, ...bottomRoutes, ...invisibleRoutes },
  {
    backButtonEnabled: false
  }
);
export default RootNavigator;
