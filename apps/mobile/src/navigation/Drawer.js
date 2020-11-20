import {createDrawerNavigator} from '@react-navigation/drawer';
import {NavigationContainer} from '@react-navigation/native';
import * as React from 'react';
import {Menu} from '../components/Menu';
import {DDS} from '../services/DeviceDetection';
import {eSubscribeEvent, eUnSubscribeEvent} from '../services/EventManager';
import {eCloseSideMenu, eOpenSideMenu} from '../utils/Events';
import {sideMenuRef} from '../utils/Refs';
import {NavigatorStack} from './NavigatorStack';

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
          width: DDS.isLargeTablet()
            ? DDS.width * 0.15
            : DDS.isSmallTab
            ? '30%'
            : '65%',
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
  return <Menu />;
};
