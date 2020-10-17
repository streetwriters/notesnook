import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {useTracked} from '../../provider';
import NavigationService from '../../services/Navigation';
import {ActionSheetEvent} from '../DialogManager/recievers';
import Seperator from '../Seperator';
import {ph, pv, SIZE, WEIGHT} from "../../utils/SizeUtils";
import {ActionIcon} from "../ActionIcon";

export const NotebookItem = ({
  item,
  isTopic = false,
  notebookID,
  isTrash,
  customStyle,
}) => {
  const [state,] = useTracked();
  const {colors,} = state;

  return (
    <View
      style={[
        {
          height: isTopic ? 80 : 110,
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: 'row',
          paddingRight: 6,
          alignSelf: 'center',
          borderBottomWidth: 1,
          borderBottomColor: item.pinned ? 'transparent' : colors.nav,
          width: '100%',
        },
        customStyle,
      ]}>
      <View
        style={{
          width: '90%',
          maxWidth: '90%',
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
            numberOfLines={2}
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.xs + 1,
              color: colors.pri,
              maxWidth: '100%',
              paddingVertical: 5,
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
              paddingVertical: item.description ? 0 : 5,
            }}>
            {item && item.topics ? (
              item.topics.slice(1, 4).map((topic) => (
                <TouchableOpacity
                  onPress={() => {
                    NavigationService.navigate('Notes', {
                      ...topic,
                    });
                  }}
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
                </TouchableOpacity>
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
      {item.title === 'General' && item.type === 'topic' ? null : (
        <ActionIcon
          color={colors.heading}
          name="dots-horizontal"
          size={SIZE.xl}
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
          }}
          customStyle={{
            justifyContent: 'center',
            height: 35,
            width: 35,
            borderRadius: 100,
            alignItems: 'center',
          }}
        />
      )}
    </View>
  );
};
