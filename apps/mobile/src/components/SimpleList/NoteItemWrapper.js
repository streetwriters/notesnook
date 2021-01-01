import React, {useEffect, useMemo, useState} from 'react';
import NoteItem from '../../components/NoteItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  openVault,
} from '../../services/EventManager';
import {eShowMergeDialog, eOnLoadNote, eOnNoteEdited} from '../../utils/Events';
import {simpleDialogEvent} from '../DialogManager/recievers';
import {TEMPLATE_TRASH} from '../DialogManager/Templates';
import {db} from '../../utils/DB';
import {DDS} from '../../services/DeviceDetection';
import {tabBarRef} from '../../utils/Refs';
import {notesnook} from '../../../e2e/test.ids';

export const NoteItemWrapper = ({item, index, isTrash = false}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode} = state;
  const [note, setNote] = useState(item);

  useEffect(() => {
    setNote(item);
  }, [item]);

  const onNoteChange = (data) => {
    if (!data || data.id !== item.id || data.closed) {
      return;
    }
    let _note = db.notes.note(item.id).data;
    setNote(_note);
  };

  useEffect(() => {
    eSubscribeEvent(eOnNoteEdited, onNoteChange);
    return () => {
      eUnSubscribeEvent(eOnNoteEdited, onNoteChange);
    };
  }, [note]);

  const style = useMemo(() => {
    return {width: selectionMode ? '90%' : '100%', marginHorizontal: 0};
  }, [selectionMode]);

  const onLongPress = () => {
    if (!selectionMode) {
      dispatch({type: Actions.SELECTION_MODE, enabled: true});
    }
    dispatch({type: Actions.SELECTED_ITEMS, item: note});
  };

  const onPress = async () => {
    if (note.conflicted) {
      eSendEvent(eShowMergeDialog, note);
      return;
    }

    if (selectionMode) {
      onLongPress();
      return;
    } else if (note.locked) {
      openVault({
        item: item,
        novault: true,
        locked: true,
        goToEditor: true,
      });
      return;
    }
    if (isTrash) {
      simpleDialogEvent(TEMPLATE_TRASH(note.type));
    } else {
      eSendEvent(eOnLoadNote, note);
    }
    if (DDS.isPhone || DDS.isSmallTab) {
      tabBarRef.current?.goToPage(1);
    }
  };

  return (
    <SelectionWrapper
      index={index}
      testID={notesnook.ids.note.get(index)}
      onLongPress={onLongPress}
      onPress={onPress}
      item={note}>
      <NoteItem
        colors={colors}
        customStyle={style}
        selectionMode={selectionMode}
        item={note}
        isTrash={isTrash}
      />
    </SelectionWrapper>
  );
};
