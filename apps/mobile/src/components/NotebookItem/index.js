import React, {useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import NavigationService from '../../services/NavigationService';
import Menu, {MenuItem, MenuDivider} from 'react-native-material-menu';
import {SIZE, ph, pv, opacity, WEIGHT, br} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {w, ToastEvent} from '../../utils/utils';
import {db, DDS} from '../../../App';
import {Dialog} from '../Dialog';
import {AddTopicDialog} from '../AddTopicDialog';
import {useAppContext} from '../../provider/useAppContext';
import {AddNotebookDialog} from '../AddNotebookDialog';

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
  isTrash,
  refresh = () => {},
}) => {
  const {colors} = useAppContext();
  const [isVisible, setVisible] = useState(false);
  const [addTopic, setAddTopic] = useState(false);
  const [addNotebook, setAddNotebook] = useState(false);
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
          title: hideMore ? 'Choose a topic' : item.title,
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
        isTopic ? setAddTopic(true) : setAddNotebook(true);
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
        paddingVertical: isTopic ? pv / 2 : pv,
        borderRadius: br,
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 0,
        width: DDS.isTab ? '95%' : '90%',
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
      <AddNotebookDialog
        visible={addNotebook}
        toEdit={item}
        close={() => {
          setAddNotebook(false);
        }}
      />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}>
        <TouchableOpacity
          style={{
            width: '75%',
          }}
          onPress={navigate}>
          <Text
            numberOfLines={1}
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
                {'Deleted on: ' +
                  new Date(item.dateDeleted).toISOString().slice(0, 10) +
                  '   '}
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

          {isTopic || isTrash ? null : (
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
          {isTopic ? (
            <Text
              style={{
                color: colors.icon,
                fontSize: SIZE.xxs,
                textAlignVertical: 'center',
                fontFamily: WEIGHT.regular,
                marginTop: 5,
              }}>
              {item.totalNotes.length == 1
                ? item.totalNotes + ' notes'
                : item.totalNotes + ' note'}
            </Text>
          ) : null}
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
            {isTrash ? (
              <>
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
                  Restore
                </MenuItem>
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
                  Remove
                </MenuItem>
              </>
            ) : (
              <>
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
                  Edit
                </MenuItem>

                <MenuItem
                  onPress={() => {
                    hideMenu();
                    db.pinItem(item.type, item.dateCreated);
                    refresh();

                    ToastEvent.show(
                      `Notebook ${item.pinned ? 'unpinned' : 'pinned'}`,
                      item.pinned ? 'error' : 'success',
                      3000,
                      () => {},
                      '',
                    );
                  }}
                  textStyle={{
                    color: colors.pri,

                    fontFamily: WEIGHT.regular,
                    fontSize: SIZE.sm,
                  }}>
                  {item.pinned ? 'Unpin' : 'Pin'}
                </MenuItem>
                <MenuItem
                  onPress={() => {
                    hideMenu();
                    db.favoriteItem(item.type, item.dateCreated);

                    refresh();
                    ToastEvent.show(
                      `Notebook ${
                        item.favorite ? 'removed' : 'added'
                      } to favorites.`,
                      item.favorite ? 'error' : 'success',
                      3000,
                      () => {},
                      '',
                    );
                  }}
                  textStyle={{
                    color: colors.pri,

                    fontFamily: WEIGHT.regular,
                    fontSize: SIZE.sm,
                  }}>
                  {item.favorite ? 'Unfavorite' : 'Favorite'}
                </MenuItem>

                <MenuItem
                  onPress={() => {
                    show = 'delete';
                    hideMenu();
                  }}
                  textStyle={{
                    color: colors.errorText,
                    fontFamily: WEIGHT.regular,
                    fontSize: SIZE.sm,
                  }}>
                  Delete
                </MenuItem>
              </>
            )}

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
              ToastEvent.show(
                `Note moved to ${item.title}`,
                'success',
                3000,
                () => {},
                '',
              );
            }}
            style={{
              borderWidth: 1,
              borderRadius: 5,
              width: '20%',
              paddingHorizontal: ph - 5,
              borderColor: colors.nav,
              paddingVertical: pv - 5,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.accent,
            }}>
            <Text
              style={{
                fontSize: SIZE.sm,
                fontFamily: WEIGHT.regular,
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
