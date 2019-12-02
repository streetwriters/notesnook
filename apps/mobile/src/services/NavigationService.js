import {createAppContainer, NavigationActions} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';
import Home from '../views/Home/index';
import Editor from '../views/Editor';
import Reminders from '../views/Reminders';
import Lists from '../views/Lists';
import Folders from '../views/Folders';
import Favorites from '../views/Favorites';
import ListsEditor from '../views/ListsEditor';
import ReminderEditor from '../views/ReminderEditor';
import Login from '../views/Login';
import Signup from '../views/Signup';
import ForgotPassword from '../views/ForgotPassword';
import Settings from '../views/Settings';
import Trash from '../views/Trash';
import Notes from '../views/Notes';

const TopLevelNavigator = createStackNavigator(
  {
    Home: {
      screen: Home,
    },
    Editor: {
      screen: Editor,
    },
    Reminders: {
      screen: Reminders,
    },
    Lists: {
      screen: Lists,
    },
    Folders: {
      screen: Folders,
    },
    Favorites: {
      screen: Favorites,
    },
    ListsEditor: {
      screen: ListsEditor,
    },
    ReminderEditor: {
      screen: ReminderEditor,
    },
    Login: {
      screen: Login,
    },
    Signup: {
      screen: Signup,
    },
    ForgotPassword: {
      screen: ForgotPassword,
    },
    Settings: {
      screen: Settings,
    },
    Trash: {
      screen: Trash,
    },
    Notes: {
      screen: Notes,
    },
  },
  {
    initialRouteName: 'Home',
  },
);

export const AppContainer = createAppContainer(TopLevelNavigator);

let _navigator;

function setTopLevelNavigator(navigatorRef) {
  _navigator = navigatorRef;
}

function navigate(routeName, params) {
  _navigator.dispatch(
    NavigationActions.navigate({
      routeName,
      params,
    }),
  );
}

// add other navigation functions that you need and export them

export default {
  navigate,
  setTopLevelNavigator,
};
