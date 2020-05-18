import { useIsFocused } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { simpleDialogEvent } from '../../components/DialogManager/recievers';
import { TEMPLATE_EMPTY_TRASH } from '../../components/DialogManager/templates';
import { Placeholder } from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import { NotebookItemWrapper } from '../../components/SimpleList/NotebookItemWrapper';
import { NoteItemWrapper } from '../../components/SimpleList/NoteItemWrapper';
import { useTracked } from '../../provider';
import { ACTIONS } from '../../provider/actions';

export const Trash = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, trash} = state;

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.HEADER_STATE,
        state: {
          type: 'trash',
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
          bottomButtonText: 'Clear all trash',
          bottomButtonOnPress: () => simpleDialogEvent(TEMPLATE_EMPTY_TRASH),
          color: null,
          visible: true,
        },
      });
      dispatch({
        type: ACTIONS.HEADER_VERTICAL_MENU,
        state: false,
      });

      dispatch({
        type: ACTIONS.HEADER_TEXT_STATE,
        state: {
          heading: 'Trash',
        },
      });

      dispatch({
        type: ACTIONS.TRASH,
      });

      dispatch({
        type: ACTIONS.CURRENT_SCREEN,
        screen: 'trash',
      });
    }
  }, [isFocused]);

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.SEARCH_STATE,
        state: {
          placeholder: 'Search all trash',
          data: trash,
          noSearch: false,
          type: 'trash',
          color: null,
        },
      });
    }
  }, [trash, isFocused]);

  return (
    <SimpleList
      data={trash}
      type="trash"
      focused={isFocused}
      RenderItem={RenderItem}
      placeholder={<Placeholder type="trash" />}
      placeholderText="Deleted notes & notebooks appear here."
    />
  );
};

export default Trash;

const RenderItem = ({item, index}) => {
  return item.type === 'note' ? (
    <NoteItemWrapper item={item} index={index} isTrash={true} />
  ) : (
    <NotebookItemWrapper item={item} index={index} isTrash={true} />
  );
};
