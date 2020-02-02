import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {opacity, ph, pv, SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import NavigationService from '../../services/NavigationService';
import {ToastEvent, w} from '../../utils/utils';
import {ActionSheetEvent, moveNoteHideEvent} from '../DialogManager';

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
}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectedItemsList} = state;

  const navigate = () => {
    isTopic
      ? NavigationService.navigate('Notes', {
          ...item,
          notebookID,
        })
      : navigation.navigate('Notebook', {
          notebook: item,
          title: hideMore ? 'Select Topic' : item.title,
          isMove: isMove,
          hideMore: hideMore,
        });
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
          marginHorizontal: 12,
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
          style={{
            width: '75%',
          }}
          onLongPress={onLongPress}
          onPress={navigate}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: WEIGHT.bold,
              fontSize: SIZE.md,
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
                marginTop: 5,
                width: '95%',
                maxWidth: '95%',
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
                        paddingVertical: pv / 4,
                        marginRight: 10,
                        marginVertical: 4,
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
                {'Deleted on: ' +
                  new Date(item.dateDeleted).toISOString().slice(0, 10) +
                  '   '}
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

          {isTopic || isTrash ? null : (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                marginTop: 5,
              }}>
              {item.favorite ? (
                <Icon
                  style={{width: 30}}
                  name="star"
                  size={SIZE.xs}
                  color={colors.icon}
                />
              ) : null}

              <Text
                style={{
                  color: colors.accent,
                  fontSize: SIZE.xxs,
                  textAlignVertical: 'center',
                  fontFamily: WEIGHT.regular,
                }}>
                {new Date(item.dateCreated).toDateString().substring(4)}
              </Text>
            </View>
          )}
          {isTopic ? (
            <Text
              style={{
                color: colors.icon,
                fontSize: SIZE.xxs,
                textAlignVertical: 'center',
                fontFamily: WEIGHT.regular,
                marginTop: 5,
              }}>
              {item && item.totalNotes && item.totalNotes.length == 1
                ? item.totalNotes + ' notes'
                : item.totalNotes + ' note'}
            </Text>
          ) : null}
        </TouchableOpacity>
        {hideMore ? null : (
          <TouchableOpacity
            style={{
              width: w * 0.05,
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

              let columnItems = ['Pin', 'Favorite'];

              ActionSheetEvent(item, false, false, rowItems, columnItems, {
                notebookID: notebookID,
              });
            }}>
            <Icon name="more-horizontal" size={SIZE.lg} color={colors.icon} />
          </TouchableOpacity>
        )}

        {hideMore && isTopic ? (
          <TouchableOpacity
            activeOpacity={opacity}
            onPress={async () => {
              console.log(selectedItemsList, item);
              /*  if (!noteToMove.notebook.notebook) {
                await db.addNoteToTopic(
                  notebookID,
                  item.title,
                  noteToMove.dateCreated,
                );
              } else if (selectedItemsList) {

                await db.moveNote(noteToMove.dateCreated, noteToMove.notebook, {
                  notebook: notebookID,
                  topic: item.title,
                });
              } */

              // moveNoteHideEvent();

              ToastEvent.show(
                `Note moved to ${item.title}`,
                'success',
                3000,
                () => {},
                '',
              );
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
