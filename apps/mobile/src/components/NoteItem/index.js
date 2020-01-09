import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  TextInput,
  FlatList,
  Modal,
} from 'react-native';
import {
  COLOR_SCHEME,
  SIZE,
  br,
  ph,
  pv,
  WEIGHT,
  opacity,
} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';

import {
  timeSince,
  ToastEvent,
  SideMenuEvent,
  getElevation,
} from '../../utils/utils';
import NavigationService from '../../services/NavigationService';
import Menu, {MenuItem, MenuDivider} from 'react-native-material-menu';
import {Dialog} from '../Dialog';
import {VaultDialog} from '../VaultDialog';
import {db} from '../../../App';
import {DDS} from '../../../App';
import {useAppContext} from '../../provider/useAppContext';
import ActionSheet from '../ActionSheet';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

const NoteItem = props => {
  const {colors} = useAppContext();
  const [visible, setVisible] = useState(false);
  const [vaultDialog, setVaultDialog] = useState(false);
  const [unlock, setUnlock] = useState(false);
  const [isPerm, setIsPerm] = useState(false);
  const item = props.item;

  let show = null;
  let setMenuRef = {};
  let willRefresh = false;

  const onMenuHide = () => {
    if (show) {
      if (show === 'delete') {
        setVisible(true);
        show = null;
      } else if (show == 'lock') {
        setVaultDialog(true);
        show = null;
      } else if (show == 'unlock') {
        setUnlock(true);
        setIsPerm(true);
        setVaultDialog(true);
        show = null;
      }
    }
  };

  const hideMenu = () => {
    setMenuRef[props.index].hide();
  };

  const showMenu = () => {
    setMenuRef[props.index].show();
  };

  const deleteItem = async () => {
    await db.deleteNotes([item]);
    ToastEvent.show('Note moved to trash', 'success', 3000);
    setVisible(false);
    props.refresh();
  };
  return (
    <View
      style={[
        {
          paddingVertical: pv,
          justifyContent: 'flex-start',
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 12,
          width: '100%',
          alignSelf: 'center',
          borderBottomWidth: 1,
          borderBottomColor: colors.nav,
        },
        props.customStyle ? props.customStyle : {},
      ]}>
      <Dialog
        visible={visible}
        title="Delete note"
        icon="trash"
        paragraph="Do you want to delete this note?"
        positiveText="Delete"
        positivePress={deleteItem}
        close={() => {
          setVisible(false);
        }}
      />
      <VaultDialog
        close={() => {
          setVaultDialog(false);
          setUnlock(false);
          setIsPerm(false);
          props.refresh();
        }}
        note={item}
        perm={isPerm}
        openedToUnlock={unlock}
        visible={vaultDialog}
      />

      {props.pinned ? (
        <View
          style={{
            ...getElevation(3),
            width: 30,
            height: 30,
            backgroundColor: colors.accent,
            borderRadius: 100,
            position: 'absolute',
            left: 20,
            top: -15,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View
            style={{
              width: 5,
              height: 5,
              backgroundColor: 'white',
              borderRadius: 100,
            }}
          />
        </View>
      ) : null}

      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          if (item.locked) {
            setUnlock(true);
            setVaultDialog(true);
          } else {
            SideMenuEvent.close();
            SideMenuEvent.disable();
            NavigationService.navigate('Editor', {
              note: item,
            });
          }
        }}
        style={{
          paddingLeft: 0,
          width: '95%',
        }}>
        <>
          <Text
            numberOfLines={1}
            style={{
              color: colors.pri,
              fontSize: SIZE.md,
              fontFamily: WEIGHT.bold,
              maxWidth: '95%',
              marginBottom: 5,
            }}>
            {item.title.replace('\n', '')}
          </Text>
          <View
            style={{
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              width: '100%',
            }}>
            <Text
              style={{
                fontSize: SIZE.xs + 1,
                color: colors.pri,
                fontFamily: WEIGHT.regular,
                width: '100%',
                maxWidth: '100%',
                paddingRight: ph,
              }}>
              {item.headline[item.headline.length - 1] === '\n'
                ? item.headline.slice(0, item.headline.length - 1)
                : item.headline}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                width: '100%',
                marginTop: 10,
              }}>
              {!props.isTrash ? (
                <>
                  <View
                    style={{
                      marginRight: 10,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    {item.colors.map(item => (
                      <View
                        style={{
                          width: SIZE.xs,
                          height: SIZE.xs,
                          borderRadius: 100,
                          backgroundColor: item,
                          marginRight: -4.5,
                        }}></View>
                    ))}
                  </View>

                  {item.locked ? (
                    <Icon
                      style={{marginLeft: 10}}
                      name="lock"
                      size={SIZE.xs}
                      color={colors.icon}
                    />
                  ) : null}

                  {item.favorite ? (
                    <Icon
                      style={{marginLeft: 10}}
                      name="star"
                      size={SIZE.xs + 1}
                      color="orange"
                    />
                  ) : null}
                  <Text
                    style={{
                      color: colors.icon,
                      fontSize: SIZE.xs - 1,
                      textAlignVertical: 'center',
                      fontFamily: WEIGHT.regular,
                      marginLeft: 10,
                    }}>
                    {timeSince(item.dateCreated)}
                  </Text>
                </>
              ) : null}

              {props.isTrash ? (
                <>
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
                </>
              ) : null}
            </View>
          </View>
        </>
      </TouchableOpacity>

      <View
        style={{
          width: DDS.isTab ? w * 0.7 * 0.05 : w * 0.05,
          justifyContent: 'center',
          minHeight: 70,
          alignItems: 'center',
          paddingRight: ph,
        }}>
        <TouchableOpacity
          style={{
            width: w * 0.05,
            justifyContent: 'center',
            minHeight: 70,
            alignItems: 'center',
          }}
          onPress={() => {
            ActionSheet._setModalVisible();
          }}>
          <Icon name="more-horizontal" size={SIZE.lg} color={colors.icon} />
        </TouchableOpacity>

        {/* 
        <Menu
          style={{
            borderRadius: 5,
            backgroundColor: colors.nav,
          }}
          onHidden={onMenuHide}
          ref={ref => (setMenuRef[props.index] = ref)}
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
          {props.isTrash ? (
            <>
              <MenuItem
                onPress={() => {
                  db.restoreItem(item.dateCreated);
                  ToastEvent.show(
                    item.type == 'note' ? 'Note restored' : 'Notebook restored',
                    'success',
                    1000,
                    () => {},
                    '',
                  );
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
                  hideMenu();
                  db.pinItem(item.type, item.dateCreated);
                  props.refresh();

                  ToastEvent.show(
                    `Note ${item.pinned ? 'unpinned' : 'pinned'}`,
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

                  props.refresh();
                  ToastEvent.show(
                    `Note ${item.favorite ? 'removed' : 'added'} to favorites.`,
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
                textStyle={{
                  color: colors.pri,

                  fontFamily: WEIGHT.regular,
                  fontSize: SIZE.sm,
                }}>
                Share
              </MenuItem>

              <MenuItem
                onPress={() => {
                  hideMenu();
                  NavigationService.push('Folders', {
                    note: item,
                    title: 'Choose a notebook',
                    isMove: true,
                    hideMore: true,
                    canGoBack: true,
                  });
                }}
                textStyle={{
                  color: colors.pri,

                  fontFamily: WEIGHT.regular,
                  fontSize: SIZE.sm,
                }}>
                Add to Notebook
              </MenuItem>
              <MenuItem
                onPress={() => {
                  item.locked ? (show = 'unlock') : (show = 'lock');

                  hideMenu(true);
                }}
                textStyle={{
                  color: colors.pri,

                  fontFamily: WEIGHT.regular,
                  fontSize: SIZE.sm,
                }}>
                {item.locked ? 'Remove from vault' : 'Add to Vault'}
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
        </Menu>
      
       */}

        <ActionSheet
          customStyles={{
            backgroundColor: colors.bg,
          }}
          onClose={() => {
            onMenuHide();
            if (willRefresh) {
              props.refresh();
            }
          }}
          children={
            <ActionSheetComponent
              item={item}
              setWillRefresh={value => {
                willRefresh = true;
              }}
              close={value => {
                if (value) {
                  show = value;
                }

                ActionSheet._setModalVisible();
              }}
            />
          }
        />
      </View>
    </View>
  );
};

