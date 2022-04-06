import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useThemeStore } from '../../stores/theme';
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
      <SettingsStack.Screen name="SettingsGroup" component={Group} />
    </SettingsStack.Navigator>
  );
};

export default Settings;

/**
 * 
 *   
 *  

          <View
            style={{
              height: '100%',
              backgroundColor: colors.bg
            }}
          >
            <ScrollView
              onScroll={e =>
                eSendEvent(eScrollEvent, {
                  y: e.nativeEvent.contentOffset.y,
                  screen: 'Settings'
                })
              }
              testID="scrollview"
              scrollEventThrottle={1}
              style={{
                paddingHorizontal: 0
              }}
            ></ScrollView>
          </View>
 */
