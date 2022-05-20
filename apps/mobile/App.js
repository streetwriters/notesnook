import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Launcher from './src/components/launcher';
import { ApplicationHolder } from './src/navigation';
import Notifications from './src/services/notifications';
import SettingsService from './src/services/settings';
import { TipManager } from './src/services/tip-manager';
import { useUserStore } from './src/stores/use-user-store';
import { useAppEvents } from './src/utils/hooks/use-app-events';

SettingsService.init();
SettingsService.checkOrientation();
const App = () => {
  useAppEvents();
  useEffect(() => {
    let { appLockMode } = SettingsService.get();
    if (appLockMode && appLockMode !== 'none') {
      useUserStore.getState().setVerifyUser(true);
    }
    setTimeout(() => {
      console.log('run later');
      SettingsService.onFirstLaunch();
      Notifications.get();
      TipManager.init();
    }, 100);
  }, []);

  return (
    <GestureHandlerRootView
      style={{
        flex: 1
      }}
    >
      <SafeAreaProvider>
        <ApplicationHolder />
        <Launcher />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
