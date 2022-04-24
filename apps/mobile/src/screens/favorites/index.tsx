import React from 'react';
import List from '../../components/list';
import Navigation, { NavigationProps } from '../../services/navigation';
import SearchService from '../../services/search';
import SettingsService from '../../services/settings';
import { useFavoriteStore } from '../../stores/use-favorite-store';
import useNavigationStore from '../../stores/use-navigation-store';
import { useNoteStore } from '../../stores/use-notes-store';
import { db } from '../../utils/database';
import { useNavigationFocus } from '../../utils/hooks/use-navigation-focus';

const prepareSearch = () => {
  SearchService.update({
    placeholder: 'Search in favorites',
    type: 'notes',
    title: 'Favorites',
    get: () => db.notes?.favorites
  });
};

const PLACEHOLDER_DATA = {
  heading: 'Your favorites',
  paragraph: 'You have not added any notes to favorites yet.',
  button: null,
  loading: 'Loading your favorites'
};

export const Favorites = ({ navigation, route }: NavigationProps<'Favorites'>) => {
  const favorites = useFavoriteStore(state => state.favorites);
  const setFavorites = useFavoriteStore(state => state.setFavorites);
  const loading = useNoteStore(state => state.loading);
  const isFocused = useNavigationFocus(navigation, {
    onFocus: prev => {
      Navigation.routeNeedsUpdate(route.name, Navigation.routeUpdateFunctions[route.name]);
      useNavigationStore.getState().update({
        name: route.name
      });
      SearchService.prepareSearch = prepareSearch;
      return !prev?.current;
    },
    onBlur: () => false,
    delay: SettingsService.get().homepage === route.name ? 1 : -1
  });

  return (
    <>
      <List
        listData={favorites}
        type="notes"
        refreshCallback={() => {
          setFavorites();
        }}
        screen="Favorites"
        loading={loading || !isFocused}
        placeholderData={PLACEHOLDER_DATA}
        headerProps={{
          heading: 'Favorites'
        }}
      />
    </>
  );
};

export default Favorites;
