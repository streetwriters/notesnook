import Clipboard from '@react-native-clipboard/clipboard';
import React, { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Launcher from './src/components/launcher';
import { Button } from './src/components/ui/button';
import Paragraph from './src/components/ui/typography/paragraph';
import { ApplicationHolder } from './src/navigation';
import Notifications from './src/services/notifications';
import SettingsService from './src/services/settings';
import { TipManager } from './src/services/tip-manager';
import { useUserStore } from './src/stores/use-user-store';
import { useAppEvents } from './src/utils/hooks/use-app-events';

class MyErrorBoundary extends React.Component {
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
  render() {
    return this.state.hasError ? (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 50
        }}
      >
        <ScrollView
          style={{
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
            borderColor: 'red'
          }}
        >
          <Paragraph
            style={{
              color: 'red'
            }}
            selectable={true}
          >
            {this.state.error.stack}
          </Paragraph>
        </ScrollView>
        <Button
          title="Copy Error"
          type="error"
          style={{
            marginTop: 20,
            width: '100%'
          }}
          onPress={() => {
            Clipboard.setString(this.state.error.stack);
            alert('Error copied');
          }}
        />
      </View>
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
      console.log('run later');
      SettingsService.onFirstLaunch();
      Notifications.get();
      TipManager.init();
    }, 100);
  }, []);

  return (
    <MyErrorBoundary>
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
    </MyErrorBoundary>
  );
};

export default App;
