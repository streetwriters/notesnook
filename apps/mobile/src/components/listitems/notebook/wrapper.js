import React from 'react';
import { NotebookItem } from '.';
import { eSendEvent, ToastEvent } from '../../../services/event-manager';
import Navigation from '../../../services/navigation';
import { useSelectionStore, useTrashStore } from '../../../stores/stores';
import { history } from '../../../utils';
import { eOnNewTopicAdded, refreshNotesPage } from '../../../utils/events';
import { presentDialog } from '../../dialog/functions';
import SelectionWrapper from '../selection-wrapper';
import { db } from '../../../utils/database';

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
        return;
      }

      let routeName = item.type === 'topic' ? 'NotesPage' : 'Notebook';

      let params =
        item.type === 'topic'
          ? { ...item, menu: false }
          : {
              menu: false,
              notebook: item,
              title: item.title
            };
      let headerState = {
        heading: item.title,
        id: item.id,
        type: item.type
      };
      if (item.type === 'topic') {
        eSendEvent(refreshNotesPage, params);
      } else {
        eSendEvent(eOnNewTopicAdded, params);
      }
      Navigation.navigate(routeName, params, headerState);
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
