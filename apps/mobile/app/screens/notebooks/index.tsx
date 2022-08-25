import React from 'react';
import { db } from '../../common/database';
import { FloatingButton } from '../../components/container/floating-button';
import DelayLayout from '../../components/delay-layout';
import { AddNotebookEvent } from '../../components/dialog-provider/recievers';
import List from '../../components/list';
import { Walkthrough } from '../../components/walkthroughs';
import { useNavigationFocus } from '../../hooks/use-navigation-focus';
import Navigation, { NavigationProps } from '../../services/navigation';
import SearchService from '../../services/search';
import SettingsService from '../../services/settings';
import useNavigationStore from '../../stores/use-navigation-store';
import { useNotebookStore } from '../../stores/use-notebook-store';

const onPressFloatingButton = () => {
  AddNotebookEvent();
};

const prepareSearch = () => {
  SearchService.update({
    placeholder: 'Type a keyword to search in notebooks',
    type: 'notebooks',
    title: 'Notebooks',
    get: () => db.notebooks?.all
  });
};

const PLACEHOLDER_DATA = {
  heading: 'Your notebooks',
  paragraph: 'You have not added any notebooks yet.',
  button: 'Add your first notebook',
  action: onPressFloatingButton,
  loading: 'Loading your notebooks'
};

export const Notebooks = ({ navigation, route }: NavigationProps<'Notebooks'>) => {
  const notebooks = useNotebookStore(state => state.notebooks);
  const isFocused = useNavigationFocus(navigation, {
    onFocus: prev => {
      Navigation.routeNeedsUpdate(route.name, Navigation.routeUpdateFunctions[route.name]);
      useNavigationStore.getState().update({
        name: route.name
      });
      SearchService.prepareSearch = prepareSearch;
      useNavigationStore.getState().setButtonAction(onPressFloatingButton);

      if (notebooks.length === 0) {
        Walkthrough.present('notebooks');
      } else {
        Walkthrough.update('notebooks');
      }

      return !prev?.current;
    },
    onBlur: () => false,
    delay: SettingsService.get().homepage === route.name ? 1 : -1
  });

  return (
    <DelayLayout>
      <List
        listData={notebooks}
        type="notebooks"
        screen="Notebooks"
        loading={!isFocused}
        placeholderData={PLACEHOLDER_DATA}
        headerProps={{
          heading: 'Notebooks'
        }}
      />

      {!notebooks || notebooks.length === 0 || !isFocused ? null : (
        <FloatingButton title="Create a new notebook" onPress={onPressFloatingButton} />
      )}
    </DelayLayout>
  );
};

export default Notebooks;
