import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import * as React from 'react';
import {Animated} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import Container from '../components/Container';
import {updateEvent} from '../components/DialogManager/recievers';
import {useTracked} from '../provider';
import {Actions} from '../provider/Actions';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../services/EventManager';
import Navigation from '../services/Navigation';
import SettingsService from '../services/SettingsService';
import {editing, history} from '../utils';
import {eOpenSideMenu} from '../utils/Events';
import {rootNavigatorRef} from '../utils/Refs';
import {sleep} from '../utils/TimeUtils';
import Favorites from '../views/Favorites';
import Folders from '../views/Folders';
import Home from '../views/Home';
import Notebook from '../views/Notebook';
import Notes from '../views/Notes';
import {Search} from '../views/Search';
import Settings from '../views/Settings';
import Tags from '../views/Tags';
import Trash from '../views/Trash';

const Stack = createStackNavigator();

const forFade = ({current}) => ({
  cardStyle: {
    opacity: current.progress,
  },
});

const forSlide = ({current, next, inverted, layouts: {screen}}) => {
  const progress = Animated.add(
    current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
    next
      ? next.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        })
      : 0,
  );

  return {
    cardStyle: {
      transform: [
        {
          translateX: Animated.multiply(
            progress.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [
                screen.width, // Focused, but offscreen in the beginning
                0, // Fully focused
                screen.width * -0.3, // Fully unfocused
              ],
              extrapolate: 'clamp',
            }),
            inverted,
          ),
        },
      ],
    },
  };
};

const screenOptionsForAnimation = {
  animationEnabled: true,
  cardStyleInterpolator: forFade,
  gestureEnabled: true,
};

export const NavigatorStack = React.memo(
  () => {
    const [, dispatch] = useTracked();
    const [render, setRender] = React.useState(false);
    const onStateChange = React.useCallback(() => {
      if (history.selectionMode) {
        dispatch({type: Actions.SELECTION_MODE, enabled: false});
        dispatch({type: Actions.CLEAR_SELECTION});
      }
      eSendEvent('navigate');
    });

    const updateRender = async () => {
      if (!render) {
        setRender(true);
        Navigation.setHeaderState(
          SettingsService.get().homepage,
          {
            menu: true,
          },
          {
            heading: SettingsService.get().homepage,
            id: SettingsService.get().homepage.toLowerCase() + '_navigation',
          },
        );
      }
    };

    React.useEffect(() => {
      eSubscribeEvent(eOpenSideMenu, updateRender);
      return () => {
        eUnSubscribeEvent(eOpenSideMenu, updateRender);
      };
    }, [render]);

    return (
      <Container root={true}>
        <NavigationContainer
          onStateChange={onStateChange}
          independent={true}
          ref={rootNavigatorRef}>
          {render && (
            <Stack.Navigator
              initialRouteName={SettingsService.get().homepage}
              screenOptions={{
                headerShown: false,
                animationEnabled: false,
                gestureEnabled: false,
              }}>
              <Stack.Screen name="Notes" component={Home} />
              <Stack.Screen name="Notebooks" component={Folders} />
              <Stack.Screen name="Favorites" component={Favorites} />
              <Stack.Screen name="Trash" component={Trash} />
              <Stack.Screen
                options={screenOptionsForAnimation}
                name="NotesPage"
                component={Notes}
              />
              <Stack.Screen name="Tags" component={Tags} />
              <Stack.Screen
                options={screenOptionsForAnimation}
                name="Notebook"
                component={Notebook}
              />
              <Stack.Screen name="Settings" component={Settings} />
              <Stack.Screen
                options={screenOptionsForAnimation}
                name="Search"
                component={Search}
              />
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </Container>
    );
  },
  () => true,
);
