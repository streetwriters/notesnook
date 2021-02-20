import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import Animated, {Easing, useValue} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent,
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {db} from '../../utils/DB';
import {eOpenMoveNoteDialog, eOpenSimpleDialog} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {ActionIcon} from '../ActionIcon';
import {TEMPLATE_DELETE} from '../DialogManager/Templates';
import Heading from '../Typography/Heading';

export const SelectionHeader = () => {
  // State
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, selectedItemsList} = state;
  const insets = useSafeAreaInsets();
  const translateY = useValue(-150);
  const opacity = useValue(0);

  const [headerTextState, setHeaderTextState] = useState(
    Navigation.getHeaderState(),
  );
  const currentScreen = headerTextState.currentScreen;

  const onHeaderStateChange = (event) => {
    if (!event) return;
     setHeaderTextState(event);
  };

  useEffect(() => {
    eSubscribeEvent('onHeaderStateChange', onHeaderStateChange);
    return () => {
      eUnSubscribeEvent('onHeaderStateChange', onHeaderStateChange);
    };
  }, []);

  useEffect(() => {
    translateY.setValue(selectionMode ? 0 : -150);
    Animated.timing(opacity, {
      duration: 200,
      toValue: selectionMode ? 1 : 0,
      easing: Easing.in(Easing.ease),
    }).start();
  }, [selectionMode]);

  const addToFavorite = async () => {
    if (selectedItemsList.length > 0) {
      selectedItemsList.forEach((item) => {
        db.notes.note(item.id).favorite();
      });
      Navigation.setRoutesToUpdate([
        Navigation.routeNames.Notes,
        Navigation.routeNames.NotesPage,
        Navigation.routeNames.Favorites,
      ]);
      dispatch({type: Actions.SELECTION_MODE, enabled: false});
      dispatch({type: Actions.CLEAR_SELECTION});
    }
  };

  const restoreItem = async () => {
    if (selectedItemsList.length > 0) {
      let noteIds = [];
      selectedItemsList.forEach((item) => {
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
      dispatch({type: Actions.SELECTION_MODE, enabled: false});
      dispatch({type: Actions.CLEAR_SELECTION});
      ToastEvent.show({
        heading: 'Restore successful',
        type: 'success',
      });
    }
  };

  return (
    <Animated.View
      style={{
        width: '100%',
        position: 'absolute',
        height: 50 + insets.top,
        paddingTop: insets.top,
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        zIndex: 999,
        opacity: opacity,
        paddingHorizontal: 12,
        transform: [
          {
            translateY: translateY,
          },
        ],
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
            dispatch({type: Actions.SELECTION_MODE, enabled: !selectionMode});
            dispatch({type: Actions.CLEAR_SELECTION});
          }}
          color={colors.light}
          name="close"
          size={SIZE.xxxl}
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
        {currentScreen === 'Trash' ||
        currentScreen === 'Notebooks' ||
        currentScreen === 'Notebook' ? null : (
          <ActionIcon
            onPress={async () => {
              //dispatch({type: Actions.SELECTION_MODE, enabled: false});
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

        {currentScreen === 'Favorites' ? (
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

        {currentScreen === 'Trash' ? null : (
          <ActionIcon
            customStyle={{
              marginLeft: 10,
            }}
            onPress={async () => {
              eSendEvent(eOpenSimpleDialog, TEMPLATE_DELETE('item'));
              return;
            }}
            color={colors.light}
            name="delete"
            size={SIZE.xl}
          />
        )}

        {currentScreen === 'Trash' ? (
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
    </Animated.View>
  );
};

export default SelectionHeader;
