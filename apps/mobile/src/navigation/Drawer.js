import * as React from 'react';
import {eSubscribeEvent, eUnSubscribeEvent} from '../services/EventManager';
import {eCloseSideMenu, eOpenSideMenu} from '../utils/Events';
import {NavigationContainer} from '@react-navigation/native';
import {sideMenuRef} from '../utils/Refs';
import {Dimensions} from 'react-native';
import {NavigatorStack} from './NavigatorStack';
import {Menu} from '../components/Menu';
import NavigationService from '../services/Navigation';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {DDS} from '../services/DeviceDetection';

const Drawer = createDrawerNavigator();

export const NavigationStack = ({component = NavigatorStack}) => {
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
        drawerStyle={{
          width:
            DDS.isTab && !DDS.isSmallTab
              ? Dimensions.get('window').width * 0.05
              : DDS.isSmallTab
              ? '40%'
              : Dimensions.get('window').width * 0.65,
          borderRightWidth: 0,
        }}
        edgeWidth={200}
        drawerType={DDS.isTab || DDS.isSmallTab ? 'permanent' : 'slide'}
        drawerContent={DrawerComponent}
        initialRouteName="Main">
        <Drawer.Screen name="Main" component={component} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
};



const DrawerComponent = () => {
  return (
    <Menu/>
  );
};
