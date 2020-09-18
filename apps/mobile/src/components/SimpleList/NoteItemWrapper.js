import React, {useMemo} from 'react';
import NoteItem from '../../components/NoteItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent, openVault} from '../../services/eventManager';
import {eShowMergeDialog, eOnLoadNote} from '../../services/events';
import {simpleDialogEvent} from '../DialogManager/recievers';
import {TEMPLATE_TRASH} from '../DialogManager/templates';
import {openEditorAnimation} from '../../utils/animations';
import {DDS} from '../../utils/utils';

export const NoteItemWrapper = ({
  item,
  index,
  isTrash = false,
  pinned = false,
}) => {
  const [state, dispatch] = useTracked();
  const {colors, currentEditingNote, selectionMode} = state;

  const style = useMemo(() => {
    return {width: selectionMode ? '90%' : '100%', marginHorizontal: 0};
  }, [selectionMode]);

  const onLongPress = () => {
    if (!selectionMode) {
      dispatch({type: ACTIONS.SELECTION_MODE, enabled: true});
    }
    dispatch({type: ACTIONS.SELECTED_ITEMS, item: item});
  };

  const onPress = async () => {
    if (item.conflicted) {
      eSendEvent(eShowMergeDialog, item);

      return;
    }
    if (selectionMode) {
      onLongPress();
      return;
    } else if (item.locked) {
      openVault(item, true, true, false, true, false);
      return;
    }
    if (DDS.isTab) {
      eSendEvent(eOnLoadNote, item);
    } else if (isTrash) {
      simpleDialogEvent(TEMPLATE_TRASH(item.type));
    } else {
      eSendEvent(eOnLoadNote, item);
      openEditorAnimation();
    }
  };

  return (
    <SelectionWrapper
      index={index}
      pinned={pinned}
      onLongPress={onLongPress}
      onPress={onPress}
      currentEditingNote={
        currentEditingNote === item.id ? currentEditingNote : null
      }
      item={item}>
      <NoteItem
        colors={colors}
        customStyle={style}
        currentEditingNote={
          currentEditingNote === item.id ? currentEditingNote : null
        }
        selectionMode={selectionMode}
        item={item}
        isTrash={isTrash}
      />
    </SelectionWrapper>
  );
};
