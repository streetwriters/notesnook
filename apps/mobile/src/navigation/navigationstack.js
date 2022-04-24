import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import * as React from 'react';
import Container from '../components/container';
import Favorites from '../screens/favorites';
import Home from '../screens/home';
import Notebook from '../screens/notebook';
import Notebooks from '../screens/notebooks';
import { ColoredNotes } from '../screens/notes/colored';
import { Monographs } from '../screens/notes/monographs';
import { TaggedNotes } from '../screens/notes/tagged';
import { TopicNotes } from '../screens/notes/topic-notes';
import { Search } from '../screens/search';
import Settings from '../screens/settings';
import Tags from '../screens/tags';
import Trash from '../screens/trash';
import { eSendEvent } from '../services/event-manager';
import SettingsService from '../services/settings';
import useNavigationStore from '../stores/use-navigation-store';
import { useSelectionStore } from '../stores/use-selection-store';
import { history } from '../utils';
import { rootNavigatorRef } from '../utils/global-refs';
import { hideAllTooltips } from '../utils/hooks/use-tooltip';
const Tab = createBottomTabNavigator();
const Tabs = React.memo(
  () => {
    const homepage = SettingsService.get().homepage;
    React.useEffect(() => {
      setTimeout(() => {
        useNavigationStore.getState().update({ name: homepage });
      }, 1000);
    }, []);

    return (
      <Tab.Navigator
        tabBar={() => null}
        initialRouteName={homepage}
        backBehavior="history"
        screenOptions={{
          headerShown: false,
          lazy: false
        }}
      >
        <Tab.Screen name="Notes" component={Home} />
        <Tab.Screen name="Notebooks" component={Notebooks} />
        <Tab.Screen name="Favorites" component={Favorites} />
        <Tab.Screen name="Trash" component={Trash} />
        <Tab.Screen name="Tags" component={Tags} />
        <Tab.Screen name="Settings" component={Settings} />
        <Tab.Screen options={{ lazy: true }} name="TaggedNotes" component={TaggedNotes} />
        <Tab.Screen options={{ lazy: true }} name="TopicNotes" component={TopicNotes} />
        <Tab.Screen options={{ lazy: true }} name="ColoredNotes" component={ColoredNotes} />
        <Tab.Screen options={{ lazy: true }} name="Monographs" component={Monographs} />
        <Tab.Screen options={{ lazy: true }} name="Notebook" component={Notebook} />
        <Tab.Screen options={{ lazy: true }} name="Search" component={Search} />
      </Tab.Navigator>
    );
  },
  () => true
);

export const NavigationStack = React.memo(
  () => {
    const clearSelection = useSelectionStore(state => state.clearSelection);

    const onStateChange = React.useCallback(() => {
      if (history.selectionMode) {
        clearSelection(true);
      }
      hideAllTooltips();
      eSendEvent('navigate');
    });

    return (
      <Container root={true}>
        <NavigationContainer onStateChange={onStateChange} ref={rootNavigatorRef}>
          <Tabs />
        </NavigationContainer>
      </Container>
    );
  },
  () => true
);
