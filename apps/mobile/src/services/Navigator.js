import {createDrawerNavigator} from '@react-navigation/drawer';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import * as React from 'react';
import Container from '../components/Container';
import {Menu} from '../components/Menu';
import {rootNavigatorRef, sideMenuRef} from '../utils/refs';
import Favorites from '../views/Favorites';
import Folders from '../views/Folders';
import Home from '../views/Home/index';
import Notebook from '../views/Notebook';
import Notes from '../views/Notes';
import Settings from '../views/Settings';
import Tags from '../views/Tags';
import Trash from '../views/Trash';
import {eSubscribeEvent, eUnSubscribeEvent} from './eventManager';
import {eCloseSideMenu, eOpenSideMenu} from './events';
import NavigationService from './NavigationService';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

export const MainComponent = () => {
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

const DrawerComponent = (props) => {
  return (
    <Menu
      menuProps={props}
      hide={false}
      close={() => NavigationService.closeDrawer()}
    />
  );
};

export const NavigationStack = ({component = MainComponent}) => {
  const [locked, setLocked] = React.useState(false);

  const setGestureDisabled = () => {
    setLocked(true);
  };

  const setGestureEnabled = () => {
    setLocked(false);
  };

  React.useEffect(() => {
    eSubscribeEvent(eOpenSideMenu, setGestureEnabled);
    eSubscribeEvent(eCloseSideMenu, setGestureDisabled);
    return () => {
      eUnSubscribeEvent(eOpenSideMenu, setGestureEnabled);
      eUnSubscribeEvent(eCloseSideMenu, setGestureDisabled);
    };
  }, []);

  return (
    <NavigationContainer ref={sideMenuRef}>
      <Drawer.Navigator
        screenOptions={{
          swipeEnabled: locked ? false : true,
        }}
        edgeWidth={200}
        drawerType="slide"
        drawerContent={DrawerComponent}
        initialRouteName="Main">
        <Drawer.Screen name="Main" component={component} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
};
