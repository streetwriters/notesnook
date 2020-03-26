import {
  Home,
  SettingsContainer,
  Trash,
  NotebooksContainer,
  TagsContainer,
  Notes,
  Account
} from "../../views";
import * as Icon from "../../components/icons";
import { createRoute, createNormalRoute, createDeadRoute } from "../routes";
import Navigator from "../index";
import { changeTheme } from "../../utils/theme";
import SelectionModeOptions from "../../common/selectionoptions";
import Search from "../../views/Search";
import { store as noteStore } from "../../stores/note-store";
import { store as userStore } from "../../stores/user-store";
import { showLogInDialog } from "../../components/dialogs/logindialog";

export const bottomRoutes = {
  ...createDeadRoute("nightmode", Icon.Theme, {
    onClick: () => changeTheme()
  }),
  ...createDeadRoute("sync", Icon.Sync, {
    onClick: async () => userStore.getState().sync(),
    animatable: true
  }),
  ...createNormalRoute("account", Account, Icon.User, {
    onClick: async () => {
      if (!userStore.getState().isLoggedIn) {
        await showLogInDialog();
      }
      RootNavigator.navigate("account");
    }
  }),
  ...createRoute("settings", SettingsContainer, {
    icon: Icon.Settings
  })
};

export const routes = {
  ...createNormalRoute("home", Home, Icon.Home, {
    title: "Home",
    options: SelectionModeOptions.NotesOptions
  }),
  ...createRoute("notebooks", NotebooksContainer, {
    icon: Icon.Notebook
  }),
  ...createNormalRoute("favorites", Notes, Icon.StarOutline, {
    title: "Favorites",
    options: SelectionModeOptions.FavoritesOptions,
    onClick: () => {
      noteStore.getState().setSelectedContext({
        type: "favorites"
      });
      RootNavigator.navigate("favorites");
    }
  }),
  ...createNormalRoute("trash", Trash, Icon.Trash, {
    title: "Trash",
    options: SelectionModeOptions.TrashOptions
  }),
  ...createRoute("tags", TagsContainer, {
    icon: Icon.Tag
  })
};

const invisibleRoutes = {
  ...createRoute("color", Notes, {
    icon: Icon.Circle,
    options: SelectionModeOptions.NotesOptions
  }),
  ...createRoute("search", Search, { title: "Search" })
};

const RootNavigator = new Navigator(
  "RootNavigator",
  { ...routes, ...bottomRoutes, ...invisibleRoutes },
  {
    backButtonEnabled: false
  }
);

export default RootNavigator;
