import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import Container from '../components/Container';
import { useTracked } from '../provider';
import { useSelectionStore } from '../provider/stores';
import { eSendEvent } from '../services/EventManager';
import Navigation from '../services/Navigation';
import { history } from '../utils';
import { MMKV } from '../utils/mmkv';
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
    const [state, dispatch] = useTracked();
    const { colors } = state;
    const [render, setRender] = React.useState(false);
    const clearSelection = useSelectionStore(state => state.clearSelection);
    const homepage = React.useRef('Notes');

    const onStateChange = React.useCallback(() => {
      if (history.selectionMode) {
        clearSelection(true);
      }
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
  () => true
);
