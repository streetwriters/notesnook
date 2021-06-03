import React from 'react';
import NoteItem from '.';
import { notesnook } from '../../../e2e/test.ids';
import { useTracked } from '../../provider';
import { Actions } from '../../provider/Actions';
import { DDS } from '../../services/DeviceDetection';
import { eSendEvent, openVault } from '../../services/EventManager';
import { history } from '../../utils';
import { db } from '../../utils/DB';
import { eOnLoadNote, eShowMergeDialog } from '../../utils/Events';
import { tabBarRef } from '../../utils/Refs';
import { simpleDialogEvent } from '../DialogManager/recievers';
import { TEMPLATE_TRASH } from '../DialogManager/Templates';
import SelectionWrapper from '../SelectionWrapper';

export const NoteWrapper = React.memo(({item, index}) => {
  const [state, dispatch] = useTracked();
  const isTrash = item.type === 'trash';

  const onPress = async () => {
    let _note = db.notes.note(item.id).data;
    if (history.selectedItemsList.length > 0 ) {
      dispatch({type: Actions.SELECTED_ITEMS, item: _note});
      return;
    }

    if (_note.conflicted) {
      eSendEvent(eShowMergeDialog, _note);
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
      height={100}
      testID={notesnook.ids.note.get(index)}
      onPress={onPress}
      item={item}>
      <NoteItem
        item={item}
        isTrash={isTrash}
      />
    </SelectionWrapper>
  );
});
