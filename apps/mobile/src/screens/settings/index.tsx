import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useThemeStore } from '../../stores/use-theme-store';
import Group from './group';
import Home from './home';

const SettingsStack = createNativeStackNavigator();

export const Settings = () => {
  const colors = useThemeStore(state => state.colors);
  return (
    <SettingsStack.Navigator
      initialRouteName="SettingsHome"
      screenOptions={{
        animation: 'none',
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.bg
        }
      }}
    >
      <SettingsStack.Screen name="SettingsHome" component={Home} />
      <SettingsStack.Screen
        options={{
          animation: 'default'
        }}
        name="SettingsGroup"
        component={Group}
      />
    </SettingsStack.Navigator>
  );
};

export default Settings;
