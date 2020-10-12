import React, {useCallback, useEffect, useState} from 'react';
import {Placeholder} from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import {NoteItemWrapper} from '../../components/SimpleList/NoteItemWrapper';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
export const Favorites = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {favorites} = state;
  const [refreshing, setRefreshing] = useState(false);

  const onFocus = useCallback(() => {
    dispatch({
      type: ACTIONS.HEADER_STATE,
      state: {
        type: 'notes',
        menu: true,
        canGoBack: false,
        color: null,
      },
    });

    dispatch({
      type: ACTIONS.HEADER_TEXT_STATE,
      state: {
        heading: 'Favorites',
      },
    });
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

    dispatch({
      type: ACTIONS.CURRENT_SCREEN,
      screen: 'favorites',
    });
    dispatch({type: ACTIONS.FAVORITES});
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      navigation.removeListener('focus', onFocus);
    };
  });

  useEffect(() => {
    if (navigation.isFocused()) {
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
  }, [favorites]);

  return (
    <SimpleList
      data={favorites}
      type="notes"
      refreshCallback={() => {
        dispatch({type: ACTIONS.FAVORITES});
      }}
      refreshing={refreshing}
      focused={() => navigation.isFocused()}
      RenderItem={NoteItemWrapper}
      placeholder={<Placeholder type="favorites" />}
      placeholderText="Notes you favorite appear here"
    />
  );
};

export default Favorites;
