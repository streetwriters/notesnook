import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import * as React from 'react';
import {Animated} from 'react-native';
import Container from '../components/Container';
import {useTracked} from '../provider';
import {DDS} from '../services/DeviceDetection';
import {rootNavigatorRef} from '../utils/Refs';
import Favorites from '../views/Favorites';
import Folders from '../views/Folders';
import Home from '../views/Home';
import Notebook from '../views/Notebook';
import Notes from '../views/Notes';
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

export const NavigatorStack = () => {
  const [state] = useTracked();
  const {settings} = state;

  return (
    <Container root={true}>
      <NavigationContainer independent={true} ref={rootNavigatorRef}>
        <Stack.Navigator
          initialRouteName={settings.homepage}
          screenOptions={{
            headerShown: false,
            cardStyleInterpolator: forFade,
          }}>
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen
            initialParams={{
              title: 'Notebooks',
              canGoBack: false,
              root: true,
            }}
            name="Notebooks"
            component={Folders}
          />
          <Stack.Screen name="Favorites" component={Favorites} />
          <Stack.Screen name="Trash" component={Trash} />
          <Stack.Screen name="Notes" component={Notes} />
          <Stack.Screen name="Tags" component={Tags} />
          <Stack.Screen name="Notebook" component={Notebook} />
          <Stack.Screen name="Settings" component={Settings} />
        </Stack.Navigator>
      </NavigationContainer>
    </Container>
  );
};
