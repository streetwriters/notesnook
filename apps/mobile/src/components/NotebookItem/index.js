import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {opacity, ph, pv, SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import NavigationService from '../../services/NavigationService';
import {db, ToastEvent} from '../../utils/utils';
import {ActionSheetEvent, moveNoteHideEvent} from '../DialogManager/recievers';

export const NotebookItem = ({
  item,
  index,
  hideMore = false,
  topic,
  isTopic = false,
  isMove = false,
  noteToMove = null,
  notebookID,
  numColumns,
  isTrash,
  customStyle,
  onLongPress,
  navigation,
  selectionMode,
  pinned,
}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectedItemsList} = state;

  const navigate = () => {
    if (selectionMode) {
      onLongPress();
      return;
    }
    if (isTopic) {
      NavigationService.navigate('Notes', {
        ...item,
      });
    } else {
      dispatch({
        type: ACTIONS.HEADER_TEXT_STATE,
        state: {
          heading: hideMore ? 'Move to topic' : item.title,
        },
      });
      dispatch({
        type: ACTIONS.HEADER_STATE,
        state: {
          canGoBack:true,
          menu:false
        },
      });
      dispatch({
        type: ACTIONS.CONTAINER_BOTTOM_BUTTON,
        state: {
          bottomButtonText: 'Add new topic',
        },
      });

      hideMore
        ? navigation.navigate('Notebook', {
            notebook: item,
            title: hideMore ? 'Move to topic' : item.title,
            isMove: isMove,
            hideMore: hideMore,
            root:false
          })
        : NavigationService.navigate('Notebook', {
            notebook: item,
            title: hideMore ? 'Select a topic' : item.title,
            isMove: isMove,
            hideMore: hideMore,
            root:true
          });
    }
  };

  return (
    <View
      style={[
        {
          paddingVertical: isTopic ? pv / 2 : pv,
          justifyContent: 'flex-start',
          alignItems: 'center',
          flexDirection: 'row',
          paddingRight: 6,
          alignSelf: 'center',
          borderBottomWidth: 1,
          borderBottomColor: colors.nav,
        },
        customStyle,
      ]}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            width: hideMore ? '80%' : '90%',
            maxWidth: hideMore ? '80%' : '90%',
            minHeight: 50,
            justifyContent: 'center',
          }}
          onLongPress={onLongPress}
          onPress={navigate}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: WEIGHT.bold,
              fontSize: SIZE.sm + 1,
              color: colors.pri,
              maxWidth: '100%',
            }}>
            {item.title}
          </Text>
          {isTopic || !item.description ? null : (
            <Text
              numberOfLines={numColumns === 2 ? 3 : 2}
              style={{
                fontFamily: WEIGHT.regular,
                fontSize: SIZE.xs + 1,
                lineHeight: SIZE.sm,
                color: colors.pri,
                maxWidth: '100%',
                paddingVertical: 5,
                height: numColumns === 2 ? SIZE.sm * 3.5 : null,
              }}>
              {item.description}
            </Text>
          )}

          {isTopic ? null : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '80%',
                maxWidth: '80%',
                flexWrap: 'wrap',
              }}>
              {item && item.topics
                ? item.topics.slice(1, 4).map(topic => (
                    <View
                      key={topic.dateCreated.toString() + topic.title}
                      style={{
                        borderRadius: 5,
                        backgroundColor: colors.accent,
                        paddingHorizontal: ph / 1.5,
                        paddingVertical: pv / 3,
                        marginRight: 5,
                        marginVertical: 2.5,
                      }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: 'white',
                          fontFamily: WEIGHT.regular,
                          fontSize: SIZE.xxs,
                          maxWidth: '100%',
                        }}>
                        {topic.title}
                      </Text>
                    </View>
                  ))
                : null}
            </View>
          )}

          {isTrash ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 5,
              }}>
              <Text
                style={{
                  color: colors.icon,
                  fontSize: SIZE.xs - 1,
                  textAlignVertical: 'center',
                  fontFamily: WEIGHT.regular,
                }}>
                {'Deleted on: ' + item && item.dateDeleted
                  ? new Date(item.dateDeleted).toISOString().slice(0, 10)
                  : null + '   '}
              </Text>
              <Text
                style={{
                  color: colors.accent,
                  fontSize: SIZE.xs - 1,
                  textAlignVertical: 'center',
                  fontFamily: WEIGHT.regular,
                }}>
                {item.type[0].toUpperCase() + item.type.slice(1) + '  '}
              </Text>
            </View>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
              marginTop: 5,
            }}>
            <Text
              style={{
                color: colors.icon,
                fontSize: SIZE.xxs,
                textAlignVertical: 'center',
                fontFamily: WEIGHT.regular,
              }}>
              {item && item.totalNotes && item.totalNotes > 1
                ? item.totalNotes + ' notes'
                : item.totalNotes === 1
                ? item.totalNotes + ' note'
                : '0 notes'}
            </Text>

            {isTopic || isTrash ? null : (
              <Text
                style={{
                  color: colors.accent,
                  marginLeft: 10,
                  fontSize: SIZE.xxs,
                  textAlignVertical: 'center',
                  fontFamily: WEIGHT.regular,
                }}>
                {new Date(item.dateCreated).toDateString().substring(4)}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        {hideMore ||
        (item.title === 'General' && item.type === 'topic') ? null : (
          <TouchableOpacity
            style={{
              justifyContent: 'center',
              minHeight: 70,
              alignItems: 'center',
            }}
            onPress={() => {
              let rowItems = isTrash
                ? ['Restore', 'Remove']
                : [
                    item.type == 'topic' ? 'Edit Topic' : 'Edit Notebook',
                    'Delete',
                  ];

              let columnItems = item.type === 'topic' ? [] : ['Pin'];

              ActionSheetEvent(item, false, false, rowItems, columnItems, {
                notebookID: notebookID,
              });
            }}>
            <Icon name="dots-horizontal" size={SIZE.lg} color={colors.icon} />
          </TouchableOpacity>
        )}

        {hideMore && isTopic ? (
          <TouchableOpacity
            activeOpacity={opacity}
            onPress={async () => {
              let noteIds = [];
              selectedItemsList.forEach(item => noteIds.push(item.id));

              await db.notes.move(
                {
                  topic: item.title,
                  id: item.notebookId,
                },
                ...noteIds,
              );
              dispatch({type: ACTIONS.CLEAR_SELECTION});

              moveNoteHideEvent();

              ToastEvent.show(`Note moved to ${item.title}`, 'success');
            }}
            style={{
              borderWidth: 1,
              borderRadius: 5,
              width: '20%',
              paddingHorizontal: ph - 5,
              borderColor: colors.nav,
              paddingVertical: pv - 5,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.accent,
            }}>
            <Text
              style={{
                fontSize: SIZE.sm,
                fontFamily: WEIGHT.regular,
                color: 'white',
              }}>
              Move
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};
