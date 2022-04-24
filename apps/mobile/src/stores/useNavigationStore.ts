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
  canGoBack: false,
  update: (currentScreen, canGoBack, headerRightButtons) => {
    //@ts-ignore
    const color = COLORS_NOTE[currentScreen.title?.toLowerCase()];
    if (
      currentScreen.name === get().currentScreen.name &&
      !currentScreen.id &&
      get().currentScreen.id?.endsWith('_navigation')
    )
      return;

    if (
      currentScreen.name === get().currentScreen.name &&
      currentScreen.id === get().currentScreen.id
    )
      return;
    console.log('UPDATING STATE', currentScreen.name, canGoBack);
    set({
      currentScreen: {
        name: currentScreen.name,
        id: currentScreen.id || currentScreen.name.toLowerCase() + '_navigation',
        title: currentScreen.alias || currentScreen.title || currentScreen.name,
        type: currentScreen.type,
        color: color,
        notebookId: currentScreen.notebookId
      },
      canGoBack,
      headerRightButtons: headerRightButtons
    });
  },
  headerRightButtons: []
}));

export default useNavigationStore;
