import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import Container from '../components/Container';
import { useSelectionStore, useSettingStore } from '../provider/stores';
import { eSendEvent } from '../services/EventManager';
import Navigation from '../services/Navigation';
import { history } from '../utils';
import { rootNavigatorRef } from '../utils/Refs';
import Favorites from '../views/Favorites';
import Folders from '../views/Folders';
import Home from '../views/Home';
import Notebook from '../views/Notebook';
import Notes from '../views/Notes';
import { Search } from '../views/Search';
import Settings from '../views/Settings';
import Tags from '../views/Tags';
import Trash from '../views/Trash';

const Stack = createNativeStackNavigator();

export const NavigatorStack = React.memo(
  () => {
    const [render, setRender] = React.useState(false);
    const clearSelection = useSelectionStore(state => state.clearSelection);
    const settings = useSettingStore(state => state.settings);
    const onStateChange = React.useCallback(() => {
      if (history.selectionMode) {
        clearSelection();
      }
      eSendEvent('navigate');
    });

    React.useEffect(() => {
      if (!render) {
        setRender(true);
        Navigation.setHeaderState(
          settings.homepage,
          {
            menu: true,
          },
          {
            heading: settings.homepage,
            id: settings.homepage.toLowerCase() + '_navigation',
          },
        );
      }
    }, [settings]);

    return (
      <Container root={true}>
        <NavigationContainer
          onStateChange={onStateChange}
          independent={true}
          ref={rootNavigatorRef}>
          {render ? (
            <Stack.Navigator
              initialRouteName={settings.homepage}
              screenOptions={{
                headerShown: false,
                gestureEnabled: false,
                animation:"none"
              }}>
              <Stack.Screen name="Notes" component={Home} />
              <Stack.Screen name="Notebooks" component={Folders} />
              <Stack.Screen name="Favorites" component={Favorites} />
              <Stack.Screen name="Trash" component={Trash} />
              <Stack.Screen name="NotesPage" component={Notes} />
              <Stack.Screen name="Tags" component={Tags} />
              <Stack.Screen name="Notebook" component={Notebook} />
              <Stack.Screen name="Settings" component={Settings} />
              <Stack.Screen name="Search" component={Search} />
            </Stack.Navigator>
          ) : null}
        </NavigationContainer>
      </Container>
    );
  },
  () => true,
);
