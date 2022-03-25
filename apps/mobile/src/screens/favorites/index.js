import React, { useCallback, useEffect } from 'react';
import { ContainerHeader } from '../../components/container/containerheader';
import { Header } from '../../components/header';
import { Placeholder } from '../../components/ui/svg';
import SelectionHeader from '../../components/selection-header';
import List from '../../components/list';
import { useFavoriteStore, useNoteStore } from '../../stores/stores';
import Navigation from '../../services/navigation';
import SearchService from '../../services/search';
import { InteractionManager } from '../../utils';
import { db } from '../../utils/database';

export const Favorites = ({ navigation }) => {
  const favorites = useFavoriteStore(state => state.favorites);
  const setFavorites = useFavoriteStore(state => state.setFavorites);
  const loading = useNoteStore(state => state.loading);

  let pageIsLoaded = false;
  let ranAfterInteractions = false;

  const runAfterInteractions = () => {
    InteractionManager.runAfterInteractions(() => {
      Navigation.routeNeedsUpdate('Favorites', () => {
        setFavorites();
      });
    });
    updateSearch();
    ranAfterInteractions = false;
  };

  const onFocus = useCallback(() => {
    if (!pageIsLoaded) {
      pageIsLoaded = true;
      return;
    }

    if (!ranAfterInteractions) {
      ranAfterInteractions = true;
      runAfterInteractions();
    }

    Navigation.setHeaderState(
      'Favorites',
      {
        menu: true
      },
      {
        heading: 'Favorites',
        id: 'favorites_navigation'
      }
    );
  }, []);

  useEffect(() => {
    if (!ranAfterInteractions) {
      ranAfterInteractions = true;
      runAfterInteractions();
    }
    navigation.addListener('focus', onFocus);
    return () => {
      pageIsLoaded = false;
      ranAfterInteractions = false;
      navigation.removeListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    if (navigation.isFocused()) {
      updateSearch();
    }
  }, [favorites]);

  const updateSearch = () => {
    SearchService.update({
      placeholder: 'Search in favorites',
      data: favorites,
      type: 'notes',
      title: 'Favorites',
      get: () => db.notes.favorites
    });
  };

  return (
    <>
      <SelectionHeader screen="Favorites" />
      <ContainerHeader>
        <Header title="Favorites" isBack={false} screen="Favorites" />
      </ContainerHeader>
      <List
        listData={favorites}
        type="notes"
        refreshCallback={() => {
          setFavorites();
        }}
        screen="Favorites"
        loading={loading}
        placeholderData={{
          heading: 'Your favorites',
          paragraph: 'You have not added any notes to favorites yet.',
          button: null,
          loading: 'Loading your favorites'
        }}
        headerProps={{
          heading: 'Favorites'
        }}
        focused={() => navigation.isFocused()}
        placeholderText="Notes you favorite appear here"
      />
    </>
  );
};

export default Favorites;
