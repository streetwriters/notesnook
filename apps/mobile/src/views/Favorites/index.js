import React, {useCallback, useEffect} from 'react';
import {Placeholder} from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import { InteractionManager } from '../../utils';
import {eScrollEvent} from '../../utils/Events';
export const Favorites = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const favorites = state.favorites;
  const [localLoad, setLocalLoad] = React.useState(true);
  const {loading} = state;
  let pageIsLoaded = false;

  let ranAfterInteractions = false;
 
  const runAfterInteractions = () => {
    InteractionManager.runAfterInteractions(() => {
      if (localLoad) {
        setLocalLoad(false);
      }

      Navigation.routeNeedsUpdate('Favorites',() => {
        dispatch({type:Actions.FAVORITES})
      })

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
      ranAfterInteractions = false;
    });
  };

  const onFocus = useCallback(() => {
    if (!ranAfterInteractions) {
      ranAfterInteractions = true;
      runAfterInteractions();
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
    if (!ranAfterInteractions) {
      ranAfterInteractions = true;
      runAfterInteractions();
    }
    navigation.addListener('focus', onFocus);
    return () => {
      pageIsLoaded = false;
      ranAfterInteractions = false;
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
      title: 'Favorites',
    });
  };

  return (
    <SimpleList
      listData={favorites}
      type="notes"
      refreshCallback={() => {
        dispatch({type: Actions.FAVORITES});
      }}
      loading={loading || localLoad}
      placeholderData={{
        heading: 'Your Favorites',
        paragraph: 'You have not added any notes to favorites yet.',
        button: null,
        loading: 'Loading your favorites',
      }}
      headerProps={{
        heading: 'Favorites',
      }}
      focused={() => navigation.isFocused()}
      placeholder={<Placeholder type="favorites" />}
      placeholderText="Notes you favorite appear here"
    />
  );
};

export default Favorites;
