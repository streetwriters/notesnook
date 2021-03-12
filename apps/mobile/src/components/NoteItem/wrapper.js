import React, {useEffect, useMemo, useState} from 'react';
import NoteItem from '.';
import SelectionWrapper from '../SelectionWrapper';
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
import {history} from '../../utils';
import {useWindowDimensions} from 'react-native';

export const NoteWrapper = ({item, index, isTrash = false}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [note, setNote] = useState(item);
  const {fontScale} = useWindowDimensions();

  useEffect(() => {
    setNote(item);
  }, [item]);

  const onNoteChange = (data) => {
    if (!data || data.id !== item.id) {
      return;
    }
    if (
      !data.forced &&
      data.title === item.title &&
      data.headline === item.headline
    ) {
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

  const onPress = async () => {
    let _note = db.notes.note(note.id).data;
    setNote(_note);
    if (_note.conflicted) {
      eSendEvent(eShowMergeDialog, _note);
      return;
    }

    if (history.selectedItemsList.length > 0) {
      dispatch({type: Actions.SELECTED_ITEMS, item: _note});
      return;
    }

    if (_note.locked) {
      openVault({
        item: _note,
        novault: true,
        locked: true,
        goToEditor: true,
        title: 'Open note',
        description: 'Unlock note to open it in editor.',
      });
      return;
    }
    if (isTrash) {
      simpleDialogEvent(TEMPLATE_TRASH(_note.type));
    } else {
      eSendEvent(eOnLoadNote, _note);
    }
    if (DDS.isPhone || DDS.isSmallTab) {
      tabBarRef.current?.goToPage(1);
    }
  };

  return (
    <SelectionWrapper
      index={index}
      testID={notesnook.ids.note.get(index)}
      onPress={onPress}
      item={note}>
      <NoteItem
        colors={colors}
        item={note}
        fontScale={fontScale}
        isTrash={isTrash}
      />
    </SelectionWrapper>
  );
};
