
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import * as React from 'react';
import Container from '../components/Container';
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

export const NavigatorStack = () => {
  return (
    <Container root={true}>
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
              root: true,
            }}
            name="Folders"
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



