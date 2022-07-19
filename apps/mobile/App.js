import React, { useEffect } from 'react';
import RNBootSplash from 'react-native-bootsplash';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Dialog } from './src/components/dialog';
import Launcher from './src/components/launcher';
import { Issue } from './src/components/sheets/github/issue';
import { ApplicationHolder } from './src/navigation';
import Notifications from './src/services/notifications';
import SettingsService from './src/services/settings';
import { TipManager } from './src/services/tip-manager';
import { useUserStore } from './src/stores/use-user-store';
import { useAppEvents } from './src/utils/hooks/use-app-events';

const error =
  stack => `Please let us know what happened. What steps we can take to reproduce the issue here.

_______________________________
Stacktrace: ${stack}`;

class ExceptionHandler extends React.Component {
  state = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }
  componentDidCatch(error, errorInfo) {
    // A custom error logging function
  }

  componentDidMount() {
    RNBootSplash.hide();
  }

  render() {
    return this.state.hasError ? (
      <SafeAreaProvider>
        <SafeAreaView
          style={{
            flex: 1,
            paddingTop: 10
          }}
        >
          <Issue
            defaultBody={error(this.state.error?.stack)}
            defaultTitle={this.state.error?.title || 'Unknown Error'}
            issueTitle="An exception occured"
          />
          <Dialog />
        </SafeAreaView>
      </SafeAreaProvider>
    ) : (
      this.props.children
    );
  }
}

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

const AppWithErrorBoundry = () => {
  return (
    <ExceptionHandler>
      <App />
    </ExceptionHandler>
  );
};

export default AppWithErrorBoundry;
