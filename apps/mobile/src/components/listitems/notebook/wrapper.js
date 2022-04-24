import React from 'react';
import { NotebookItem } from '.';
import Notebook from '../../../screens/notebook';
import { TopicNotes } from '../../../screens/notes/topic-notes';
import { ToastEvent } from '../../../services/event-manager';
import Navigation from '../../../services/navigation';
import { useSelectionStore } from '../../../stores/use-selection-store';
import { useTrashStore } from '../../../stores/use-trash-store';
import { history } from '../../../utils';
import { db } from '../../../utils/database';
import { presentDialog } from '../../dialog/functions';
import SelectionWrapper from '../selection-wrapper';

export const NotebookWrapper = React.memo(
  ({ item, index, dateBy }) => {
    const isTrash = item.type === 'trash';
    const setSelectedItem = useSelectionStore(state => state.setSelectedItem);

    const onPress = () => {
      if (history.selectedItemsList.length > 0 && history.selectionMode) {
        setSelectedItem(item);
        return;
      } else {
        history.selectedItemsList = [];
      }

      if (isTrash) {
        presentDialog({
          title: `Restore ${item.itemType}`,
          paragraph: `Restore or delete ${item.itemType} forever`,
          positiveText: 'Restore',
          negativeText: 'Delete',
          positivePress: async () => {
            await db.trash.restore(item.id);
            Navigation.queueRoutesForUpdate(
              'Tags',
              'Notes',
              'Notebooks',
              'Favorites',
              'Trash',
              'TaggedNotes',
              'ColoredNotes',
              'TopicNotes'
            );
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
        return;
      }
      if (item.type === 'topic') {
        TopicNotes.navigate(item, true);
      } else {
        Notebook.navigate(item, true);
      }
    };
    return (
      <SelectionWrapper
        pinned={item.pinned}
        index={index}
        onPress={onPress}
        height={item.type === 'topic' ? 80 : 110}
        item={item}
      >
        <NotebookItem
          isTopic={item.type === 'topic'}
          item={item}
          dateBy={dateBy}
          index={index}
          isTrash={isTrash}
        />
      </SelectionWrapper>
    );
  },
  (prev, next) => {
    if (prev.item.title !== next.item.title) return false;
    if (prev.dateBy !== next.dateBy) {
      return false;
    }

    if (prev.item?.dateEdited !== next.item?.dateEdited) {
      return false;
    }
    if (JSON.stringify(prev.item) !== JSON.stringify(next.item)) {
      return false;
    }

    return true;
  }
);
