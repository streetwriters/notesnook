import { StackActions } from '@react-navigation/routers';
import { rootNavigatorRef } from '../utils/refs';

function navigate(name, params) {
  rootNavigatorRef .current?.navigate(name, params);
}
function goBack() {
   rootNavigatorRef.current?.goBack();
}

function push(...args) {
  rootNavigatorRef.current?.dispatch(StackActions.push(...args));
}

export default {
  navigate,
  goBack,
  push,
};