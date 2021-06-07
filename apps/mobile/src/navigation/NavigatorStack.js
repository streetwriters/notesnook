import { NavigationContainer } from '@react-navigation/native';
import * as React from 'react';
import { createNativeStackNavigator } from 'react-native-screens/native-stack';
import Container from '../components/Container';
import { useSelectionStore } from '../provider/stores';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../services/EventManager';
import Navigation from '../services/Navigation';
import SettingsService from '../services/SettingsService';
import { history } from '../utils';
import { eOpenSideMenu } from '../utils/Events';
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

const forFade = ({current}) => ({
  cardStyle: {
    opacity: current.progress,
  },
});

const screenOptionsForAnimation = {
  animationEnabled: true,
  cardStyleInterpolator: forFade,
  gestureEnabled: true,
};

export const NavigatorStack = React.memo(
  () => {
    const [render, setRender] = React.useState(true);
    const clearSelection = useSelectionStore(state => state.clearSelection);
    const onStateChange = React.useCallback(() => {
      if (history.selectionMode) {
        clearSelection();
      }
      eSendEvent('navigate');
    });

    const updateRender = async () => {
      if (!render) {
        setRender(true);
        Navigation.setHeaderState(
          SettingsService.get().homepage,
          {
            menu: true,
          },
          {
            heading: SettingsService.get().homepage,
            id: SettingsService.get().homepage.toLowerCase() + '_navigation',
          },
        );
      }
    };

    React.useEffect(() => {
      eSubscribeEvent(eOpenSideMenu, updateRender);
      return () => {
        eUnSubscribeEvent(eOpenSideMenu, updateRender);
      };
    }, [render]);

    return (
      <Container root={true}>
        <NavigationContainer
          onStateChange={onStateChange}
          independent={true}
          ref={rootNavigatorRef}>
          {render && (
            <Stack.Navigator
              initialRouteName={SettingsService.get().homepage}
              screenOptions={{
                headerShown: false,
                gestureEnabled: false,
                stackAnimation: 'fade',
              }}>
              <Stack.Screen name="Notes" component={Home} />
              <Stack.Screen name="Notebooks" component={Folders} />
              <Stack.Screen name="Favorites" component={Favorites} />
              <Stack.Screen name="Trash" component={Trash} />
              <Stack.Screen
                options={screenOptionsForAnimation}
                name="NotesPage"
                component={Notes}
              />
              <Stack.Screen name="Tags" component={Tags} />
              <Stack.Screen
                options={screenOptionsForAnimation}
                name="Notebook"
                component={Notebook}
              />
              <Stack.Screen name="Settings" component={Settings} />
              <Stack.Screen
                options={screenOptionsForAnimation}
                name="Search"
                component={Search}
              />
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </Container>
    );
  },
  () => true,
);