export default NoteItem;

let tagsInputRef;

const ActionSheetComponent = ({
  close = () => {},
  item = {},
  setWillRefresh = value => {},
}) => {
  const {colors} = useAppContext();
  const [focused, setFocused] = useState(false);
  const [note, setNote] = useState(item ? item : {});

  let tagToAdd = null;
  let backPressCount = 0;

  const _onSubmit = () => {
    if (!tagToAdd || tagToAdd === '#') return;

    let tag = tagToAdd;
    if (tag[0] !== '#') {
      tag = '#' + tag;
    }
    if (tag.includes(' ')) {
      tag = tag.replace(' ', '_');
    }
    let oldProps = {...note};

    if (oldProps.tags.includes(tag)) {
      return;
    } else {
      oldProps.tags.push(tag);
    }

    tagsInputRef.setNativeProps({
      text: '#',
    });
    db.addNote({
      dateCreated: note.dateCreated,
      content: note.content,
      title: note.title,
      tags: oldProps.tags,
    });
    setNote({...db.getNote(note.dateCreated)});
    tagToAdd = '';
    setTimeout(() => {
      //tagsInputRef.focus();
    }, 300);
  };

  const _onKeyPress = event => {
    if (event.nativeEvent.key === 'Backspace') {
      if (backPressCount === 0 && !tagToAdd) {
        backPressCount = 1;

        return;
      }
      if (backPressCount === 1 && !tagToAdd) {
        backPressCount = 0;

        let tagInputValue = note.tags[note.tags.length - 1];
        let oldProps = {...note};
        if (oldProps.tags.length === 1) return;

        oldProps.tags.splice(oldProps.tags.length - 1);

        db.addNote({
          dateCreated: note.dateCreated,
          content: note.content,
          title: note.title,
          tags: oldProps.tags,
        });
        setNote({...db.getNote(note.dateCreated)});

        tagsInputRef.setNativeProps({
          text: tagInputValue,
        });

        setTimeout(() => {
          tagsInputRef.focus();
        }, 300);
      }
    }
  };

  return (
    <View>
      <View
        style={{
          width: w - 24,
          justifyContent: 'space-around',
          alignItems: 'center',
          marginHorizontal: 12,
          paddingVertical: 10,
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderBottomColor: colors.nav,
        }}>
        <TouchableOpacity
          onPress={() => {
            close();
            NavigationService.push('Folders', {
              note: note,
              title: 'Choose a notebook',
              isMove: true,
              hideMore: true,
              canGoBack: true,
            });
          }}
          style={{
            alignItems: 'center',
          }}>
          <Icon
            style={{
              width: 50,
              height: 50,
              borderRadius: 100,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              textAlignVertical: 'center',
              marginBottom: 5,
            }}
            name="arrow-right"
            size={SIZE.lg}
            color={colors.accent}
          />

          <Text
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.xs + 1,
            }}>
            Move to
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            close();
          }}
          style={{
            alignItems: 'center',
          }}>
          <Icon
            style={{
              width: 50,
              height: 50,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              textAlignVertical: 'center',
              marginBottom: 5,
            }}
            name="share-2"
            size={SIZE.lg}
            color={colors.accent}
          />
          <Text
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.xs + 1,
            }}>
            Share
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            close();
          }}
          style={{
            alignItems: 'center',
          }}>
          <Icon
            style={{
              width: 50,
              height: 50,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              textAlignVertical: 'center',
              marginBottom: 5,
            }}
            name="external-link"
            size={SIZE.lg}
            color={colors.accent}
          />

          <Text
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.xs + 1,
            }}>
            Export
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            close('delete');
          }}
          style={{
            alignItems: 'center',
          }}>
          <Icon
            style={{
              width: 50,
              height: 50,
              borderRadius: 100,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              textAlignVertical: 'center',

              marginBottom: 5,
            }}
            name="trash"
            size={SIZE.lg}
            color={colors.accent}
          />

          <Text
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.xs + 1,
            }}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: 12,
          width: '100%',
          marginVertical: 10,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        {['red', 'yellow', 'green', 'blue', 'purple', 'orange', 'gray'].map(
          color => (
            <TouchableOpacity
              onPress={() => {
                let noteColors = note.colors;

                if (noteColors.includes(color)) {
                  noteColors.splice(color, 1);
                } else {
                  noteColors.push(color);
                }

                db.addNote({
                  dateCreated: note.dateCreated,
                  colors: noteColors,
                  content: note.content,
                  title: note.title,
                });
                setNote({...db.getNote(note.dateCreated)});
                setWillRefresh(true);
              }}
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                borderColor: colors.nav,
              }}>
              <View
                style={{
                  width: (w - 12) / 10,
                  height: (w - 12) / 10,
                  backgroundColor: color,
                  borderRadius: 100,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                {note.colors.includes(color) ? (
                  <Icon name="check" color="white" size={SIZE.lg} />
                ) : null}
              </View>
            </TouchableOpacity>
          ),
        )}
      </View>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginHorizontal: 12,
          marginBottom: 0,
          borderRadius: 5,
          borderWidth: 1.5,
          borderColor: focused ? colors.accent : colors.nav,
        }}>
        {note.tags.map(tag => (
          <TouchableOpacity
            onPress={() => {
              let oldProps = {...note};

              oldProps.tags.splice(oldProps.tags.indexOf(tag), 1);
              db.addNote({
                dateCreated: note.dateCreated,
                content: note.content,
                title: note.title,
                tags: oldProps.tags,
              });
              setNote({...db.getNote(note.dateCreated)});
            }}
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
              margin: 1,
              paddingHorizontal: 5,
              paddingVertical: 2.5,
            }}>
            <Text
              style={{
                fontFamily: WEIGHT.regular,
                fontSize: SIZE.sm,
                color: colors.pri,
              }}>
              <Text
                style={{
                  color: colors.accent,
                }}>
                {tag.slice(0, 1)}
              </Text>
              {tag.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        <TextInput
          style={{
            backgroundColor: 'transparent',
            minWidth: 100,
            fontFamily: WEIGHT.regular,
            color: colors.pri,
            paddingHorizontal: 5,
            paddingVertical: 1.5,
            margin: 1,
          }}
          blurOnSubmit={false}
          ref={ref => (tagsInputRef = ref)}
          placeholderTextColor={colors.icon}
          onFocus={() => {
            setFocused(true);
          }}
          selectionColor={colors.accent}
          onBlur={() => {
            setFocused(false);
          }}
          placeholder="#hashtag"
          onChangeText={value => {
            tagToAdd = value;
            if (tagToAdd.length > 0) backPressCount = 0;
          }}
          onSubmitEditing={_onSubmit}
          onKeyPress={_onKeyPress}
        />
      </View>

      <FlatList
        style={{
          marginTop: 10,
        }}
        data={[
          {
            name: 'Pin',
            icon: 'tag',
            func: () => {
              db.pinItem(note.type, note.dateCreated);
              setNote({...db.getNote(note.dateCreated)});
              setWillRefresh(true);
            },
            close: false,
            check: true,
            on: note.pinned,
          },

          {
            name: 'Favorite',
            icon: 'star',
            func: () => {
              db.favoriteItem(note.type, note.dateCreated);
              setNote({...db.getNote(note.dateCreated)});
              setWillRefresh(true);
            },
            close: false,
            check: true,
            on: note.favorite,
          },
          {
            name: 'Add to Vault',
            icon: 'lock',
            func: () => {
              note.locked ? close('unlock') : close('lock');
            },
            close: true,
            check: true,
            on: note.locked,
          },
        ]}
        keyExtractor={(item, index) => item.name}
        renderItem={({item, index}) => (
          <TouchableOpacity
            activeOpacity={opacity}
            onPress={() => {
              item.func();
            }}
            style={{
              width: '100%',
              alignSelf: 'center',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingHorizontal: 12,
              paddingVertical: pv + 5,
              paddingTop: index === 0 ? 5 : pv + 5,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Icon
                style={{
                  width: 30,
                }}
                name={item.icon}
                color={colors.pri}
                size={SIZE.md}
              />
              <Text
                style={{
                  fontFamily: WEIGHT.regular,
                  fontSize: SIZE.sm,
                  color: colors.pri,
                }}>
                {item.name}
              </Text>
            </View>
            {item.switch ? (
              <Icon
                size={SIZE.lg + 2}
                color={item.on ? colors.accent : colors.icon}
                name={item.on ? 'toggle-right' : 'toggle-left'}
              />
            ) : (
              undefined
            )}
            {item.check ? (
              <TouchableOpacity
                style={{
                  borderWidth: 2,
                  borderColor: item.on ? colors.accent : colors.icon,
                  width: 23,
                  height: 23,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 100,
                  paddingTop: 3,
                }}>
                {item.on ? (
                  <Icon size={SIZE.sm - 2} color={colors.accent} name="check" />
                ) : null}
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
