import create, { State } from 'zustand';
import { COLORS_NOTE } from '../utils/color-scheme';
import { LiteralUnion } from '../utils/types';

export type RouteName =
  | 'Notes'
  | 'Notebooks'
  | 'Notebook'
  | 'NotesPage'
  | 'Tags'
  | 'Favorites'
  | 'Trash'
  | 'Search'
  | 'Settings'
  | 'TaggedNotes'
  | 'ColoredNotes'
  | 'TopicNotes'
  | 'Monographs';

export type Route = LiteralUnion<RouteName>;

export type CurrentScreen = {
  name: Route;
  id?: string;
  title?: string;
  type?: string;
  color?: null;
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
}

const useNavigationStore = create<NavigationStore>((set, get) => ({
  currentScreen: {
    name: 'Notes',
    id: 'notes_navigation',
    title: 'Notes',
    type: 'notes'
  },
  currentScreenRaw: { name: 'notes' },
  canGoBack: false,
  update: (currentScreen, canGoBack, headerRightButtons) => {
    //@ts-ignore
    const color = COLORS_NOTE[currentScreen.color?.toLowerCase()];
    if (JSON.stringify(currentScreen) === JSON.stringify(get().currentScreenRaw)) return;

    set({
      currentScreen: {
        name: currentScreen.name,
        id: currentScreen.id || currentScreen.name.toLowerCase() + '_navigation',
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
  headerRightButtons: []
}));

export default useNavigationStore;
