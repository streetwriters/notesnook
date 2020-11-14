import React, { useCallback, useEffect } from 'react';
import { Placeholder } from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import { useTracked } from '../../provider';
import { Actions } from '../../provider/Actions';
import { eSendEvent } from "../../services/EventManager";
import SearchService from '../../services/SearchService';
import { eScrollEvent } from "../../utils/Events";
export const Favorites = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {favorites} = state;

  const onFocus = useCallback(() => {
    eSendEvent(eScrollEvent, {name: 'Favorites', type: 'in'});
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
    updateSearch();

    dispatch({
      type: Actions.CURRENT_SCREEN,
      screen: 'favorites',
    });
    dispatch({type: Actions.FAVORITES});
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      eSendEvent(eScrollEvent, {name: 'Notebooks', type: 'back'});
      navigation.removeListener('focus', onFocus);
    };
  });



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
      placeholderData={{
        heading:"Your Favorites",
        paragraph:"You have not added any notes to favorites yet.",
        button:null,
      }}
      focused={() => navigation.isFocused()}
      placeholder={<Placeholder type="favorites" />}
      placeholderText="Notes you favorite appear here"
    />
  );
};

export default Favorites;
