import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import * as React from 'react';
import Favorites from '../views/Favorites';
import Folders from '../views/Folders';
import Home from '../views/Home/index';
import Login from '../views/Login';
import Notebook from '../views/Notebook';
import Notes from '../views/Notes';
import Settings from '../views/Settings';
import Signup from '../views/Signup';
import Tags from '../views/Tags';
import Trash from '../views/Trash';
import {rootNavigatorRef} from '../utils/refs';

const Stack = createStackNavigator();

export const NavigationStack = () => {
  return (
    <NavigationContainer independent={true} ref={rootNavigatorRef}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animationEnabled: false,
          gestureEnabled: false,
          cardOverlayEnabled: false,
          cardShadowEnabled: false,
        }}>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen
          initialParams={{
            title: 'Notebooks',
            canGoBack: false,
          }}
          name="Folders"
          component={Folders}
        />
        <Stack.Screen name="Favorites" component={Favorites} />
        <Stack.Screen name="Trash" component={Trash} />
        <Stack.Screen name="Notes" component={Notes} />
        <Stack.Screen name="Tags" component={Tags} />
        <Stack.Screen name="Notebook" component={Notebook} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Settings" component={Settings} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
