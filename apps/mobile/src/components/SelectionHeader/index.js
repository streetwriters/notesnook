import React, { useEffect } from 'react';
import { BackHandler, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTracked } from '../../provider';
import { useSelectionStore } from '../../provider/stores';
import { eSendEvent, ToastEvent } from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import { db } from '../../utils/database';
import {
  eOpenMoveNoteDialog, refreshNotesPage
} from '../../utils/Events';
import { deleteItems } from '../../utils/functions';
import { SIZE } from '../../utils/SizeUtils';
import { sleep } from '../../utils/TimeUtils';
import { ActionIcon } from '../ActionIcon';
import { presentDialog } from '../Dialog/functions';
import Heading from '../Typography/Heading';

export const SelectionHeader = React.memo(({screen, type, extras}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  const selectionMode = useSelectionStore(state => state.selectionMode);
  const selectedItemsList = useSelectionStore(state => state.selectedItemsList);
  const setSelectionMode = useSelectionStore(state => state.setSelectionMode);
  const clearSelection = useSelectionStore(state => state.clearSelection);

  const insets = useSafeAreaInsets();

  const addToFavorite = async () => {
    if (selectedItemsList.length > 0) {
      selectedItemsList.forEach(item => {
        db.notes.note(item.id).favorite();
      });
      Navigation.setRoutesToUpdate([
        Navigation.routeNames.Notes,
        Navigation.routeNames.NotesPage,
        Navigation.routeNames.Favorites,
      ]);
      setSelectionMode(false);
      clearSelection();
    }
  };

  const restoreItem = async () => {
    if (selectedItemsList.length > 0) {
      let noteIds = [];
      selectedItemsList.forEach(item => {
        noteIds.push(item.id);
      });
      await db.trash.restore(...noteIds);
      Navigation.setRoutesToUpdate([
        Navigation.routeNames.Tags,
        Navigation.routeNames.Notes,
        Navigation.routeNames.Notebooks,
        Navigation.routeNames.NotesPage,
        Navigation.routeNames.Favorites,
        Navigation.routeNames.Trash,
      ]);
      setSelectionMode(false);
      clearSelection();
      ToastEvent.show({
        heading: 'Restore successful',
        type: 'success',
      });
    }
  };

  const onBackPress = () => {
    setSelectionMode(false);
    clearSelection();
    return true;
  };

  useEffect(() => {
    if (selectionMode) {
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
    } else {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }
  }, [selectionMode]);

  return !selectionMode || Navigation.getCurrentScreen() !== screen ? null : (
    <View
      style={{
        width: '100%',
        height: 50 + insets.top,
        paddingTop: insets.top,
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        zIndex: 999,
        paddingHorizontal: 12,
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          position: 'absolute',
          left: 12,
          paddingTop: insets.top,
        }}>
        <ActionIcon
          customStyle={{
            justifyContent: 'center',
            alignItems: 'center',
            height: 40,
            width: 40,
            borderRadius: 100,
            marginLeft: -5,
            marginRight: 25,
          }}
          onPress={() => {
            setSelectionMode(!selectionMode);
            clearSelection();
          }}
          color={colors.light}
          name="close"
        />

        {Platform.OS === 'android' ? (
          <Heading color={colors.light}>
            {selectedItemsList.length + ' Selected'}
          </Heading>
        ) : null}
      </View>

      {Platform.OS !== 'android' ? (
        <Heading color={colors.light}>
          {selectedItemsList.length + ' Selected'}
        </Heading>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          position: 'absolute',
          right: 12,
          paddingTop: insets.top,
        }}>
        {screen === 'Trash' ||
        screen === 'Notebooks' ||
        screen === 'Notebook' ||
        type === 'topic' ? null : (
          <ActionIcon
            onPress={async () => {
              //setSelectionMode(false);
              await sleep(100);
              eSendEvent(eOpenMoveNoteDialog);
            }}
            customStyle={{
              marginLeft: 10,
            }}
            color={colors.light}
            name="plus"
            size={SIZE.xl}
          />
        )}

        {type === 'topic' && (
          <ActionIcon
            onPress={async () => {
              if (selectedItemsList.length > 0) {
                await db.notebooks
                  .notebook(extras.notebook)
                  .topics.topic(extras.topic)
                  .delete(...selectedItemsList.map(item => item.id));

                eSendEvent(refreshNotesPage);
                Navigation.setRoutesToUpdate([
                  Navigation.routeNames.NotesPage,
                  Navigation.routeNames.Favorites,
                  Navigation.routeNames.Notes,
                  Navigation.routeNames.Notebook,
                  Navigation.routeNames.Notebooks,
                ]);
                setSelectionMode(false);
                clearSelection();
              }
            }}
            customStyle={{
              marginLeft: 10,
            }}
            color={colors.light}
            name="minus"
            size={SIZE.xl}
          />
        )}

        {screen === 'Favorites' ? (
          <ActionIcon
            onPress={addToFavorite}
            customStyle={{
              marginLeft: 10,
            }}
            color={colors.light}
            name="star-off"
            size={SIZE.xl}
          />
        ) : null}

        {screen === 'Trash' ? null : (
          <ActionIcon
            customStyle={{
              marginLeft: 10,
            }}
            onPress={async () => {
              presentDialog({
                title: `Delete ${
                  selectedItemsList.length > 1 ? 'items' : 'item'
                }`,
                paragraph: `Are you sure you want to delete ${
                  selectedItemsList.length > 1 ? 'these items?' : 'this item?'
                }`,
                positiveText: 'Delete',
                negativeText: 'Cancel',
                positivePress: () => {
                  deleteItems();
                },
                positiveType:"errorShade"
              });

              return;
            }}
            color={colors.light}
            name="delete"
            size={SIZE.xl}
          />
        )}

        {screen === 'Trash' ? (
          <ActionIcon
            customStyle={{
              marginLeft: 10,
            }}
            color={colors.light}
            onPress={restoreItem}
            name="delete-restore"
            size={SIZE.xl - 3}
          />
        ) : null}
      </View>
    </View>
  );
});

export default SelectionHeader;
