import create, { State } from "zustand";
import { COLORS_NOTE } from "../utils/color-scheme";
import {
  ColorType,
  MonographType,
  NotebookType,
  TagType,
  TopicType
} from "../utils/types";
import { ColorKey } from "./use-theme-store";

export type GenericRouteParam = { [name: string]: unknown };

export type NotebookScreenParams = {
  item: NotebookType;
  title: string;
  canGoBack: boolean;
};

export type NotesScreenParams = {
  item: TopicType | TagType | ColorType | MonographType;
  title: string;
  canGoBack: boolean;
};

export type AppLockRouteParams = {
  welcome: boolean;
  canGoBack: boolean;
};

export type AuthParams = {
  mode: number;
  title: string;
  canGoBack: boolean;
};

export type RouteParams = {
  Notes: GenericRouteParam;
  Notebooks: GenericRouteParam;
  Notebook: NotebookScreenParams;
  NotesPage: NotesScreenParams;
  Tags: GenericRouteParam;
  Favorites: GenericRouteParam;
  Trash: GenericRouteParam;
  Search: GenericRouteParam;
  Settings: GenericRouteParam;
  TaggedNotes: NotesScreenParams;
  ColoredNotes: NotesScreenParams;
  TopicNotes: NotesScreenParams;
  Monographs: NotesScreenParams;
  AppLock: AppLockRouteParams;
  Auth: AuthParams;
};

export type RouteName = keyof RouteParams;

export type CurrentScreen = {
  name: RouteName;
  id?: string;
  title?: string;
  type?: string;
  color?: string | null;
  alias?: string;
  notebookId?: string;
};

export type HeaderRightButton = {
  title: string;
  onPress: () => void;
};

interface NavigationStore extends State {
  currentScreen: CurrentScreen;
  currentScreenRaw: CurrentScreen;
  canGoBack: boolean | undefined;
  update: (
    currentScreen: CurrentScreen,
    canGoBack?: boolean,
    headerRightButtons?: HeaderRightButton[]
  ) => void;
  headerRightButtons?: HeaderRightButton[];
  buttonAction: () => void;
  setButtonAction: (buttonAction: () => void) => void;
}

const useNavigationStore = create<NavigationStore>((set, get) => ({
  currentScreen: {
    name: "Notes",
    id: "notes_navigation",
    title: "Notes",
    type: "notes"
  },
  currentScreenRaw: { name: "Notes" },
  canGoBack: false,
  update: (currentScreen, canGoBack, headerRightButtons) => {
    const color =
      COLORS_NOTE[
        currentScreen.color?.toLowerCase() as keyof typeof COLORS_NOTE
      ];
    if (
      JSON.stringify(currentScreen) === JSON.stringify(get().currentScreenRaw)
    )
      return;

    set({
      currentScreen: {
        name: currentScreen.name,
        id:
          currentScreen.id || currentScreen.name.toLowerCase() + "_navigation",
        title: currentScreen.alias || currentScreen.title || currentScreen.name,
        type: currentScreen.type,
        color: color,
        notebookId: currentScreen.notebookId
      },
      currentScreenRaw: currentScreen,
      canGoBack,
      headerRightButtons: headerRightButtons
    });
  },
  headerRightButtons: [],
  buttonAction: () => null,
  setButtonAction: (buttonAction) => set({ buttonAction })
}));

export default useNavigationStore;
