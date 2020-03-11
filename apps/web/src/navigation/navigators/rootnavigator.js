import {
  Home,
  SettingsContainer,
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
import Search from "../../views/Search";
import { store } from "../../stores/note-store";

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
  ...createNormalRoute("favorites", Notes, Icon.Star, {
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
    icon: Icon.Tag,
    options: SelectionModeOptions.NotesOptions
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
