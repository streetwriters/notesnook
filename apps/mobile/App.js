import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Launcher from './src/components/launcher';
import { ApplicationHolder } from './src/navigation';
import Notifications from './src/services/notifications';
import SettingsService from './src/services/settings';
import { TipManager } from './src/services/tip-manager';
import { useUserStore } from './src/stores/stores';
import { useAppEvents } from './src/utils/hooks/use-app-events';

SettingsService.checkOrientation();
const App = () => {
  useAppEvents();

  useEffect(() => {
    (async () => {
      try {
        await SettingsService.init();
        let appLockMode = SettingsService.get().appLockMode;
        if (appLockMode && appLockMode !== 'none') {
          useUserStore.getState().setVerifyUser(true);
        }
        await TipManager.init();
        Notifications.get();
        await SettingsService.onFirstLaunch();
      } catch (e) {}
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <ApplicationHolder />
      <Launcher />
    </SafeAreaProvider>
  );
};

export default App;
