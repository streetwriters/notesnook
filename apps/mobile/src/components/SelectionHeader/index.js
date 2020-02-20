import React, {useEffect} from 'react';
import {
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {w, ToastEvent} from '../../utils/utils';
import {eSendEvent} from '../../services/eventManager';
import {eOpenMoveNoteDialog} from '../../services/events';
import {db} from '../../../App';

export const AnimatedSafeAreaView = Animatable.createAnimatableComponent(
  SafeAreaView,
);

export const SelectionHeader = ({navigation}) => {
  // State
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, selectedItemsList, currentScreen} = state;

  useEffect(() => {
    console.log(currentScreen);
  }, [currentScreen]);

  return (
    <Animatable.View
      transition={['translateY']}
      duration={300}
      useNativeDriver={true}
      style={{
        width: '100%',
        position: 'absolute',
        height: Platform.OS === 'android' ? 50 + StatusBar.currentHeight : 50,
        backgroundColor: colors.bg,
        paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
        justifyContent: 'flex-end',
        zIndex: 999,
        paddingHorizontal: 12,
        transform: [
          {
            translateY: selectionMode ? 0 : -100,
          },
        ],
      }}>
      <View
        style={{
          width: '100%',
          height: 50,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <View
          style={{
            justifyContent: 'space-between',
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <TouchableOpacity
            onPress={() => {
              dispatch({type: ACTIONS.SELECTION_MODE, enabled: !selectionMode});
            }}
            hitSlop={{top: 20, bottom: 20, left: 50, right: 40}}
            style={{
              justifyContent: 'center',
              alignItems: 'flex-start',
              height: 40,
              width: 50,
            }}>
            <Icon
              style={{
                marginLeft: -5,
              }}
              color={colors.pri}
              name={'chevron-left'}
              size={SIZE.xxxl}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: SIZE.lg,
              fontFamily: WEIGHT.regular,
              color: colors.pri,
              textAlignVertical: 'center',
            }}>
            {selectedItemsList.length}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          {currentScreen === 'trash' || currentScreen === 'notebooks' ? null : (
            <TouchableOpacity
              onPress={() => {
                dispatch({type: ACTIONS.SELECTION_MODE, enabled: false});
                eSendEvent(eOpenMoveNoteDialog);
              }}>
              <Icon
                style={{
                  paddingLeft: 25,
                }}
                color={colors.accent}
                name={'plus'}
                size={SIZE.xl}
              />
            </TouchableOpacity>
          )}
          {currentScreen === 'trash' || currentScreen === 'notebooks' ? null : (
            <TouchableOpacity
              onPress={async () => {
                if (selectedItemsList.length > 0) {
                  selectedItemsList.forEach(async item => {
                    await db.notes.note(item.id).favorite();
                  });
                  dispatch({type: ACTIONS.SELECTION_MODE, enabled: false});
                  dispatch({type: ACTIONS.NOTES});
                  dispatch({type: ACTIONS.CLEAR_SELECTION});
                  ToastEvent.show('Notes added to favorites', 'success');
                }
              }}>
              <Icon
                style={{
                  paddingLeft: 25,
                }}
                color={colors.accent}
                name={'star'}
                size={SIZE.xl - 3}
              />
            </TouchableOpacity>
          )}

          {currentScreen === 'trash' ? null : (
            <TouchableOpacity
              onPress={async () => {
                if (selectedItemsList.length > 0) {
                  let noteIds = [];
                  selectedItemsList.forEach(item => {
                    noteIds.push(item.id);
                  });
                  if (currentScreen === 'notebooks') {
                    await db.notebooks.delete(...noteIds);
                    dispatch({type: ACTIONS.NOTEBOOKS});
                    ToastEvent.show('Notebooks moved to trash');
                  } else if (currentScreen === 'notebook') {
                    ToastEvent.show('Topics moved to trash');
                    // TODO
                  } else {
                    await db.notes.delete(...noteIds);
                    dispatch({type: ACTIONS.NOTES});
                    ToastEvent.show('Notes moved to trash');
                  }

                  dispatch({type: ACTIONS.SELECTION_MODE, enabled: false});

                  dispatch({type: ACTIONS.CLEAR_SELECTION});
                }
              }}>
              <Icon
                style={{
                  paddingLeft: 25,
                }}
                color={colors.errorText}
                name={'delete'}
                size={SIZE.xl - 3}
              />
            </TouchableOpacity>
          )}

          {currentScreen === 'trash' ? (
            <TouchableOpacity
              onPress={async () => {
                if (selectedItemsList.length > 0) {
                  let noteIds = [];
                  selectedItemsList.forEach(item => {
                    noteIds.push(item.id);
                  });

                  await db.trash.restore(...noteIds);

                  console.log(noteIds);
                  dispatch({type: ACTIONS.TRASH});
                  dispatch({type: ACTIONS.SELECTION_MODE, enabled: false});
                  dispatch({type: ACTIONS.CLEAR_SELECTION});
                  ToastEvent.show('Restore complete', 'success');
                }
              }}>
              <Icon
                style={{
                  paddingLeft: 25,
                }}
                color={colors.errorText}
                name="delete-restore"
                size={SIZE.xl - 3}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Animatable.View>
  );
};

export default SelectionHeader;
