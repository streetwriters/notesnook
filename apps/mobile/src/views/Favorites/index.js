import {useIsFocused} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import SimpleList from '../../components/SimpleList';
import {NoteItemWrapper} from '../../components/SimpleList/NoteItemWrapper';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {db, ToastEvent} from '../../utils/utils';
export const Favorites = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {favorites} = state;
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const _onRefresh = async () => {
    setRefreshing(true);
    try {
      await db.sync();

      dispatch({type: ACTIONS.FAVORITES});
      dispatch({type: ACTIONS.USER});
      setRefreshing(false);
      ToastEvent.show('Sync Complete', 'success');
    } catch (e) {
      setRefreshing(false);
      ToastEvent.show('Sync failed, network error', 'error');
    }
  };

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.HEADER_STATE,
        state: {
          type: 'notes',
          menu: true,
          canGoBack: false,
          route: route,
          color: null,
          navigation: navigation,
        },
      });
      dispatch({
        type: ACTIONS.CONTAINER_BOTTOM_BUTTON,
        state: {
          visible: false,
        },
      });
      dispatch({
        type: ACTIONS.HEADER_VERTICAL_MENU,
        state: false,
      });

      dispatch({
        type: ACTIONS.HEADER_TEXT_STATE,
        state: {
          heading: 'Favorites',
        },
      });

      dispatch({
        type: ACTIONS.CURRENT_SCREEN,
        screen: 'favorites',
      });
      dispatch({type: ACTIONS.FAVORITES});
    }
  }, [isFocused]);

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.SEARCH_STATE,
        state: {
          placeholder: 'Search all favorites',
          data: favorites,
          noSearch: false,
          type: 'notes',
          color: null,
        },
      });
    }
  }, [favorites, isFocused]);

  return (
    <SimpleList
      data={favorites}
      type="notes"
      refreshing={refreshing}
      focused={isFocused}
      onRefresh={_onRefresh}
      RenderItem={NoteItemWrapper}
      placeholder={<></>}
      placeholderText="Notes you favorite appear here"
    />
  );
};

export default Favorites;
