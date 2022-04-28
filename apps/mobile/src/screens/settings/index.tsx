import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import useNavigationStore from '../../stores/use-navigation-store';
import { useThemeStore } from '../../stores/use-theme-store';
import Group from './group';
import Home from './home';

const SettingsStack = createNativeStackNavigator();
const screenListeners = {
  //@ts-ignore
  beforeRemove: e => {
    if (e.target?.startsWith('SettingsGroup')) {
      useNavigationStore.getState().update({ name: 'Settings' }, false);
    }
  }
};

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
