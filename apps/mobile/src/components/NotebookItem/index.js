import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {notesnook} from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import Navigation from '../../services/Navigation';
import {getTotalNotes, history} from '../../utils';
import {SIZE} from '../../utils/SizeUtils';
import {ActionIcon} from '../ActionIcon';
import {ActionSheetEvent} from '../DialogManager/recievers';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const NotebookItem = ({item, isTopic = false, notebookID, isTrash}) => {
  const [state] = useTracked();
  const {colors} = state;
  const topics = item.topics?.slice(0, 3) || [];
  const totalNotes = getTotalNotes(item);
  const showActionSheet = () => {
    let rowItems = isTrash
      ? ['Restore', 'Remove']
      : [item.type == 'topic' ? 'Edit Topic' : 'Edit Notebook','Pin', 'Add Shortcut','Delete'];

    let columnItems = isTrash
      ? []
      : item.type === 'topic'
      ? ['Add Shortcut', 'Delete']
      : ['Pin', 'Add Shortcut','Delete'];

    ActionSheetEvent(item, false, false, rowItems, columnItems, {
      notebookID: notebookID,
    });
  };

  const navigateToTopic = topic => {
    if (history.selectedItemsList.length > 0) return;
    let routeName = 'NotesPage';
    let params = {...topic, menu: false, get: 'topics'};
    let headerState = {
      heading: topic.title,
      id: topic.id,
      type: topic.type,
    };
    Navigation.navigate(routeName, params, headerState);
  };

  return (
    <>
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
              paddingVertical: 0,
            }}>
            {topics.map(topic => (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigateToTopic(topic)}
                key={topic.id}
                style={{
                  borderRadius: 2.5,
                  backgroundColor: colors.accent,
                  paddingHorizontal: 5,
                  paddingVertical: 2,
                  marginRight: 5,
                  marginVertical: 2.5,
                  maxWidth: 100,
                }}>
                <Paragraph
                  size={SIZE.xs}
                  numberOfLines={1}
                  lineBreakMode="tail"
                  color="white"
                  style={{
                    maxWidth: '100%',
                  }}>
                  {topic.title}
                </Paragraph>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            marginTop: 2.5,
            minHeight: SIZE.md + 2,
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
          ) : (
            <Paragraph
              color={colors.icon}
              size={SIZE.xs}
              style={{
                marginRight: 10,
              }}>
              {new Date(item.dateCreated).toDateString().substring(4)}
            </Paragraph>
          )}

          <Paragraph
            color={colors.icon}
            size={SIZE.xs}
            style={{
              marginRight: 10,
            }}>
            {item && totalNotes > 1
              ? totalNotes + ' notes'
              : totalNotes === 1
              ? totalNotes + ' note'
              : '0 notes'}
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
    </>
  );
};
