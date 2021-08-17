import React from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { notesnook } from '../../../e2e/test.ids';
import { useTracked } from '../../provider';
import { useSettingStore } from '../../provider/stores';
import Navigation from '../../services/Navigation';
import { getTotalNotes, history } from '../../utils';
import { SIZE } from '../../utils/SizeUtils';
import { ActionIcon } from '../ActionIcon';
import { Button } from '../Button';
import { ActionSheetEvent } from '../DialogManager/recievers';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const NotebookItem = ({item, isTopic = false, notebookID, isTrash}) => {
  const [state] = useTracked();
  const {colors} = state;
  const settings = useSettingStore(state => state.settings);
  const compactMode = settings.notebooksListMode === 'compact';

  const topics = item.topics?.slice(0, 3) || [];

  const totalNotes = getTotalNotes(item);
  const showActionSheet = () => {
    let rowItems =
      item.type === 'topic'
        ? ['Edit Topic', 'Add Shortcut', 'Delete']
        : ['Edit Notebook', 'Pin', 'Add Shortcut', 'Delete'];
    rowItems = isTrash ? ['Restore', 'PermDelete'] : rowItems;

    ActionSheetEvent(item, false, false, rowItems, {
      notebookID: notebookID
    });
  };

  const navigateToTopic = topic => {
    if (history.selectedItemsList.length > 0) return;
    let routeName = 'NotesPage';
    let params = {...topic, menu: false, get: 'topics'};
    let headerState = {
      heading: topic.title,
      id: topic.id,
      type: topic.type
    };
    Navigation.navigate(routeName, params, headerState);
  };

  return (
    <>
      <View
        style={{
          flexGrow: 1,
          flexShrink: 1
        }}>
        <Heading
          size={SIZE.md}
          numberOfLines={1}
          style={{
            flexWrap: 'wrap'
          }}>
          {item.title}
        </Heading>
        {isTopic || !item.description || compactMode ? null : (
          <Paragraph
            size={SIZE.sm}
            numberOfLines={2}
            style={{
              flexWrap: 'wrap'
            }}>
            {item.description}
          </Paragraph>
        )}

        {isTopic || compactMode ? null : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
            {topics.map(topic => (
              <Button
                title={topic.title}
                key={topic.id}
                height={SIZE.xl}
                textStyle={{
                  fontWeight: 'normal',
                  fontFamily: null,
                }}
                type="grayBg"
                fontSize={SIZE.xs + 1}
                icon="bookmark-outline"
                textStyle={{
                  marginRight: 0
                }}
                iconSize={SIZE.sm}
                style={{
                  borderRadius: 5,
                  maxWidth: 120,
                  borderWidth: 0.5,
                  borderColor: colors.icon,
                  paddingHorizontal: 6,
                  marginVertical:5
                }}
                onPress={() => navigateToTopic(topic)}
              />
            ))}
          </View>
        )}

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            marginTop: 5,
            height: SIZE.md + 2
          }}>
          <Paragraph
            color={colors.accent}
            size={SIZE.xs}
            style={{
              marginRight: 10
            }}>
            {isTopic ? 'Topic' : 'Notebook'}
          </Paragraph>

          {isTrash ? (
            <>
              <Paragraph
                color={colors.icon}
                size={SIZE.xs}
                style={{
                  textAlignVertical: 'center',
                  marginRight: 10
                }}>
                {'Deleted on ' +
                  new Date(item.dateDeleted).toISOString().slice(0, 10)}
              </Paragraph>
              <Paragraph
                color={colors.accent}
                size={SIZE.xs}
                style={{
                  textAlignVertical: 'center',
                  marginRight: 10
                }}>
                {item.itemType[0].toUpperCase() + item.itemType.slice(1)}
              </Paragraph>
            </>
          ) : (
            <Paragraph
              color={colors.icon}
              size={SIZE.xs}
              style={{
                marginRight: 10
              }}>
              {new Date(item.dateCreated).toDateString().substring(4)}
            </Paragraph>
          )}
          <Paragraph
            color={colors.icon}
            size={SIZE.xs}
            style={{
              marginRight: 10
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
                marginTop: 2
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
          alignItems: 'center'
        }}
      />
    </>
  );
};
