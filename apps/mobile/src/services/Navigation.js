import {DrawerActions, StackActions} from '@react-navigation/native';
import {rootNavigatorRef, sideMenuRef} from '../utils/Refs';

function navigate(name, params) {
  rootNavigatorRef.current?.navigate(name, params);
}
function goBack() {
  rootNavigatorRef.current?.goBack();
}

function push(...args) {
  rootNavigatorRef.current?.dispatch(StackActions.push(...args));
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
};
