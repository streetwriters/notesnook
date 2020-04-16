import Editor from '../views/Editor';
import Favorites from '../views/Favorites';
import Folders from '../views/Folders';
import ForgotPassword from '../views/ForgotPassword';
import Home from '../views/Home/index';
import Lists from '../views/Lists';
import ListsEditor from '../views/ListsEditor';
import Login from '../views/Login';
import Notebook from '../views/Notebook';
import Notes from '../views/Notes';
import ReminderEditor from '../views/ReminderEditor';
import Reminders from '../views/Reminders';
import Settings from '../views/Settings';
import Signup from '../views/Signup';
import Tags from '../views/Tags';
import Trash from '../views/Trash';
import { createStackNavigator } from 'react-navigation-stack';

const fade = props => {
  const { position, scene } = props;

  const index = scene.index;

  const translateX = 0;
  const translateY = 0;

  const opacity = position.interpolate({
    inputRange: [index - 0.7, index, index + 0.7],
    outputRange: [0.7, 1, 0.7],
  });

  return {
    opacity,
    transform: [{ translateX }, { translateY }],
  };
};


export const TopLevelNavigator = createStackNavigator(
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
    cardOverlayEnabled: true,
    cardShadowEnabled: true,
    animationEnabled: false,
  },
);