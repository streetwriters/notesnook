import {createDrawerNavigator} from '@react-navigation/drawer';
import {NavigationContainer} from '@react-navigation/native';
import * as React from 'react';
import {State} from 'react-native-gesture-handler';
import {Menu} from '../components/Menu';
import {useTracked} from '../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../services/EventManager';
import {eCloseSideMenu, eOpenSideMenu} from '../utils/Events';
import {sideMenuRef, tabBarRef} from '../utils/Refs';
import {sleep} from '../utils/TimeUtils';
import {NavigatorStack} from './NavigatorStack';

const menuRef = React.createRef();
const Drawer = createDrawerNavigator();

export const NavigationStack = ({component = NavigatorStack}) => {
  const [state] = useTracked();
  const {deviceMode} = state;
  const [locked, setLocked] = React.useState(false);
  const [initRender, setInitRender] = React.useState(true);

  React.useEffect(() => {
    console.log('rendering drawer');
    sleep(1000).then(() => {
      setInitRender(false);
    });
  }, []);

  const setGestureDisabled = () => {
    //setLocked(true);
  };

  const setGestureEnabled = () => {
    //setLocked(false);
  };

  React.useEffect(() => {
    eSubscribeEvent(eOpenSideMenu, setGestureEnabled);
    eSubscribeEvent(eCloseSideMenu, setGestureDisabled);
    return () => {
      eUnSubscribeEvent(eOpenSideMenu, setGestureEnabled);
      eUnSubscribeEvent(eCloseSideMenu, setGestureDisabled);
    };
  }, []);

  const onStateChange = (state) => {
      let s = state[0];
      if (s && s !== State.ACTIVE && s !== State.BEGAN) {
        let state = sideMenuRef.current.getRootState();
        if (state.history.findIndex((o) => o.type === 'drawer') === -1) {
          tabBarRef.current?.setScrollEnabled(true);
        }
      }
  }

  return (
    <NavigationContainer ref={sideMenuRef}>
      <Drawer.Navigator
        screenOptions={{
          swipeEnabled: locked || deviceMode !== 'mobile' ? false : true,
          gestureEnabled: locked || deviceMode !== 'mobile' ? false : true,
        }}
        onStateChange={onStateChange}
        drawerStyle={{
          width: initRender ? 0 : deviceMode !== 'mobile' ? 0 : '65%',
          height: initRender ? 0 : null,
          borderRightWidth: 0,
        }}
        drawerContentOptions={{}}
        edgeWidth={200}
        drawerType="slide"
        drawerContent={deviceMode !== 'mobile' ? () => <></> : DrawerComponent}
        initialRouteName="Main">
        <Drawer.Screen name="Main" component={component} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
};

const DrawerComponent = () => {
  return <Menu />;
};
