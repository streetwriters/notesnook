import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import * as React from 'react';
import {Animated} from 'react-native';
import Container from '../components/Container';
import {updateEvent} from '../components/DialogManager/recievers';
import {Actions} from '../provider/Actions';
import {eSendEvent} from '../services/EventManager';
import Navigation from '../services/Navigation';
import SettingsService from '../services/SettingsService';
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
  cardStyleInterpolator: forSlide,
  gestureEnabled: true,
};

export const NavigatorStack = React.memo(
  () => {
    React.useEffect(() => {
      sleep(2000).then(() => {
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
      });
    }, []);

    return (
      <Container root={true}>
        <NavigationContainer
          onStateChange={() => {
            updateEvent({type: Actions.SELECTION_MODE, enabled: false});
            updateEvent({type: Actions.CLEAR_SELECTION});
            eSendEvent('navigate');
          }}
          independent={true}
          ref={rootNavigatorRef}>
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
        </NavigationContainer>
      </Container>
    );
  },
  () => true,
);
