import React from 'react';
import NoteItem from '.';
import { notesnook } from '../../../../e2e/test.ids';
import { useEditorStore, useSelectionStore, useTrashStore } from '../../../provider/stores';
import { DDS } from '../../../services/DeviceDetection';
import { eSendEvent, openVault, ToastEvent } from '../../../services/EventManager';
import Navigation from '../../../services/Navigation';
import { history } from '../../../utils';
import { db } from '../../../utils/database';
import { eOnLoadNote, eShowMergeDialog } from '../../../utils/events';
import { tabBarRef } from '../../../utils/global-refs';
import { presentDialog } from '../../dialog/functions';
import SelectionWrapper from '../selection-wrapper';

export const NoteWrapper = React.memo(
  ({ item, index, tags, dateBy }) => {
    const isTrash = item.type === 'trash';
    const setSelectedItem = useSelectionStore(state => state.setSelectedItem);
    const onPress = async () => {
      let _note = item;
      if (!isTrash) {
        _note = db.notes.note(item.id).data;
      }

      if (history.selectedItemsList.length > 0 && history.selectionMode) {
        setSelectedItem(_note);
        return;
      } else {
        history.selectedItemsList = [];
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
          description: 'Unlock note to open it in editor.'
        });
        return;
      }
      if (isTrash) {
        presentDialog({
          title: `Restore ${item.itemType}`,
          paragraph: `Restore or delete ${item.itemType} forever`,
          positiveText: 'Restore',
          negativeText: 'Delete',
          positivePress: async () => {
            await db.trash.restore(item.id);
            Navigation.setRoutesToUpdate([
              Navigation.routeNames.Tags,
              Navigation.routeNames.Notes,
              Navigation.routeNames.Notebooks,
              Navigation.routeNames.NotesPage,
              Navigation.routeNames.Favorites,
              Navigation.routeNames.Trash
            ]);
            useSelectionStore.getState().setSelectionMode(false);
            ToastEvent.show({
              heading: 'Restore successful',
              type: 'success'
            });
          },
          onClose: async () => {
            await db.trash.delete(item.id);
            useTrashStore.getState().setTrash();
            useSelectionStore.getState().setSelectionMode(false);
            ToastEvent.show({
              heading: 'Permanantly deleted items',
              type: 'success',
              context: 'local'
            });
          }
        });
      } else {
        useEditorStore.getState().setReadonly(_note?.readonly);
        eSendEvent(eOnLoadNote, _note);
        if (!DDS.isTab) {
          tabBarRef.current?.goToPage(1);
        }
      }
    };

    return (
      <SelectionWrapper
        index={index}
        height={100}
        testID={notesnook.ids.note.get(index)}
        onPress={onPress}
        item={item}
      >
        <NoteItem item={item} dateBy={dateBy} tags={tags} isTrash={isTrash} />
      </SelectionWrapper>
    );
  },
  (prev, next) => {
    if (prev.dateBy !== next.dateBy) {
      return false;
    }
    if (prev.item?.dateEdited !== next.item?.dateEdited) {
      return false;
    }

    if (JSON.stringify(prev.tags) !== JSON.stringify(next.tags)) {
      return false;
    }

    if (prev.item !== next.item) {
      return false;
    }

    return true;
  }
);
