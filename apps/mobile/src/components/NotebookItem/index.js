import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useTracked } from '../../provider';
import Navigation from '../../services/Navigation';
import { ph, pv, SIZE, WEIGHT } from '../../utils/SizeUtils';
import { ActionIcon } from '../ActionIcon';
import { ActionSheetEvent } from '../DialogManager/recievers';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const NotebookItem = ({
  item,
  isTopic = false,
  notebookID,
  isTrash,
  customStyle,
}) => {
  const [state] = useTracked();
  const {colors} = state;

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
        <Heading
          size={SIZE.md}
          numberOfLines={1}
          style={{
            maxWidth: '100%',
          }}>
          {item.title}
        </Heading>
        {isTopic || !item.description ? null : (
          <Paragraph
            size={SIZE.sm}
            numberOfLines={2}
            style={{
              maxWidth: '100%',
              paddingVertical: 5,
            }}>
            {item.description}
          </Paragraph>
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
              item.topics.slice(1, 3).map((topic) => (
                <TouchableOpacity
                  onPress={() => {
                    Navigation.navigate('NotesPage', {
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
                  <Paragraph
                    size={SIZE.xs}
                    numberOfLines={1}
                    style={{
                      color: 'white',
                      maxWidth: '100%',
                    }}>
                    {topic.title}
                  </Paragraph>
                </TouchableOpacity>
              ))
            ) : (
              <Paragraph
                color={colors.icon}
                size={SIZE.xs}
                style={{
                  paddingVertical: pv / 3,
                  maxWidth: '100%',
                }}>
                This notebook has no topics.
              </Paragraph>
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
            <Paragraph
              color={colors.icon}
              size={SIZE.xs}
              style={{
                textAlignVertical: 'center',
              }}>
              {'Deleted on: ' + item && item.dateDeleted
                ? new Date(item.dateDeleted).toISOString().slice(0, 10)
                : null + '   '}
            </Paragraph>
            <Paragraph
              color={colors.accent}
              size={SIZE.xs}
              style={{
                textAlignVertical: 'center',
              }}>
              {item.type[0].toUpperCase() + item.type.slice(1) + '  '}
            </Paragraph>
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
            <Paragraph
              color={colors.icon}
              size={SIZE.xs}
              style={{
                textAlignVertical: 'center',
              }}>
              {new Date(item.dateCreated).toDateString().substring(4)}
            </Paragraph>
          )}
          <Seperator half />
          <Paragraph
            color={colors.icon}
            size={SIZE.xs}
            style={{
              textAlignVertical: 'center',
              fontFamily: WEIGHT.regular,
            }}>
            {item && item.totalNotes && item.totalNotes > 1
              ? item.totalNotes + ' Notes'
              : item.totalNotes === 1
              ? item.totalNotes + ' Note'
              : '0 Notes'}
          </Paragraph>
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

            let columnItems =
              item.type === 'topic'
                ? ['Pin to Menu', 'Unpin from Menu']
                : ['Pin', 'Pin to Menu', 'Unpin from Menu'];

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
