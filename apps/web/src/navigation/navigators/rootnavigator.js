import {
  Home,
  SettingsContainer,
  Trash,
  NotebooksContainer,
  TagsContainer,
  Notes
} from "../../views";
import * as Icon from "../../components/icons";
import { createRoute, createNormalRoute, createDeadRoute } from "../routes";
import Navigator from "../index";
import { showLogInDialog } from "../../components/dialogs/logindialog";
import { changeTheme, isDarkTheme } from "../../utils/theme";
import SelectionModeOptions from "../../common/selectionoptions";
import Search from "../../views/Search";
import { store } from "../../stores/note-store";

export const bottomRoutes = {
  ...createDeadRoute("nightmode", Icon.Theme, {
    onClick: () => changeTheme(),
    bottom: true,
    isToggled: () => isDarkTheme()
  }),
  ...createDeadRoute("signin", Icon.Login, {
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
    icon: Icon.Notebook
  }),
  ...createNormalRoute("favorites", Notes, Icon.StarOutline, {
    title: "Favorites",
    options: SelectionModeOptions.FavoritesOptions,
    onClick: () => {
      store.getState().setSelectedContext({
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
