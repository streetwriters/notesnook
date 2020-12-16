import React, {useCallback, useEffect} from 'react';
import {Placeholder} from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import {eScrollEvent} from '../../utils/Events';
export const Favorites = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  state.favorites.indexOf();
  const favorites = state.favorites;
  const {loading} = state;

  let pageIsLoaded = false;

  const onFocus = useCallback(() => {
    eSendEvent(eScrollEvent, {name: 'Favorites', type: 'in'});
    updateSearch();
    if (DDS.isLargeTablet()) {
      dispatch({
        type: Actions.CONTAINER_BOTTOM_BUTTON,
        state: {
          onPress: null,
        },
      });
    }
    if (!pageIsLoaded) {
      pageIsLoaded = true;
      return;
    }
    Navigation.setHeaderState(
      'favorites',
      {
        menu: true,
      },
      {
        heading: 'Favorites',
        id: 'favorites_navigation',
      },
    );
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      pageIsLoaded = false;
      eSendEvent(eScrollEvent, {name: 'Notebooks', type: 'back'});
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
    });
  };

  return (
    <SimpleList
      data={favorites}
      type="notes"
      refreshCallback={() => {
        dispatch({type: Actions.FAVORITES});
      }}
      loading={loading}
      placeholderData={{
        heading: 'Your Favorites',
        paragraph: 'You have not added any notes to favorites yet.',
        button: null,
      }}
      headerProps={{
        heading: "Favorites",
      }}
      focused={() => navigation.isFocused()}
      placeholder={<Placeholder type="favorites" />}
      placeholderText="Notes you favorite appear here"
    />
  );
};

export default Favorites;
