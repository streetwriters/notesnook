import { Home, Trash, Notes, Account } from "../../views";
import * as Icon from "../../components/icons";
import {
  createRoute,
  createNavigatorRoute,
  createNormalRoute,
  createDeadRoute,
} from "../routes";
import Navigator from "../index";
import SelectionModeOptions from "../../common/selectionoptions";
import Search from "../../views/Search";
import { store as userStore } from "../../stores/user-store";
import { store as themeStore } from "../../stores/theme-store";
import { showLogInDialog } from "../../components/dialogs/logindialog";
import { NotebookNavigator, TagNavigator, SettingsNavigator } from "./index";

export const bottomRoutes = {
  ...createDeadRoute("nightmode", Icon.Theme, {
    title: "Night mode",
    onClick: () => themeStore.toggleNightMode(),
  }),
  ...createDeadRoute("sync", Icon.Sync, {
    title: "Sync",
    onClick: async () => userStore.sync(),
    animatable: true,
  }),
  ...createNormalRoute("account", Account, Icon.User, {
    title: "Account",
    onClick: async () => {
      if (!userStore.get().isLoggedIn) {
        await showLogInDialog();
        return false;
      } else return RootNavigator.navigate("account");
    },
  }),
  ...createNavigatorRoute(
    "settings",
    Icon.Settings,
    "Settings",
    SettingsNavigator
  ),
};

export const routes = {
  ...createNormalRoute("home", Home, Icon.Home, {
    title: "Home",
    options: SelectionModeOptions.NotesOptions,
  }),
  ...createNavigatorRoute(
    "notebooks",
    Icon.Notebook,
    "Notebooks",
    NotebookNavigator
  ),
  ...createRoute(
    "favorites",
    Notes,
    {
      icon: Icon.StarOutline,
      title: "Favorites",
      options: SelectionModeOptions.FavoritesOptions,
    },
    {
      context: { type: "favorites" },
    }
  ),
  ...createNormalRoute("trash", Trash, Icon.Trash, {
    title: "Trash",
    options: SelectionModeOptions.TrashOptions,
  }),
  ...createNavigatorRoute("tags", Icon.Tag, "Tags", TagNavigator),
};

const invisibleRoutes = {
  ...createRoute("color", Notes, {
    icon: Icon.Circle,
    options: SelectionModeOptions.NotesOptions,
  }),
  ...createRoute("search", Search, { title: "Search" }),
};

const RootNavigator = new Navigator(
  "RootNavigator",
  { ...routes, ...bottomRoutes, ...invisibleRoutes },
  {
    backButtonEnabled: false,
    default: "home",
    persist: true,
  }
);

export default RootNavigator;
