import React, {useEffect, useState} from 'react';
import {Platform, StatusBar, Text, TouchableOpacity, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eOpenMoveNoteDialog, eOpenSimpleDialog} from '../../services/events';
import {db, selection, ToastEvent} from '../../utils/utils';
import {TEMPLATE_DELETE} from '../DialogManager/templates';

export const SelectionHeader = () => {
  // State
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, selectedItemsList, currentScreen} = state;
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {}, [currentScreen]);

  return (
    <Animatable.View
      transition={['translateY']}
      duration={300}
      useNativeDriver={true}
      style={{
        width: '100%',
        position: 'absolute',
        height: Platform.OS === 'android' ? 80 + StatusBar.currentHeight : 80,
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
              dispatch({type: ACTIONS.CLEAR_SELECTION});
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
              onPress={() => {
                dispatch({type: ACTIONS.SELECTION_MODE, enabled: false});
                dispatch({type: ACTIONS.CLEAR_SELECTION});
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
                let favCount = 0;
                let unFavCount = 0;
                if (selectedItemsList.length > 0) {
                  selectedItemsList.forEach(async item => {
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
                eSendEvent(eOpenSimpleDialog, TEMPLATE_DELETE('item'));
                return;
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

      <TouchableOpacity
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
      </TouchableOpacity>
    </Animatable.View>
  );
};

export default SelectionHeader;
