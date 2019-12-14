import React, {useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import NavigationService from '../../services/NavigationService';
import Menu, {MenuItem, MenuDivider} from 'react-native-material-menu';
import {
  COLOR_SCHEME,
  SIZE,
  ph,
  pv,
  opacity,
  WEIGHT,
  br,
} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {w, ToastEvent} from '../../utils/utils';
import {db} from '../../../App';
import {Dialog} from '../Dialog';
import {AddTopicDialog} from '../AddTopicDialog';
import {useAppContext} from '../../provider/useAppContext';
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
  refresh = () => {},
}) => {
  const {colors} = useAppContext();
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
        marginHorizontal: '5%',
        paddingVertical: pv,
        borderRadius: br,
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: ph,
        width: '100%',
        alignSelf: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.nav,
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
          width: '100%',
        }}>
        <TouchableOpacity onPress={navigate}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: WEIGHT.bold,
              fontSize: SIZE.sm,
              color: colors.pri,
              maxWidth: '100%',
            }}>
            {item.title}
          </Text>
          {isTopic ? null : (
            <Text
              numberOfLines={numColumns === 2 ? 3 : 2}
              style={{
                fontFamily: WEIGHT.regular,
                fontSize: SIZE.xs,
                lineHeight: SIZE.sm,
                color: colors.icon,
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
                      fontSize: SIZE.xxs,
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
                size={SIZE.xs}
                color={colors.icon}
              />
              <Icon
                style={{width: 30}}
                name="star"
                size={SIZE.xs}
                color={colors.icon}
              />

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
