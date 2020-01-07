import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import {COLOR_SCHEME, SIZE, br, ph, pv, WEIGHT} from '../../common/common';
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
          marginHorizontal: '5%',
          paddingVertical: pv,
          justifyContent: 'flex-start',
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 0,
          width: DDS.isTab ? '95%' : '90%',
          marginHorizontal: '5%',
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
                    {['red', 'green'].map(item => (
                      <View
                        style={{
                          width: SIZE.xs,
                          height: SIZE.xs,
                          borderRadius: 100,
                          backgroundColor: item,
                          marginRight: -5.5,
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
      </View>
    </View>
  );
};

export default NoteItem;
