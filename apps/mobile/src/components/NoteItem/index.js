import React, { useEffect } from 'react';
import {Platform, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { notesnook } from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import {useSettingStore, useTagStore} from '../../provider/stores';
import {eSendEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {COLORS_NOTE} from '../../utils/Colors';
import {db} from '../../utils/database';
import {refreshNotesPage} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {ActionIcon} from '../ActionIcon';
import {Button} from '../Button';
import {ActionSheetEvent} from '../DialogManager/recievers';
import {TimeSince} from '../Menu/TimeSince';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const navigateToTopic = topic => {
  let routeName = 'NotesPage';
  let params = {...topic, menu: false, get: 'topics'};
  let headerState = {
    heading: topic.title,
    id: topic.id,
    type: topic.type
  };
  eSendEvent(refreshNotesPage, params);
  Navigation.navigate(routeName, params, headerState);
};

function navigateToTag(item) {
  let _tag = db.tags.tag(item.id);
  if (!_tag) return;
  let params = {
    ..._tag,
    type: 'tag',
    get: 'tagged'
  };

  eSendEvent(refreshNotesPage, params);
  Navigation.navigate('NotesPage', params, {
    heading: '#' + _tag.title,
    id: _tag.id,
    type: _tag.type
  });
}

const showActionSheet = (item, isTrash) => {
  let note = isTrash ? item : db.notes.note(item?.id)?.data;
  let android = Platform.OS === 'android' ? ['PinToNotif'] : [];
  ActionSheetEvent(
    note ? note : item,
    isTrash ? false : true,
    isTrash ? false : true,
    isTrash
      ? ['PermDelete', 'Restore']
      : [
          'Add to notebook',
          'Share',
          'Export',
          'Copy',
          'Publish',
          'Pin',
          'Favorite',
          'Attachments',
          'Vault',
          'Delete',
          'RemoveTopic',
          "History",
          ...android
        ]
  );
};

const NoteItem = ({item, isTrash, tags}) => {
  const [state] = useTracked();
  const {colors} = state;
  const settings = useSettingStore(state => state.settings);
  const compactMode = settings.notesListMode === 'compact';

  function getNotebook() {
    if (isTrash || !item.notebooks || item.notebooks.length < 1) return [];
    let item_notebook = item.notebooks?.slice(0, 1)[0];
    notebook = db.notebooks.notebook(item_notebook.id);

    if (!notebook) return [];
    let topic = notebook.topics.topic(item_notebook.topics[0])?._topic;

    if (!topic) return [];

    notebook = notebook.data;

    return [
      {
        title: `${notebook?.title} › ${topic?.title}`,
        notebook: notebook,
        topic: topic
      }
    ];
  }
  
  return (
    <>
      <View
        style={{
          flexGrow: 1,
          flexShrink: 1
        }}>
        {!compactMode ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              zIndex: 10,
              elevation: 10,
              marginBottom: 2.5
            }}>
            {getNotebook().map(_item => (
              <Button
                title={_item.title}
                key={_item}
                height={20}
                icon="book-outline"
                type="grayBg"
                fontSize={SIZE.xs}
                iconSize={SIZE.sm}
                textStyle={{
                  marginRight: 0
                }}
                style={{
                  borderRadius: 5,
                  marginRight: 5,
                  borderWidth: 0.5,
                  borderColor: colors.icon,
                  paddingHorizontal: 6
                }}
                onPress={() => navigateToTopic(_item.topic)}
              />
            ))}
          </View>
        ) : null}

        <Heading
          numberOfLines={1}
          color={COLORS_NOTE[item.color?.toLowerCase()] || colors.heading}
          style={{
            flexWrap: 'wrap'
          }}
          size={SIZE.md}>
          {item.title}
        </Heading>

        {item.headline && !compactMode ? (
          <Paragraph
            style={{
              flexWrap: 'wrap'
            }}
            numberOfLines={2}>
            {item.headline}
          </Paragraph>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            width: '100%',
            marginTop: 5,
            height: SIZE.md + 2
          }}>
          {!isTrash ? (
            <>
              {item.conflicted ? (
                <Icon
                  name="alert-circle"
                  style={{
                    marginRight: 6
                  }}
                  size={SIZE.sm}
                  color={colors.red}
                />
              ) : null}
              <TimeSince
                style={{
                  fontSize: SIZE.xs,
                  color: colors.icon,
                  marginRight: 6
                }}
                time={item.dateCreated}
                updateFrequency={
                  Date.now() - item.dateCreated < 60000 ? 2000 : 60000
                }
              />

              {/*     {db.attachments?.ofNote(item.id)?.length === 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: 6
                  }}>
                  <Icon name="attachment" size={SIZE.md} color={colors.icon} />
                  <Paragraph color={colors.icon} size={SIZE.xs}>
                    10
                  </Paragraph>
                </View>
              ) : null} */}

              {item.pinned ? (
                <Icon
                  name="pin-outline"
                  size={SIZE.sm}
                  style={{
                    marginRight: 6
                  }}
                  color={
                    COLORS_NOTE[item.color?.toLowerCase()] || colors.accent
                  }
                />
              ) : null}

              {item.locked ? (
                <Icon
                  name="lock"
                  size={SIZE.sm}
                  style={{
                    marginRight: 6
                  }}
                  color={colors.icon}
                />
              ) : null}

              {item.favorite ? (
                <Icon
                  name="star"
                  size={SIZE.md}
                  style={{
                    marginRight: 6
                  }}
                  color="orange"
                />
              ) : null}

              {!isTrash && !compactMode && tags
                ? tags.map(item =>
                    item.id ? (
                      <Button
                        title={'#' + item.alias}
                        key={item.id}
                        height={23}
                        type="gray"
                        textStyle={{
                          textDecorationLine: 'underline'
                        }}
                        hitSlop={{top: 8, bottom: 12, left: 0, right: 0}}
                        fontSize={SIZE.xs}
                        style={{
                          borderRadius: 5,
                          paddingHorizontal: 6,
                          marginRight: 4,
                          zIndex: 10,
                          maxWidth: tags.length > 1 ? 130 : null
                        }}
                        onPress={() => navigateToTag(item)}
                      />
                    ) : null
                  )
                : null}
            </>
          ) : (
            <>
              <Paragraph
                color={colors.icon}
                size={SIZE.xs}
                style={{
                  marginRight: 6
                }}>
                Deleted on{' '}
                {item && item.dateDeleted
                  ? new Date(item.dateDeleted).toISOString().slice(0, 10)
                  : null}
              </Paragraph>

              <Paragraph
                color={colors.accent}
                size={SIZE.xs}
                style={{
                  marginRight: 6
                }}>
                {item.itemType[0].toUpperCase() + item.itemType.slice(1)}
              </Paragraph>
            </>
          )}
        </View>
      </View>
      <ActionIcon
        testID={notesnook.listitem.menu}
        color={colors.pri}
        name="dots-horizontal"
        size={SIZE.xl}
        onPress={() => showActionSheet(item, isTrash)}
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

export default NoteItem;
