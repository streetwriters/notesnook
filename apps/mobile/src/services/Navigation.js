import {DrawerActions, StackActions} from '@react-navigation/native';
import {updateEvent} from '../components/DialogManager/recievers';
import {Actions} from '../provider/Actions';
import {eOnNewTopicAdded, refreshNotesPage} from '../utils/Events';
import {rootNavigatorRef, sideMenuRef} from '../utils/Refs';
import {eSendEvent} from './EventManager';
import SettingsService from './SettingsService';

let currentScreen = 'Notes';
let homeLoaded = false;


function getHomeLoaded() {
  return homeLoaded;
}

function setHomeLoaded() {
  homeLoaded(true);
}

let headerState = {
  heading: 'Notes',
  color: null,
  verticalMenu: true,
  currentScreen: 'Notes',
};

const routeNames = {
  Notes: 'Notes',
  Notebooks: 'Notebooks',
  Notebook: 'Notebook',
  NotesPage: 'NotesPage',
  Tags: 'Tags',
  Favorites: 'Favorites',
  Trash: 'Trash',
};

let routesToUpdate = [];

function getCurrentScreen() {
  return currentScreen;
}

function getHeaderState() {
  return headerState;
}

function clearRouteFromUpdates(routeName) {
  if (routesToUpdate.indexOf(routeName) !== -1) {
  routesToUpdate = [...new Set(routesToUpdate)]
  routesToUpdate.splice(routesToUpdate.indexOf(routeName), 1);
  }
}

function routeNeedsUpdate(routeName, callback) {
  if (routesToUpdate.indexOf(routeName) > -1) {
    clearRouteFromUpdates(routeName);
    callback();
  }
}

/**
 * 
 * @param {array} routes 
 */
function setRoutesToUpdate(routes) {

  console.log(currentScreen, "current");
  if (routes.indexOf(currentScreen) > -1) {
    console.log('updating screen', currentScreen);
    if (
      currentScreen === routeNames.NotesPage||
      currentScreen === routeNames.Notebook
    ) {
        console.log(currentScreen ,"CURRENT");
      eSendEvent(
        currentScreen === routeNames.NotesPage
          ? refreshNotesPage
          : eOnNewTopicAdded,
      );
    } else {
      updateEvent({type: Actions[currentScreen.toUpperCase()]});
    }
    clearRouteFromUpdates(currentScreen);
    routes.splice(routes.indexOf(currentScreen), 1);
  }

  routesToUpdate = routesToUpdate.concat(routes);
  routesToUpdate = [...new Set(routesToUpdate)];
}

/**
 * @typedef {Object} screenParams
 * @property {string} heading
 * @property {string} id
 * @property {string} type
 *
 * @param {string} name
 * @param {Object} params
 * @param {screenParams} item
 */

function navigate(name, params, item) {
  currentScreen = name;
  setHeaderState(name, params, item);
  rootNavigatorRef.current?.navigate(name, params);
}

/**
 * @typedef {Object} screenParams
 * @property {string} heading
 * @property {string} id
 * @property {string} type
 *
 * @param {string} name
 * @param {Object} params
 * @param {screenParams} item
 */
function setHeaderState(name, params, item) {
  if (item) {
    headerState = item;
  }
  currentScreen = name;
  headerState.currentScreen = name;
  headerState.verticalMenu = params.menu;

  if (headerState) {
    eSendEvent('onHeaderStateChange', {...headerState});
  }
}

function goBack() {
  rootNavigatorRef.current?.goBack();
}

function push(name, params, item) {
  currentScreen = name;
  setHeaderState(name, params, item);
  rootNavigatorRef.current?.dispatch(StackActions.push(name, params));
}

function replace(name, params, item) {
  currentScreen = name;
  setHeaderState(name, params, item);
  rootNavigatorRef.current?.dispatch(StackActions.replace(name,params));
}

function popToTop() {
  rootNavigatorRef.current?.dispatch(StackActions.popToTop());
  SettingsService.get().homepage;
  setHeaderState(
    SettingsService.get().homepage,
    {
      menu: true,
    },
    {
      heading: SettingsService.get().homepage,
      id: SettingsService.get().homepage.toLocaleLowerCase() + '_navigation',
    },
  );
}

function openDrawer() {
  sideMenuRef.current?.dispatch(DrawerActions.openDrawer());
}
function closeDrawer() {
  sideMenuRef.current?.dispatch(DrawerActions.closeDrawer());
}

export default {
  navigate,
  goBack,
  push,
  openDrawer,
  closeDrawer,
  getCurrentScreen,
  setHeaderState,
  replace,
  popToTop,
  getHeaderState,
  setRoutesToUpdate,
  routeNeedsUpdate,
  routeNames,
  getHomeLoaded,
  setHomeLoaded
};
