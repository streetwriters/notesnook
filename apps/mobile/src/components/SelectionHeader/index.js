import React, {useState, useEffect} from 'react';
import {Platform, StatusBar, Text, TouchableOpacity, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {
  eOpenMoveNoteDialog,
  eOpenPremiumDialog,
  eOpenSimpleDialog,
} from '../../services/events';
import {db, ToastEvent} from '../../utils/utils';
import {TEMPLATE_DELETE} from '../DialogManager/templates';
import Animated, {useValue, Easing} from 'react-native-reanimated';

export const SelectionHeader = () => {
  // State
  const [state, dispatch] = useTracked();
  const {
    colors,
    selectionMode,
    selectedItemsList,
    currentScreen,
    containerState,
    premiumUser,
  } = state;
  const [selectAll, setSelectAll] = useState(false);
  const insets = useSafeAreaInsets();
  const translateY = useValue(-150);

  useEffect(() => {
    Animated.timing(translateY, {
      duration: 300,
      toValue: selectionMode ? 0 : -150,
      easing: Easing.in(Easing.ease),
    }).start();
  }, [selectionMode]);

  return containerState.noSelectionHeader ? null : (
    <Animated.View
      style={{
        width: '100%',
        position: 'absolute',
        height:50,
        backgroundColor: colors.bg,
        marginTop: insets.top,
        justifyContent: 'flex-end',
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
              dispatch({type: ACTIONS.CLEAR_SELECTION});
            }}
            hitSlop={{top: 20, bottom: 20, left: 50, right: 40}}
            style={{
              justifyContent: 'center',
              alignItems: 'flex-start',
              height: 40,
              width: 60,
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
            {selectAll ? 'All' : selectedItemsList.length}
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
              style={{
                justifyContent: 'center',
                alignItems: 'flex-end',
                height: 40,
                width: 50,
                paddingRight: 0,
              }}
              onPress={() => {
                dispatch({type: ACTIONS.SELECTION_MODE, enabled: false});
                dispatch({type: ACTIONS.CLEAR_SELECTION});
                eSendEvent(eOpenMoveNoteDialog);
              }}>
              <Icon color={colors.heading} name={'plus'} size={SIZE.xl} />
            </TouchableOpacity>
          )}
        {/*   {currentScreen === 'trash' || currentScreen === 'notebooks' ? null : (
            <TouchableOpacity
              style={{
                justifyContent: 'center',
                alignItems: 'flex-end',
                height: 40,
                width: 50,
                paddingRight: 0,
              }}
              onPress={async () => {
                if (!premiumUser) {
                  eSendEvent(eOpenPremiumDialog);
                  return;
                }
                let favCount = 0;
                let unFavCount = 0;
                if (selectedItemsList.length > 0) {
                  selectedItemsList.forEach(async (item) => {
                    if (!item.favorite) {
                      favCount += 1;
                    } else {
                      return;
                    }
                    await db.notes.note(item.id).favorite();
                    dispatch({type: ACTIONS.NOTES});
                    dispatch({type: ACTIONS.FAVORITES});
                  });

                  dispatch({type: ACTIONS.SELECTION_MODE, enabled: false});

                  dispatch({type: ACTIONS.CLEAR_SELECTION});

                  ToastEvent.show(
                    favCount + ' notes added to favorites',
                    'success',
                  );
                }
              }}>
              <Icon color={colors.heading} name={'star'} size={SIZE.xl - 3} />
            </TouchableOpacity>
          )} */}

          {currentScreen === 'trash' ? null : (
            <TouchableOpacity
              style={{
                justifyContent: 'center',
                alignItems: 'flex-end',
                height: 40,
                width: 50,
                paddingRight: 0,
              }}
              onPress={async () => {
                eSendEvent(eOpenSimpleDialog, TEMPLATE_DELETE('item'));
                return;
              }}>
              <Icon color={colors.heading} name={'delete'} size={SIZE.xl - 3} />
            </TouchableOpacity>
          )}

          {currentScreen === 'trash' ? (
            <TouchableOpacity
              style={{
                justifyContent: 'center',
                alignItems: 'flex-end',
                height: 40,
                width: 50,
                paddingRight: 0,
              }}
              onPress={async () => {
                if (selectedItemsList.length > 0) {
                  let noteIds = [];
                  selectedItemsList.forEach((item) => {
                    noteIds.push(item.id);
                  });

                  await db.trash.restore(...noteIds);

                  dispatch({type: ACTIONS.TRASH});
                  dispatch({type: ACTIONS.SELECTION_MODE, enabled: false});
                  dispatch({type: ACTIONS.CLEAR_SELECTION});
                  ToastEvent.show('Restore complete', 'success');
                }
              }}>
              <Icon
                color={colors.heading}
                name="delete-restore"
                size={SIZE.xl - 3}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/*     <TouchableOpacity
        onPress={() => {
          if (selectAll) {
            dispatch({type: ACTIONS.SELECT_ALL, selected: []});
          } else {
            dispatch({
              type: ACTIONS.SELECT_ALL,
              selected:
                selection.type === 'notes' ? db.notes.all : selection.data,
            });
          }

          setSelectAll(!selectAll);
        }}
        hitSlop={{top: 20, bottom: 20, left: 20, right: 40}}
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          height: 40,
          flexDirection: 'row',
          alignSelf: 'flex-start',
          marginLeft:5,
          marginBottom:5
        }}>
        <Icon
          style={{}}
          color={selectAll ? colors.accent : colors.icon}
          name={
            selectAll ? 'check-circle-outline' : 'checkbox-blank-circle-outline'
          }
          size={SIZE.lg}
        />
        <Text
          style={{
            marginLeft: 10,
          }}>
          Select All
        </Text>
      </TouchableOpacity> */}
    </Animated.View>
  );
};

export default SelectionHeader;
