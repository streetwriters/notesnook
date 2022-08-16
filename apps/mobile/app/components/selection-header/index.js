import React, { useEffect } from 'react';
import { BackHandler, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../stores/use-theme-store';
import { useSelectionStore } from '../../stores/use-selection-store';
import { eSendEvent, ToastEvent } from '../../services/event-manager';
import Navigation from '../../services/navigation';
import { db } from '../../common/database';
import { eOpenMoveNoteDialog } from '../../utils/events';
import { deleteItems } from '../../utils/functions';
import { tabBarRef } from '../../utils/global-refs';
import layoutmanager from '../../utils/layout-manager';
import { SIZE } from '../../utils/size';
import { sleep } from '../../utils/time';
import { presentDialog } from '../dialog/functions';
import { IconButton } from '../ui/icon-button';
import Heading from '../ui/typography/heading';
import useNavigationStore from '../../stores/use-navigation-store';

export const SelectionHeader = React.memo(() => {
  const colors = useThemeStore(state => state.colors);
  const selectionMode = useSelectionStore(state => state.selectionMode);
  const selectedItemsList = useSelectionStore(state => state.selectedItemsList);
  const setSelectionMode = useSelectionStore(state => state.setSelectionMode);
  const clearSelection = useSelectionStore(state => state.clearSelection);
  const currentScreen = useNavigationStore(state => state.currentScreen);
  const screen = currentScreen.name;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (selectionMode) {
      tabBarRef.current?.lock();
    } else {
      tabBarRef.current?.unlock();
    }
  }, [selectionMode]);

  const addToFavorite = async () => {
    if (selectedItemsList.length > 0) {
      selectedItemsList.forEach(item => {
        db.notes.note(item.id).favorite();
      });
      Navigation.queueRoutesForUpdate(
        'Notes',
        'Favorites',
        'ColoredNotes',
        'TaggedNotes',
        'TopicNotes'
      );
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
      Navigation.queueRoutesForUpdate(
        'Notes',
        'Favorites',
        'ColoredNotes',
        'TaggedNotes',
        'TopicNotes',
        'Trash',
        'Notebooks',
        'Tags'
      );

      clearSelection();
      ToastEvent.show({
        heading: 'Restore successful',
        type: 'success'
      });
    }
  };

  const deleteItem = async () => {
    presentDialog({
      title: `Delete ${selectedItemsList.length > 1 ? 'items' : 'item'}`,
      paragraph: `Are you sure you want to delete ${
        selectedItemsList.length > 1 ? 'these items permanently?' : 'this item permanently?'
      }`,
      positiveText: 'Delete',
      negativeText: 'Cancel',
      positivePress: async () => {
        if (selectedItemsList.length > 0) {
          let noteIds = [];
          selectedItemsList.forEach(item => {
            noteIds.push(item.id);
          });
          await db.trash.delete(...noteIds);
          Navigation.queueRoutesForUpdate(
            'Notes',
            'Favorites',
            'ColoredNotes',
            'TaggedNotes',
            'TopicNotes',
            'Trash',
            'Notebooks',
            'Tags'
          );
          clearSelection();
        }
      },
      positiveType: 'errorShade'
    });
  };

  const onBackPress = () => {
    layoutmanager.withSpringAnimation(500);
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

  return !selectionMode ? null : (
    <View
      style={{
        width: '100%',
        height: 50 + insets.top,
        paddingTop: Platform.OS === 'android' ? insets.top : null,
        backgroundColor: colors.bg,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
        zIndex: 999,
        paddingHorizontal: 12
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          borderRadius: 100
        }}
      >
        <IconButton
          customStyle={{
            justifyContent: 'center',
            alignItems: 'center',
            height: 40,
            width: 40,
            borderRadius: 100,
            marginRight: 10
          }}
          type="grayBg"
          onPress={() => {
            setSelectionMode(!selectionMode);
          }}
          size={SIZE.xl}
          color={colors.icon}
          name="close"
        />

        <View
          style={{
            backgroundColor: colors.nav,
            height: 40,
            borderRadius: 100,
            paddingHorizontal: 16,
            justifyContent: 'center',
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <Heading size={SIZE.md} color={colors.accent}>
            {selectedItemsList.length + ' Selected'}
          </Heading>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center'
        }}
      >
        {/* <ActionIcon
          onPress={async () => {
            // await sleep(100);
            // eSendEvent(eOpenMoveNoteDialog);
            useSelectionStore.getState().setAll([...SearchService.getSearchInformation().data]);

          }}
          customStyle={{
            marginLeft: 10
          }}
          color={colors.pri}
          name="select-all"
          size={SIZE.xl}
        /> */}

        {screen === 'Trash' || screen === 'Notebooks' || screen === 'Notebook' ? null : (
          <IconButton
            onPress={async () => {
              //setSelectionMode(false);
              await sleep(100);
              eSendEvent(eOpenMoveNoteDialog);
            }}
            customStyle={{
              marginLeft: 10
            }}
            color={colors.pri}
            name="plus"
            size={SIZE.xl}
          />
        )}

        {screen === 'TopicNotes' ? (
          <IconButton
            onPress={async () => {
              if (selectedItemsList.length > 0) {
                const currentTopic = useNavigationStore.getState().currentScreen;
                await db.notebooks
                  .notebook(currentTopic.notebookId)
                  .topics.topic(currentTopic.id)
                  .delete(...selectedItemsList.map(item => item.id));
                Navigation.queueRoutesForUpdate(
                  'Notes',
                  'Favorites',
                  'ColoredNotes',
                  'TaggedNotes',
                  'TopicNotes',
                  'Notebooks',
                  'Notebook'
                );
                clearSelection();
              }
            }}
            customStyle={{
              marginLeft: 10
            }}
            testID="select-minus"
            color={colors.pri}
            name="minus"
            size={SIZE.xl}
          />
        ) : null}

        {screen === 'Favorites' ? (
          <IconButton
            onPress={addToFavorite}
            customStyle={{
              marginLeft: 10
            }}
            color={colors.pri}
            name="star-off"
            size={SIZE.xl}
          />
        ) : null}

        {screen === 'Trash' ? null : (
          <IconButton
            customStyle={{
              marginLeft: 10
            }}
            onPress={async () => {
              presentDialog({
                title: `Delete ${selectedItemsList.length > 1 ? 'items' : 'item'}`,
                paragraph: `Are you sure you want to delete ${
                  selectedItemsList.length > 1 ? 'these items?' : 'this item?'
                }`,
                positiveText: 'Delete',
                negativeText: 'Cancel',
                positivePress: () => {
                  deleteItems();
                },
                positiveType: 'errorShade'
              });

              return;
            }}
            color={colors.pri}
            name="delete"
            size={SIZE.xl}
          />
        )}

        {screen === 'Trash' ? (
          <>
            <IconButton
              customStyle={{
                marginLeft: 10
              }}
              color={colors.pri}
              onPress={restoreItem}
              name="delete-restore"
              size={SIZE.xl - 3}
            />

            <IconButton
              customStyle={{
                marginLeft: 10
              }}
              color={colors.pri}
              onPress={deleteItem}
              name="delete"
              size={SIZE.xl - 3}
            />
          </>
        ) : null}
      </View>
    </View>
  );
});

SelectionHeader.displayName = 'SelectionHeader';

export default SelectionHeader;
