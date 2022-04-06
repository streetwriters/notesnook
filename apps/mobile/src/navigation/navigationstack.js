import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import Container from '../components/container';
import { useThemeStore } from '../stores/theme';
import { useSelectionStore } from '../stores/stores';
import { eSendEvent } from '../services/event-manager';
import Navigation from '../services/navigation';
import { history } from '../utils';
import { hideAllTooltips } from '../utils/hooks/use-tooltip';
import { MMKV } from '../utils/database/mmkv';
import { rootNavigatorRef } from '../utils/global-refs';
import Favorites from '../screens/favorites';
import Notebooks from '../screens/notebooks';
import Home from '../screens/home';
import Notebook from '../screens/notebook';
import Notes from '../screens/notes';
import { Search } from '../screens/search';
import Settings from '../screens/settings';
import Tags from '../screens/tags';
import Trash from '../screens/trash';

const Stack = createNativeStackNavigator();
export const NavigationStack = React.memo(
  () => {
    const colors = useThemeStore(state => state.colors);
    const [render, setRender] = React.useState(false);
    const clearSelection = useSelectionStore(state => state.clearSelection);
    const homepage = React.useRef('Notes');

    const onStateChange = React.useCallback(() => {
      if (history.selectionMode) {
        clearSelection(true);
      }
      hideAllTooltips();
      eSendEvent('navigate');
    });

    React.useEffect(() => {
      (async () => {
        let settings = await MMKV.getItem('appSettings');
        if (settings) {
          settings = JSON.parse(settings);
          homepage.current = settings.homepage;
        }
        setRender(true);
        Navigation.setHeaderState(
          settings.homepage,
          {
            menu: true
          },
          {
            heading: settings.homepage,
            id: settings.homepage.toLowerCase() + '_navigation'
          }
        );
      })();
    }, []);

    return (
      <Container root={true}>
        <NavigationContainer
          onStateChange={onStateChange}
          independent={true}
          ref={rootNavigatorRef}
        >
          {render ? (
            <Stack.Navigator
              initialRouteName={homepage.current}
              screenOptions={{
                headerShown: false,
                gestureEnabled: false,
                animation: 'none',
                contentStyle: {
                  backgroundColor: colors.bg
                }
              }}
            >
              <Stack.Screen name="Notes" component={Home} />
              <Stack.Screen name="Notebooks" component={Notebooks} />
              <Stack.Screen name="Favorites" component={Favorites} />
              <Stack.Screen name="Trash" component={Trash} />
              <Stack.Screen name="NotesPage" component={Notes} />
              <Stack.Screen name="Tags" component={Tags} />
              <Stack.Screen name="Notebook" component={Notebook} />
              <Stack.Screen name="Search" component={Search} />
              <Stack.Screen name="Settings" component={Settings} />
            </Stack.Navigator>
          ) : null}
        </NavigationContainer>
      </Container>
    );
  },
  () => true
);
