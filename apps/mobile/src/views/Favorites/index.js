import React, { useCallback, useEffect } from 'react';
import { ContainerTopSection } from '../../components/Container/ContainerTopSection';
import { Header } from '../../components/Header';
import { Placeholder } from '../../components/ListPlaceholders';
import SelectionHeader from '../../components/SelectionHeader';
import SimpleList from '../../components/SimpleList';
import { useTracked } from '../../provider';
import { Actions } from '../../provider/Actions';
import { useFavoriteStore, useNoteStore } from '../../provider/stores';
import { DDS } from '../../services/DeviceDetection';
import { eSendEvent } from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import { InteractionManager } from '../../utils';
import { eScrollEvent } from '../../utils/Events';

export const Favorites = ({ route, navigation }) => {
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
      title: 'Favorites'
    });
  };

  return (
    <>
      <SelectionHeader screen="Favorites" />
      <ContainerTopSection>
        <Header title="Favorites" isBack={false} screen="Favorites" />
      </ContainerTopSection>
      <SimpleList
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
        placeholder={<Placeholder type="favorites" />}
        placeholderText="Notes you favorite appear here"
      />
    </>
  );
};

export default Favorites;
