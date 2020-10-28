import React, {useCallback, useEffect, useState} from 'react';
import {Placeholder} from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import {NoteItemWrapper} from '../../components/SimpleList/NoteItemWrapper';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {eSendEvent} from "../../services/EventManager";
import {eUpdateSearchState} from "../../utils/Events";
export const Favorites = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {favorites} = state;

  const onFocus = useCallback(() => {
    dispatch({
      type: Actions.HEADER_STATE,
      state: {
        menu: true,
      },
    });
    dispatch({
      type: Actions.HEADER_TEXT_STATE,
      state: {
        heading: "Favorites",
      },
    });
    eSendEvent(eUpdateSearchState,{
      placeholder: 'Search all favorites',
      data: favorites,
      noSearch: false,
      type: 'notes',
      color: null,
    })

    dispatch({
      type: Actions.CURRENT_SCREEN,
      screen: 'favorites',
    });
    dispatch({type: Actions.FAVORITES});
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      navigation.removeListener('focus', onFocus);
    };
  });

  useEffect(() => {
    if (navigation.isFocused()) {

      eSendEvent(eUpdateSearchState,{
        placeholder: 'Search all favorites',
        data: favorites,
        noSearch: false,
        type: 'notes',
        color: null,
      })
    }
  }, [favorites]);

  return (
    <SimpleList
      data={favorites}
      type="notes"
      refreshCallback={() => {
        dispatch({type: Actions.FAVORITES});
      }}
      focused={() => navigation.isFocused()}
      RenderItem={NoteItemWrapper}
      placeholder={<Placeholder type="favorites" />}
      placeholderText="Notes you favorite appear here"
    />
  );
};

export default Favorites;
