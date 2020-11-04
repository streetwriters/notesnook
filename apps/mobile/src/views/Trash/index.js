import React, {useCallback, useEffect} from 'react';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import {simpleDialogEvent} from '../../components/DialogManager/recievers';
import {TEMPLATE_EMPTY_TRASH} from '../../components/DialogManager/Templates';
import {Placeholder} from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import {NotebookItemWrapper} from '../../components/SimpleList/NotebookItemWrapper';
import {NoteItemWrapper} from '../../components/SimpleList/NoteItemWrapper';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {eSendEvent} from '../../services/EventManager';
import {eUpdateSearchState} from '../../utils/Events';

export const Trash = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {trash} = state;

  const onFocus = useCallback(() => {
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
      navigation.removeListener('focus', onFocus);
    };
  });

  useEffect(() => {
    if (navigation.isFocused()) {
      updateSearch();
    }
  }, [trash]);

  const updateSearch = () => {
    if (trash.length === 0) {
      eSendEvent('showSearch', true);
    } else {
      eSendEvent(eUpdateSearchState, {
        placeholder: 'Search all trash',
        data: trash,
        noSearch: false,
        type: 'trash',
        color: null,
      });
    }
  };

  const _onPressBottomButton = () => simpleDialogEvent(TEMPLATE_EMPTY_TRASH);

  return (
    <>
      <SimpleList
        data={trash}
        type="trash"
        focused={() => navigation.isFocused()}
        RenderItem={RenderItem}
        placeholder={<Placeholder type="trash" />}
        placeholderText="Deleted notes & notebooks appear here."
      />

      <ContainerBottomButton
        title="Clear all trash"
        onPress={_onPressBottomButton}
      />
    </>
  );
};

export default Trash;

const RenderItem = ({item, index}) => {
  console.log(item.itemType);
  return item.itemType === 'note' ? (
    <NoteItemWrapper item={item} index={index} isTrash={true} />
  ) : (
    <NotebookItemWrapper item={item} index={index} isTrash={true} />
  );
};
