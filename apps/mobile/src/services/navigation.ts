import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackActions } from '@react-navigation/native';
import { useFavoriteStore } from '../stores/use-favorite-store';
import useNavigationStore, { CurrentScreen, Route, RouteName } from '../stores/use-navigation-store';
import { useNotebookStore } from '../stores/use-notebook-store';
import { useNoteStore } from '../stores/use-notes-store';
import { useTagStore } from '../stores/use-tag-store';
import { useTrashStore } from '../stores/use-trash-store';
import { eOnNewTopicAdded, refreshNotesPage } from '../utils/events';
import { rootNavigatorRef, tabBarRef } from '../utils/global-refs';
import { ColorType, NotebookType, TagType, TopicType } from '../utils/types';
import { eSendEvent } from './event-manager';
import SettingsService from './settings';

/**
 * Routes that should be updated on focus
 */
let routesUpdateQueue: Route[] = [];

const routeNames = {
  Notes: 'Notes',
  Notebooks: 'Notebooks',
  Notebook: 'Notebook',
  NotesPage: 'NotesPage',
  Tags: 'Tags',
  Favorites: 'Favorites',
  Trash: 'Trash',
  Search: 'Search',
  Settings: 'Settings',
  TaggedNotes: 'TaggedNotes',
  ColoredNotes: 'ColoredNotes',
  TopicNotes: 'TopicNotes',
  Monographs: 'Monographs'
};

type GenericRouteParam = { [name: string]: never };

export type NotebookScreenParams = {
  item: NotebookType;
  title: string;
  canGoBack: boolean;
};

export type NotesScreenParams = {
  item: TopicType | TagType | ColorType;
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
};

export type NavigationProps<T extends RouteName> = BottomTabScreenProps<RouteParams, T>;

/**
 * Functions to update each route when required.
 */
const routeUpdateFunctions: { [name: string]: (...args: any[]) => void } = {
  Notes: useNoteStore.getState().setNotes,
  Notebooks: useNotebookStore.getState().setNotebooks,
  Tags: useTagStore.getState().setTags,
  Favorites: useFavoriteStore.getState().setFavorites,
  Trash: useTrashStore.getState().setTrash,
  Notebook: (params: NotebookScreenParams) => eSendEvent(eOnNewTopicAdded, params),
  NotesPage: (params: NotesScreenParams) => eSendEvent(refreshNotesPage, params),
  TaggedNotes: (params: NotesScreenParams) => eSendEvent('TaggedNotes', params),
  ColoredNotes: (params: NotesScreenParams) => eSendEvent('ColoredNotes', params),
  TopicNotes: (params: NotesScreenParams) => eSendEvent('TopicNotes', params),
  Monographs: (params: NotesScreenParams) => eSendEvent('Monographs', params)
};

function clearRouteFromQueue(routeName: Route) {
  if (routesUpdateQueue.indexOf(routeName) !== -1) {
    routesUpdateQueue = [...new Set(routesUpdateQueue)];
    routesUpdateQueue.splice(routesUpdateQueue.indexOf(routeName), 1);
  }
}

/**
 * Check if a route needs update
 */
function routeNeedsUpdate(routeName: Route, callback: () => void) {
  if (routesUpdateQueue.indexOf(routeName) > -1) {
    clearRouteFromQueue(routeName);
    callback();
  }
}

function queueRoutesForUpdate(...routes: Route[]) {
  const currentScreen = useNavigationStore.getState().currentScreen;
  const routeHistory = rootNavigatorRef.getState().routes;

  // filter out routes that are not rendered to prevent unnecessary updates
  routes = routes.filter(
    //@ts-ignore
    routeName => routeHistory?.findIndex(route => route.name === routeName) > -1
  );

  if (routes.indexOf(currentScreen.name) > -1) {
    routeUpdateFunctions[currentScreen.name]();
    clearRouteFromQueue(currentScreen.name);
    // Remove focused screen from queue
    routes.splice(routes.indexOf(currentScreen.name), 1);
    routesUpdateQueue.splice(routesUpdateQueue.indexOf(currentScreen.name), 1);
  }

  routesUpdateQueue = routesUpdateQueue.concat(routes);
  routesUpdateQueue = [...new Set(routesUpdateQueue)];
}

function navigate<T extends RouteName>(screen: CurrentScreen, params: RouteParams[T]) {
  useNavigationStore.getState().update(screen, params?.canGoBack);
  if (screen.name === 'Notebook') routeUpdateFunctions['Notebook'](params);
  if (screen.name.endsWith('Notes')) routeUpdateFunctions[screen.name](params);
  //@ts-ignore
  rootNavigatorRef.current?.navigate(screen.name, params);
}

function goBack() {
  rootNavigatorRef.current?.goBack();
}

function push(screen: CurrentScreen, params: { [name: string]: any }) {
  useNavigationStore.getState().update(screen, !params.menu);
  //@ts-ignore
  rootNavigatorRef.current?.dispatch(StackActions.push(name, params));
}

function replace(screen: CurrentScreen, params: { [name: string]: any }) {
  useNavigationStore.getState().update(screen, !params.menu);
  //@ts-ignore
  rootNavigatorRef.current?.dispatch(StackActions.replace(name, params));
}

function popToTop() {
  rootNavigatorRef.current?.dispatch(StackActions.popToTop());
  useNavigationStore.getState().update({
    name: SettingsService.get().homepage || 'Notes'
  });
}

function openDrawer() {
  tabBarRef.current?.openDrawer();
}
function closeDrawer() {
  tabBarRef.current?.closeDrawer();
}

const Navigation = {
  navigate,
  goBack,
  push,
  openDrawer,
  closeDrawer,
  replace,
  popToTop,
  queueRoutesForUpdate,
  routeNeedsUpdate,
  routeNames,
  routeUpdateFunctions
};

export default Navigation;
