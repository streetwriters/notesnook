import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import {notesnook} from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import Navigation from '../../services/Navigation';
import {ph, pv, SIZE, WEIGHT} from '../../utils/SizeUtils';
import {ActionIcon} from '../ActionIcon';
import {ActionSheetEvent} from '../DialogManager/recievers';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const NotebookItem = ({
  item,
  isTopic = false,
  notebookID,
  isTrash,
  customStyle,
}) => {
  const [state] = useTracked();
  const {colors} = state;

  const showActionSheet = () => {
    let rowItems = isTrash
      ? ['Restore', 'Remove']
      : [item.type == 'topic' ? 'Edit Topic' : 'Edit Notebook', 'Delete'];

    let columnItems = isTrash
      ? []
      : item.type === 'topic'
      ? ['Pin to Menu', 'Unpin from Menu']
      : ['Pin', 'Pin to Menu', 'Unpin from Menu'];

    ActionSheetEvent(item, false, false, rowItems, columnItems, {
      notebookID: notebookID,
    });
  };

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
              item.topics
                .slice(1)
                .sort((a, b) => b.dateEdited - a.dateEdited)
                .slice(0, 2)
                .map((topic) => (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      let routeName = 'NotesPage';
                      let params = {...topic, menu: false};
                      let headerState = {
                        heading: topic.title,
                        id: topic.id,
                        type: topic.type,
                      };
                      Navigation.navigate(routeName, params, headerState);
                    }}
                    key={topic.id}
                    style={{
                      borderRadius: 2.5,
                      backgroundColor: colors.accent,
                      paddingHorizontal: 5,
                      paddingVertical: 2,
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
                      {topic.title.length > 16
                        ? topic.title.slice(0, 16) + '...'
                        : topic.title}
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

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            marginTop: 2.5,
          }}>
          {isTrash ? (
            <>
              <Paragraph
                color={colors.icon}
                size={SIZE.xs}
                style={{
                  textAlignVertical: 'center',
                  marginRight: 10,
                }}>
                {'Deleted on ' +
                  new Date(item.dateDeleted).toISOString().slice(0, 10)}
              </Paragraph>
              <Paragraph
                color={colors.accent}
                size={SIZE.xs}
                style={{
                  textAlignVertical: 'center',
                  marginRight: 10,
                }}>
                {item.itemType[0].toUpperCase() + item.itemType.slice(1)}
              </Paragraph>
            </>
          ) : null}
          {isTrash ? null : (
            <>
              <Paragraph
                color={colors.icon}
                size={SIZE.xs}
                style={{
                  marginRight: 10,
                }}>
                {new Date(item.dateCreated).toDateString().substring(4)}
              </Paragraph>
            </>
          )}
          <Paragraph
            color={colors.icon}
            size={SIZE.xs}
            style={{
              marginRight: 10,
              fontFamily: WEIGHT.regular,
            }}>
            {item && item.totalNotes && item.totalNotes > 1
              ? item.totalNotes + ' Notes'
              : item.totalNotes === 1
              ? item.totalNotes + ' Note'
              : '0 Notes'}
          </Paragraph>

          {item.pinned ? (
            <Icon
              style={{marginRight: 10}}
              name="pin"
              size={SIZE.sm}
              style={{
                marginRight: 10,
                marginTop: 2,
              }}
              color={colors.accent}
            />
          ) : null}
        </View>
      </View>
      {item.title === 'General' && item.type === 'topic' ? null : (
        <ActionIcon
          color={colors.heading}
          name="dots-horizontal"
          testID={notesnook.ids.notebook.menu}
          size={SIZE.xl}
          onPress={showActionSheet}
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
