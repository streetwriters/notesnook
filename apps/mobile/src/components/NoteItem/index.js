import React, {useEffect} from 'react';
import {Platform} from 'react-native';
import {View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {useSettingStore} from '../../provider/stores';
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

function navigateToNotebook(item) {
  let notebook = item;
  let routeName = 'Notebook';
  let params = {
    menu: false,
    notebook: notebook,
    title: notebook.title
  };

  let headerState = {
    heading: notebook.title,
    id: notebook.id,
    type: notebook.type
  };
  Navigation.navigate(routeName, params, headerState);
}



function navigateToTag(item) {
  let tags = db.tags.all;
  let _tag = tags.find(t => t.title === item);
  let params = {
    ..._tag,
    type: 'tag',
    get: 'tagged'
  };
  Navigation.navigate('NotesPage', params, {
    heading: '#' + _tag.title,
    id: _tag.id,
    type: _tag.type
  });
  eSendEvent(refreshNotesPage, params);
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
          ...android
        ]
  );
};

const NoteItem = ({item, isTrash, tags}) => {
  const [state] = useTracked();
  const {colors} = state;
  const settings = useSettingStore(state => state.settings);
  const compactMode = settings.notesListMode === 'compact';

  return (
    <>
      <View
        style={{
          flexGrow: 1,
          flexShrink: 1
        }}>
        {!compactMode && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              zIndex: 10,
              elevation: 10
            }}>
            {!isTrash && item.notebooks
              ? item.notebooks?.slice(0, 1)?.map(_item => {
                  let notebook = db.notebooks.notebook(_item.id);
                  notebook = notebook?.data;

                  return notebook ? (
                    <Button
                      title={notebook.title}
                      key={_item}
                      height={20}
                      icon="book-outline"
                      type="grayBg"
                      fontSize={SIZE.xs + 1}
                      iconSize={SIZE.sm}
                      textStyle={{
                        marginRight: 0,
                        fontWeight: 'normal',
                        fontFamily: null
                      }}
                      style={{
                        borderRadius: 5,
                        marginRight: 5,
                        borderWidth: 0.5,
                        borderColor: colors.icon,
                        paddingHorizontal: 6
                      }}
                      onPress={() => navigateToNotebook(notebook)}
                    />
                  ) : null;
                })
              : null}
            {!isTrash && tags
              ? tags.slice(0, 2)?.map(item => (
                  <Button
                    title={'#' + db.tags.alias(item)}
                    key={item}
                    height={20}
                    textStyle={{
                      marginRight: 0,
                      fontWeight: 'normal',
                      fontFamily: null
                    }}
                    type="grayBg"
                    fontSize={SIZE.xs + 1}
                    style={{
                      borderRadius: 5,
                      marginRight: 5,
                      borderWidth: 0.5,
                      borderColor: colors.icon,
                      paddingHorizontal: 6,
                      zIndex: 10
                    }}
                    onPress={() => navigateToTag(item)}
                  />
                ))
              : null}
          </View>
        )}

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
              <TimeSince
                style={{
                  fontSize: SIZE.xs + 1,
                  color: colors.icon,
                  marginRight: 10
                }}
                time={item.dateCreated}
                updateFrequency={
                  Date.now() - item.dateCreated < 60000 ? 2000 : 60000
                }
              />

              {item.color ? (
                <View
                  key={item}
                  style={{
                    width: SIZE.xs,
                    height: SIZE.xs,
                    borderRadius: 100,
                    backgroundColor: COLORS_NOTE[item.color.toLowerCase()],
                    marginRight: -4.5,
                    marginRight: 10
                  }}
                />
              ) : null}

              {item.pinned ? (
                <Icon
                  style={{marginRight: 10}}
                  name="pin"
                  size={SIZE.sm}
                  style={{
                    marginRight: 5
                  }}
                  color={COLORS_NOTE[item.color?.toLowerCase()] || colors.accent}
                />
              ) : null}

              {item.locked ? (
                <Icon
                  style={{marginRight: 10}}
                  name="lock"
                  size={SIZE.sm}
                  style={{
                    marginRight: 10
                  }}
                  color={colors.icon}
                />
              ) : null}

              {item.favorite ? (
                <Icon
                  name="star"
                  size={SIZE.md}
                  style={{
                    marginRight: 10
                  }}
                  color="orange"
                />
              ) : null}

              {item.conflicted ? (
                <View
                  style={{
                    marginRight: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                  <Icon
                    name="alert-circle"
                    size={SIZE.xs + 1}
                    color={colors.red}
                  />
                  <Heading
                    size={SIZE.xs}
                    style={{
                      color: colors.red,
                      marginLeft: 2
                    }}>
                    CONFLICTS
                  </Heading>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <Paragraph
                color={colors.icon}
                size={SIZE.xs}
                style={{
                  marginRight: 10
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
                  marginRight: 10
                }}>
                {item.itemType[0].toUpperCase() + item.itemType.slice(1)}
              </Paragraph>
            </>
          )}
        </View>
      </View>
      <ActionIcon
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
