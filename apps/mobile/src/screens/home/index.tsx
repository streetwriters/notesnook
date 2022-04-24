import React from 'react';
import { FloatingButton } from '../../components/container/floating-button';
import { RightMenus } from '../../components/header/right-menus';
import List from '../../components/list';
import Navigation, { NavigationProps } from '../../services/navigation';
import SearchService from '../../services/search';
import SettingsService from '../../services/settings';
import useNavigationStore from '../../stores/use-navigation-store';
import { useNoteStore } from '../../stores/use-notes-store';
import { db } from '../../utils/database';
import { useNavigationFocus } from '../../utils/hooks/use-navigation-focus';
import { openEditor } from '../notes/common';

const prepareSearch = () => {
  SearchService.update({
    placeholder: 'Type a keyword to search in notes',
    type: 'notes',
    title: 'Notes',
    get: () => db.notes?.all
  });
};

const PLACEHOLDER_DATA = {
  heading: 'Notes',
  paragraph: 'You have not added any notes yet.',
  button: 'Add your first note',
  action: openEditor,
  loading: 'Loading your notes'
};

export const Home = ({ navigation, route }: NavigationProps<'Notes'>) => {
  const notes = useNoteStore(state => state.notes);
  const loading = useNoteStore(state => state.loading);
  const isFocused = useNavigationFocus(navigation, {
    onFocus: prev => {
      Navigation.routeNeedsUpdate(route.name, Navigation.routeUpdateFunctions[route.name]);
      useNavigationStore.getState().update({
        name: route.name
      });
      SearchService.prepareSearch = prepareSearch;
      RightMenus.floatingButtonAction = openEditor;
      return !prev?.current;
    },
    onBlur: () => false,
    delay: SettingsService.get().homepage === route.name ? 1 : -1
  });

  return (
    <>
      <List
        listData={notes}
        type="notes"
        screen="Notes"
        loading={loading || !isFocused}
        headerProps={{
          heading: 'Notes'
        }}
        placeholderData={PLACEHOLDER_DATA}
      />
      {!notes || notes.length === 0 || !isFocused ? null : (
        <FloatingButton title="Create a new note" onPress={openEditor} />
      )}
    </>
  );
};

export default Home;
