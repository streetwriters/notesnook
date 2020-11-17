import React, {useCallback, useEffect} from 'react';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import {simpleDialogEvent} from '../../components/DialogManager/recievers';
import {TEMPLATE_EMPTY_TRASH} from '../../components/DialogManager/Templates';
import {Placeholder} from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import { eSendEvent } from '../../services/EventManager';
import SearchService from '../../services/SearchService';
import { eScrollEvent } from '../../utils/Events';

export const Trash = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {trash} = state;

  const onFocus = useCallback(() => {
    eSendEvent(eScrollEvent, {name:'Trash', type: 'in'});
    dispatch({
      type: Actions.HEADER_STATE,
      state: true,
    });
    dispatch({
      type: Actions.HEADER_TEXT_STATE,
      state: {
        heading: 'Trash',
      },
    });

    updateSearch();
    dispatch({
      type: Actions.TRASH,
    });
    dispatch({
      type: Actions.CURRENT_SCREEN,
      screen: 'trash',
    });
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      eSendEvent(eScrollEvent, {name:'Trash', type: 'back'});
      navigation.removeListener('focus', onFocus);
    };
  },[]);

  useEffect(() => {
    if (navigation.isFocused()) {
      updateSearch();
    }
  }, [trash]);

  const updateSearch = () => {
    SearchService.update({
      placeholder: 'Search in trash',
      data: trash,
      type: 'notes',
    });
  };

  const _onPressBottomButton = () => simpleDialogEvent(TEMPLATE_EMPTY_TRASH);

  return (
    <>
      <SimpleList
        data={trash}
        type="trash"
        focused={() => navigation.isFocused()}
        placeholderData={{
          heading: 'Your Favorites',
          paragraph: 'You have not added any notes to favorites yet.',
          button: null,
        }}
        placeholder={<Placeholder type="trash" />}
        placeholderText="Deleted notes & notebooks appear here."
      />

      {trash && trash.length !== 0 && (
        <ContainerBottomButton
          title="Clear all trash"
          onPress={_onPressBottomButton}
        />
      )}
    </>
  );
};

export default Trash;
