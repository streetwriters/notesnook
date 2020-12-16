import React, {useEffect} from 'react';
import {TouchableOpacity, View} from 'react-native';
import Animated, {Easing, useValue} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {eSendEvent, ToastEvent} from '../../services/EventManager';
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
  const {
    colors,
    selectionMode,
    selectedItemsList,
    currentScreen,
    premiumUser,
  } = state;
  const insets = useSafeAreaInsets();
  const translateY = useValue(-150);

  useEffect(() => {
    Animated.timing(translateY, {
      duration: 300,
      toValue: selectionMode ? 0 : -150,
      easing: Easing.in(Easing.ease),
    }).start();
  }, [selectionMode]);

  return (
    <Animated.View
      style={{
        width: '100%',
        position: 'absolute',
        height: 50 + insets.top,
        paddingTop: insets.top,
        backgroundColor: colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        zIndex: 999,
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
          color={colors.heading}
          name="arrow-left"
          size={SIZE.xxxl}
        />

        {Platform.OS === 'android' ? (
          <Heading>{selectedItemsList.length + ' Selected'}</Heading>
        ) : null}
      </View>

      {Platform.OS !== 'android' ? (
        <Heading>{selectedItemsList.length + ' Selected'}</Heading>
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
        {currentScreen === 'trash' ||
        currentScreen === 'notebooks' ||
        currentScreen === 'notebook' ? null : (
          <ActionIcon
            onPress={async () => {
              dispatch({type: Actions.SELECTION_MODE, enabled: false});
              await sleep(100);
              eSendEvent(eOpenMoveNoteDialog);
            }}
            customStyle={{
              marginLeft: 10,
            }}
            color={colors.heading}
            name="plus"
            size={SIZE.xl}
          />
        )}

        {currentScreen === 'trash' ? null : (
          <ActionIcon
            customStyle={{
              marginLeft: 10,
            }}
            onPress={async () => {
              eSendEvent(eOpenSimpleDialog, TEMPLATE_DELETE('item'));
              return;
            }}
            color={colors.heading}
            name="delete"
            size={SIZE.xl}
          />
        )}

        {currentScreen === 'trash' ? (
          <ActionIcon
            customStyle={{
              marginLeft: 10,
            }}
            color={colors.heading}
            onPress={async () => {
              if (selectedItemsList.length > 0) {
                let noteIds = [];
                selectedItemsList.forEach((item) => {
                  noteIds.push(item.id);
                });
                await db.trash.restore(...noteIds);
                dispatch({type: Actions.NOTEBOOKS});
                dispatch({type: Actions.NOTES});
                dispatch({type: Actions.TRASH});
                dispatch({type: Actions.SELECTION_MODE, enabled: false});
                dispatch({type: Actions.CLEAR_SELECTION});
                ToastEvent.show('Restore complete', 'success');
              }
            }}
            name="delete-restore"
            size={SIZE.xl - 3}
          />
        ) : null}
      </View>
    </Animated.View>
  );
};

export default SelectionHeader;
