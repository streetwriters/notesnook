import React, { useEffect, useState } from 'react';
import { Clipboard, View } from 'react-native';
import Animated, { useValue } from 'react-native-reanimated';
import { useTracked } from '../../provider';
import {
  useMenuStore,
  useNotebookStore,
  useSelectionStore
} from '../../provider/stores';
import { openVault, ToastEvent } from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import { dWidth, getElevation, toTXT } from '../../utils';
import { db } from '../../utils/DB';
import { deleteItems } from '../../utils/functions';
import { ActionIcon } from '../ActionIcon';
import { Button } from '../Button';
import { presentDialog } from '../Dialog/functions';

export const ActionStrip = ({note, setActionStrip}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const selectionMode = useSelectionStore(state => state.selectionMode);
  const setNotebooks = useNotebookStore(state => state.setNotebooks);
  const setMenuPins = useMenuStore(state => state.setMenuPins);
  const setSelectedItem = useSelectionStore(state => state.setSelectedItem);
  const setSelectionMode = useSelectionStore(state => state.setSelectionMode);

  const [isPinnedToMenu, setIsPinnedToMenu] = useState(false);
  const [width, setWidth] = useState(dWidth - 16);
  const opacity = useValue(0);
  useEffect(() => {
    if (note.type === 'note') return;
    setIsPinnedToMenu(db.settings.isPinned(note.id));
  }, []);

  const updateNotes = () => {
    Navigation.setRoutesToUpdate([
      Navigation.routeNames.NotesPage,
      Navigation.routeNames.Favorites,
      Navigation.routeNames.Notes,
    ]);
  };

  useEffect(() => {
    setTimeout(() => {
      opacity.setValue(1);
    }, 100);
    return () => {
      opacity.setValue(0);
    };
  }, [width]);

  const actions = [
    {
      title: 'Pin ' + note.type,
      icon: note.pinned ? 'pin-off' : 'pin',
      visible: note.type === 'note' || note.type === 'notebook',
      onPress: async () => {
        if (!note.id) return;

        if (note.type === 'note') {
          if (db.notes.pinned.length === 3 && !note.pinned) {
            ToastEvent.show({
              heading: 'Cannot pin more than 3 notes',
              type: 'error',
            });
            return;
          }
          await db.notes.note(note.id).pin();
        } else {
          if (db.notebooks.pinned.length === 3 && !note.pinned) {
            ToastEvent.show({
              heading: 'Cannot pin more than 3 notebooks',
              type: 'error',
            });
            return;
          }
          await db.notebooks.notebook(note.id).pin();
          setNotebooks();
        }
        updateNotes();
        setActionStrip(false);
      },
    },
    {
      title: 'Add to favorites',
      icon: note.favorite ? 'star-off' : 'star',
      onPress: async () => {
        if (!note.id) return;
        if (note.type === 'note') {
          await db.notes.note(note.id).favorite();
        } else {
          await db.notebooks.notebook(note.id).favorite();
        }
        updateNotes();
        setActionStrip(false);
      },
      visible: note.type === 'note',
      color: !note.favorite ? 'orange' : null,
    },

    {
      title: isPinnedToMenu
        ? 'Remove Shortcut from Menu'
        : 'Add Shortcut to Menu',
      icon: isPinnedToMenu ? 'link-variant-remove' : 'link-variant',
      onPress: async () => {
        try {
          if (isPinnedToMenu) {
            await db.settings.unpin(note.id);
            ToastEvent.show({
              heading: 'Shortcut removed from menu',
              type: 'success',
            });
          } else {
            if (note.type === 'topic') {
              await db.settings.pin(note.type, {
                id: note.id,
                notebookId: note.notebookId,
              });
            } else {
              await db.settings.pin(note.type, {id: note.id});
            }
            ToastEvent.show({
              heading: 'Shortcut added to menu',
              type: 'success',
            });
          }
          setIsPinnedToMenu(db.settings.isPinned(note.id));
          setMenuPins();

          setActionStrip(false);
        } catch (e) {}
      },
      visible: note.type !== 'note',
    },
    {
      title: 'Copy Note',
      icon: 'content-copy',
      visible: note.type === 'note',
      onPress: async () => {
        if (note.locked) {
          openVault({
            copyNote: true,
            novault: true,
            locked: true,
            item: note,
            title: 'Copy note',
            description: 'Unlock note to copy to clipboard.',
          });
        } else {
          let delta = await db.notes.note(note.id).content();
          let text = toTXT(delta);
          text = `${note.title}\n \n ${text}`;
          Clipboard.setString(text);
          ToastEvent.show({
            heading: 'Note copied to clipboard',
            type: 'success',
          });
        }
        setActionStrip(false);
      },
    },
    {
      title: 'Restore ' + note.itemType,
      icon: 'delete-restore',
      onPress: async () => {
        await db.trash.restore(note.id);
        Navigation.setRoutesToUpdate([
          Navigation.routeNames.Notes,
          Navigation.routeNames.Notebooks,
          Navigation.routeNames.NotesPage,
          Navigation.routeNames.Favorites,
          Navigation.routeNames.Trash,
        ]);

        ToastEvent.show({
          heading:
            item.type === 'note'
              ? 'Note restored from trash'
              : 'Notebook restored from trash',
          type: 'success',
        });

        setActionStrip(false);
      },
      visible: note.type === 'trash',
    },
    {
      title: 'Delete' + note.itemType,
      icon: 'delete',
      visible: note.type === 'trash',
      onPress: () => {
        presentDialog({
          title: `Permanent delete`,
          paragraph: `Are you sure you want to delete this ${note.itemType} permanantly from trash?`,
          positiveText: 'Delete',
          negativeText: 'Cancel',
          positivePress: async () => {
            await db.trash.delete(note.id);
            useTrashStore.getState().setTrash();
            useSelectionStore.getState().setSelectionMode(false);
            ToastEvent.show({
              heading: 'Permanantly deleted items',
              type: 'success',
              context: 'local',
            });
          },
          positiveType: 'errorShade',
        });
        setActionStrip(false);
      },
    },
    {
      title: 'Delete' + note.type,
      icon: 'delete',
      visible: note.type !== 'trash',
      onPress: async () => {
        try {
          await deleteItems(note);
        } catch (e) {}
        setActionStrip(false);
      },
    },
    {
      title: 'Close',
      icon: 'close',
      onPress: () => setActionStrip(false),
      color: colors.light,
      bg: colors.red,
      visible: true,
    },
  ];

  return (
    <Animated.View
      onLayout={event => {
        setWidth(event.nativeEvent.layout.width);
      }}
      style={{
        position: 'absolute',
        zIndex: 10,
        width: '102%',
        height: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        opacity: opacity,
      }}>
      <Button
        type="accent"
        title="Select"
        icon="check"
        tooltipText="Select Item"
        onPress={event => {
          if (!selectionMode) {
            setSelectionMode(true);
          }
          setSelectedItem(note);
          setActionStrip(false);
        }}
        style={{
          borderRadius: 100,
          paddingHorizontal: 12,
          ...getElevation(5),
        }}
        height={30}
      />
      {actions.map(
        item =>
          item.visible && (
            <View
              key={item.icon}
              style={{
                width: width / 1.4 / actions.length,
                height: width / 1.4 / actions.length,
                backgroundColor: item.bg || colors.nav,
                borderRadius: 100,
                justifyContent: 'center',
                alignItems: 'center',
                ...getElevation(5),
                marginLeft: 15,
              }}>
              <ActionIcon
                color={item.color || colors.heading}
                onPress={item.onPress}
                tooltipText={item.title}
                top={60}
                bottom={60}
                name={item.icon}
                size={width / 2.8 / actions.length}
              />
            </View>
          ),
      )}
    </Animated.View>
  );
};
