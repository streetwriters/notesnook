import React, {useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import NavigationService from '../../services/NavigationService';
import Menu, {MenuItem, MenuDivider} from 'react-native-material-menu';
import {COLOR_SCHEME, SIZE, ph, pv, opacity, WEIGHT} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {w, ToastEvent} from '../../utils/utils';
import {db} from '../../../App';
import {Dialog} from '../Dialog';
import {AddTopicDialog} from '../AddTopicDialog';
export const NotebookItem = ({
  item,
  index,
  hideMore = false,
  topic,
  isTopic = false,
  isMove = false,
  noteToMove = null,
  notebookID,
  refresh = () => {},
}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [isVisible, setVisible] = useState(false);
  const [addTopic, setAddTopic] = useState(false);
  let setMenuRef = {};
  let show = null;

  const deleteItem = async () => {
    if (isTopic) {
      await db.deleteTopicFromNotebook(notebookID, item.title);
      ToastEvent.show('Topic moved to trash', 'success', 3000);
    } else {
      await db.deleteNotebooks([item]);
      ToastEvent.show('Notebook moved to trash', 'success', 3000);
    }
    refresh();
    setVisible(false);
  };

  const navigate = () => {
    isTopic
      ? NavigationService.navigate('Notes', {
          ...item,
          notebookID,
        })
      : NavigationService.navigate('Notebook', {
          notebook: item,
          note: noteToMove,

          title: hideMore ? 'Choose topic' : item.title,
          isMove: isMove ? true : false,
          hideMore: hideMore ? true : false,
        });
  };

  const onMenuHide = () => {
    if (show) {
      if (show === 'delete') {
        setVisible(true);
        show = null;
      } else if (show === 'topic') {
        setAddTopic(true);
        show = null;
      }
    }
  };

  const hideMenu = () => {
    setMenuRef[index].hide();
  };

  const showMenu = () => {
    setMenuRef[index].show();
  };
  return (
    <View
      style={{
        paddingHorizontal: ph,
        marginHorizontal: '5%',
        borderBottomWidth: 1,
        borderBottomColor: colors.nav,
        paddingVertical: pv,
      }}>
      <Dialog
        visible={isVisible}
        title={`Delete ${isTopic ? 'topic' : 'notebook'}`}
        icon="trash"
        paragraph={`Do you want to delete this ${
          isTopic ? 'topic' : 'notebook'
        }?`}
        positiveText="Delete"
        positivePress={deleteItem}
        close={() => setVisible(false)}
      />
      <AddTopicDialog
        visible={addTopic}
        toEdit={item}
        close={() => setAddTopic(false)}
      />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <TouchableOpacity onPress={navigate}>
          <Text
            style={{
              fontFamily: WEIGHT.bold,
              fontSize: SIZE.md,
              color: colors.pri,
              maxWidth: '100%',
            }}>
            {item.title}
          </Text>
          {isTopic ? null : (
            <Text
              style={{
                fontFamily: WEIGHT.regular,
                fontSize: SIZE.xs + 1,
                color: colors.pri,
                maxWidth: '100%',
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
                width: '80%',
                maxWidth: '80%',
              }}>
              {item.topics.slice(0, 2).map(topic => (
                <View
                  style={{
                    borderRadius: 5,
                    backgroundColor: colors.accent,
                    paddingHorizontal: ph / 1.5,
                    paddingVertical: pv / 4,
                    marginRight: 10,
                  }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: 'white',
                      fontFamily: WEIGHT.regular,
                      fontSize: SIZE.xxs + 1,
                      maxWidth: '100%',
                    }}>
                    {topic.title}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {isTopic ? null : (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                marginTop: 5,
              }}>
              <Icon
                style={{width: 30}}
                name="lock"
                size={SIZE.sm}
                color={colors.icon}
              />
              <Icon
                style={{width: 30}}
                name="star"
                size={SIZE.sm}
                color={colors.icon}
              />

              <Text
                style={{
                  color: colors.accent,
                  fontSize: SIZE.xxs + 1,
                  textAlignVertical: 'center',
                  fontFamily: WEIGHT.regular,
                }}>
                {new Date(item.dateCreated).toDateString().substring(4)}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {hideMore ? null : (
          <Menu
            style={{
              borderRadius: 5,
              backgroundColor: colors.nav,
            }}
            onHidden={onMenuHide}
            ref={ref => (setMenuRef[index] = ref)}
            button={
              <TouchableOpacity
                style={{
                  width: w * 0.05,
                  justifyContent: 'center',
                  minHeight: 70,
                  alignItems: 'center',
                }}
                onPress={showMenu}>
                <Icon name="more-vertical" size={SIZE.lg} color={colors.icon} />
              </TouchableOpacity>
            }>
            <MenuItem
              onPress={() => {
                show = 'topic';
                hideMenu();
              }}
              textStyle={{
                color: colors.pri,

                fontFamily: WEIGHT.regular,
                fontSize: SIZE.sm,
              }}>
              <Icon name="edit-2" size={SIZE.sm} color={colors.icon} />
              {'  '}Edit
            </MenuItem>

            <MenuItem
              textStyle={{
                color: colors.pri,

                fontFamily: WEIGHT.regular,
                fontSize: SIZE.sm,
              }}>
              <Icon name="star" size={SIZE.sm} color={colors.icon} />
              {'  '}Pin
            </MenuItem>
            <MenuItem
              onPress={() => {
                hideMenu();
                ToastEvent.show(
                  'Note added to favorites.',
                  'success',
                  3000,
                  () => {},
                  'Ok',
                );
              }}
              textStyle={{
                color: colors.pri,

                fontFamily: WEIGHT.regular,
                fontSize: SIZE.sm,
              }}>
              <Icon name="star" size={SIZE.sm} color={colors.icon} />
              {'  '}Favorite
            </MenuItem>

            <MenuItem
              onPress={() => {
                show = 'delete';
                hideMenu();
              }}
              textStyle={{
                color: colors.pri,

                fontFamily: WEIGHT.regular,
                fontSize: SIZE.sm,
              }}>
              <Icon name="trash" size={SIZE.sm} color={colors.icon} />
              {'  '}Delete
            </MenuItem>
            <MenuDivider />
          </Menu>
        )}
        {hideMore && isTopic ? (
          <TouchableOpacity
            activeOpacity={opacity}
            onPress={async () => {
              if (!noteToMove.notebook.notebook) {
                await db.addNoteToTopic(
                  notebookID,
                  item.title,
                  noteToMove.dateCreated,
                );
              } else if (noteToMove.notebook.notebook) {
                await db.moveNote(noteToMove.dateCreated, noteToMove.notebook, {
                  notebook: notebookID,
                  topic: item.title,
                });
              }

              NavigationService.navigate('Home');
              ToastEvent.show(`Note moved to ${item.title}`, 'success', 3000);
            }}
            style={{
              borderWidth: 1,
              borderRadius: 5,
              width: '20%',
              paddingHorizontal: ph - 5,
              borderColor: colors.nav,
              paddingVertical: pv,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.accent,
            }}>
            <Text
              style={{
                fontSize: SIZE.xs,
                fontFamily: WEIGHT.semibold,
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
