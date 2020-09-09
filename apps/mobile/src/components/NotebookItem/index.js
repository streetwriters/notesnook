import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ph, pv, SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import NavigationService from '../../services/NavigationService';
import {db, ToastEvent} from '../../utils/utils';
import {Button} from '../Button';
import {ActionSheetEvent, moveNoteHideEvent} from '../DialogManager/recievers';
import Seperator from '../Seperator';

export const NotebookItem = ({
  item,
  hideMore = false,
  isTopic = false,
  notebookID,
  numColumns,
  isTrash,
  customStyle,
}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectedItemsList} = state;

  return (
    <View
      style={[
        {
          height: isTopic ? 80 : 120,
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: 'row',
          paddingRight: 6,
          alignSelf: 'center',
          borderBottomWidth: 1,
          borderBottomColor: colors.nav,
          width: '100%',
        },
        customStyle,
      ]}>
      <View
        style={{
          width: hideMore ? '80%' : '90%',
          maxWidth: hideMore ? '80%' : '90%',
          minHeight: 50,
          justifyContent: 'center',
        }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: WEIGHT.bold,
            fontSize: SIZE.md,
            color: colors.heading,
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
            {item && item.topics ? (
              item.topics.slice(1, 4).map((topic) => (
                <View
                  key={topic.dateCreated.toString() + topic.title}
                  style={{
                    borderRadius: 2.5,
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
            ) : (
              <Text
                style={{
                  color: colors.icon,
                  fontFamily: WEIGHT.regular,
                  fontSize: SIZE.xxs,
                  paddingVertical: pv / 3,
                  maxWidth: '100%',
                }}>
                This notebook has no topics.
              </Text>
            )}
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
          {isTrash ? null : (
            <Text
              style={{
                color: colors.icon,
                fontSize: SIZE.xxs,
                textAlignVertical: 'center',
                fontFamily: WEIGHT.regular,
              }}>
              {new Date(item.dateCreated).toDateString().substring(4)}
            </Text>
          )}
          <Seperator half />
          <Text
            style={{
              color: colors.icon,
              fontSize: SIZE.xxs,
              textAlignVertical: 'center',
              fontFamily: WEIGHT.regular,
            }}>
            {item && item.totalNotes && item.totalNotes > 1
              ? item.totalNotes + ' Notes'
              : item.totalNotes === 1
              ? item.totalNotes + ' Note'
              : '0 Notes'}
          </Text>
        </View>
      </View>
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
          <Icon name="dots-horizontal" size={SIZE.lg} color={colors.heading} />
        </TouchableOpacity>
      )}

      {hideMore && isTopic ? (
        <Button
          width="20%"
          title="Move"
          onPress={async () => {
            let noteIds = [];
            selectedItemsList.forEach((item) => noteIds.push(item.id));

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
        />
      ) : null}
    </View>
  );
};
