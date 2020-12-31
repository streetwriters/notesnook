import {DrawerActions, StackActions} from '@react-navigation/native';
import {InteractionManager} from 'react-native';
import {updateEvent} from '../components/DialogManager/recievers';
import {Actions} from '../provider/Actions';
import {rootNavigatorRef, sideMenuRef} from '../utils/Refs';
import {eSendEvent} from './EventManager';
import SettingsService from './SettingsService';

let currentScreen = null;

function getCurrentScreen() {
  return currentScreen;
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
  currentScreen = name;
  if (item) {
    updateEvent({
      type: Actions.HEADER_TEXT_STATE,
      state: item,
    });
    eSendEvent('onHeaderStateChange', item);
  }

  if (name) {
    updateEvent({
      type: Actions.CURRENT_SCREEN,
      screen: name.toLowerCase(),
    });
  }
  if (params) {
    updateEvent({
      type: Actions.HEADER_STATE,
      state: params.menu,
    });
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

function replace(...args) {
  rootNavigatorRef.current?.dispatch(StackActions.replace(...args));
}

function popToTop() {
  rootNavigatorRef.current?.dispatch(StackActions.popToTop());
  SettingsService.get().homepage;
  setHeaderState(
    SettingsService.get().homepage.toLowerCase(),
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
};
