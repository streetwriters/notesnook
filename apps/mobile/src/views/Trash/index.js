import {useIsFocused} from '@react-navigation/native';
import React, {useEffect} from 'react';
import {simpleDialogEvent} from '../../components/DialogManager/recievers';
import {TEMPLATE_EMPTY_TRASH} from '../../components/DialogManager/templates';
import {TrashPlaceHolder} from '../../components/ListPlaceholders';
import {NotebookItem} from '../../components/NotebookItem';
import NoteItem from '../../components/NoteItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {w} from '../../utils/utils';
import {NoteItemWrapper} from '../../components/SimpleList/NoteItemWrapper';
import {NotebookItemWrapper} from '../../components/SimpleList/NotebookItemWrapper';

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
      placeholder={<TrashPlaceHolder colors={colors} />}
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
