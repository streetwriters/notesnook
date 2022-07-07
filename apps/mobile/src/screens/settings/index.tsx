import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import DelayLayout from '../../components/delay-layout';
import { Header } from '../../components/header';
import useNavigationStore from '../../stores/use-navigation-store';
import { useThemeStore } from '../../stores/use-theme-store';
import Group from './group';
import Home from './home';
import { RouteParams } from './types';

const SettingsStack = createNativeStackNavigator();
const screenListeners = {
  //@ts-ignore
  beforeRemove: e => {
    if (e.target?.startsWith('SettingsGroup')) {
      useNavigationStore.getState().update({ name: 'Settings' }, false);
    }
  }
};

// const Home = React.lazy(() => import(/* webpackChunkName: "settings-home" */ './home'));
// const Group = React.lazy(() => import(/* webpackChunkName: "settings-group" */ './group'));

const Fallback = () => {
  return (
    <>
      <Header />
      <DelayLayout wait={true} type="settings" />
    </>
  );
};

// const HomeScreen = (props: NativeStackScreenProps<RouteParams, 'SettingsHome'>) => {
//   return (
//     <React.Suspense fallback={<Fallback />}>
//       <Home {...props} />
//     </React.Suspense>
//   );
// };

// const GroupScreen = (props: NativeStackScreenProps<RouteParams, 'SettingsGroup'>) => {
//   return (
//     <React.Suspense fallback={<Fallback />}>
//       <Group {...props} />
//     </React.Suspense>
//   );
// };

export const Settings = () => {
  const colors = useThemeStore(state => state.colors);
  return (
    <SettingsStack.Navigator
      initialRouteName="SettingsHome"
      screenListeners={screenListeners}
      screenOptions={{
        animation: 'none',
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.bg
        }
      }}
    >
      <SettingsStack.Screen name="SettingsHome" component={Home} />
      <SettingsStack.Screen name="SettingsGroup" component={Group} />
    </SettingsStack.Navigator>
  );
};

export default Settings;
