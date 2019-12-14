import {
  createAppContainer,
  NavigationActions,
  StackActions,
} from 'react-navigation';
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
import Tags from '../views/Tags';
import Notebook from '../views/Notebook';
import AccountSettings from '../views/AccountSettings';

const fade = props => {
  const {position, scene} = props;

  const index = scene.index;

  const translateX = 0;
  const translateY = 0;

  const opacity = position.interpolate({
    inputRange: [index - 0.7, index, index + 0.7],
    outputRange: [0.3, 1, 0.3],
  });

  return {
    opacity,
    transform: [{translateX}, {translateY}],
  };
};

const TopLevelNavigator = createStackNavigator(
  {
    Home: {
      screen: Home,
    },
    Editor: {
      screen: Editor,
      navigationOptions: {
        gesturesEnabled: false,
      },
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
    Tags: {
      screen: Tags,
    },
    Notebook: {
      screen: Notebook,
    },

    AccountSettings: {
      screen: AccountSettings,
    },
  },
  {
    initialRouteName: 'Home',
    defaultNavigationOptions: {
      gesturesEnabled: false,
      headerStyle: {
        backgroundColor: 'transparent',
        borderBottomWidth: 0,
        height: 0,
      },
    },
    transitionConfig: () => ({
      screenInterpolator: props => {
        return fade(props);
      },
    }),
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

function push(routeName, params) {
  _navigator.dispatch(
    StackActions.push({
      routeName,
      params,
    }),
  );
}

function goBack() {
  _navigator.dispatch(NavigationActions.back());
}

// add other navigation functions that you need and export them

export default {
  navigate,
  push,
  goBack,
  setTopLevelNavigator,
};
