import React, {useState, useRef} from 'react';
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
import {ActionSheetComponent} from '../ActionSheetComponent';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

const NoteItem = props => {
  const {colors} = useAppContext();
  const [visible, setVisible] = useState(false);
  const [vaultDialog, setVaultDialog] = useState(false);
  const [unlock, setUnlock] = useState(false);
  const [isPerm, setIsPerm] = useState(false);
  const item = props.item;
  let actionSheet;
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
          marginHorizontal: 12,
          width: props.width,
          paddingRight: 6,
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
        onLongPress={() => props.onLongPress()}
        onPress={() => {
          if (item.locked) {
            setUnlock(true);
            setVaultDialog(true);
          } else {
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
                  {item.colors.length > 0 ? (
                    <View
                      style={{
                        marginRight: 10,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                      {item.colors.map(item => (
                        <View
                          key={item}
                          style={{
                            width: SIZE.xs,
                            height: SIZE.xs,
                            borderRadius: 100,
                            backgroundColor: item,
                            marginRight: -4.5,
                          }}></View>
                      ))}
                    </View>
                  ) : null}

                  {item.locked ? (
                    <Icon
                      style={{marginRight: 10}}
                      name="lock"
                      size={SIZE.xs}
                      color={colors.icon}
                    />
                  ) : null}

                  {item.favorite ? (
                    <Icon
                      style={{marginRight: 10}}
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
                      marginRight: 10,
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
            actionSheet._setModalVisible();
          }}>
          <Icon name="more-horizontal" size={SIZE.lg} color={colors.icon} />
        </TouchableOpacity>

        <ActionSheet
          ref={ref => (actionSheet = ref)}
          customStyles={{
            backgroundColor: colors.bg,
          }}
          indicatorColor={colors.shade}
          onClose={() => {
            onMenuHide();
            if (willRefresh) {
              props.refresh();
            }
          }}>
          <ActionSheetComponent
            item={props.item}
            setWillRefresh={value => {
              willRefresh = true;
            }}
            hasColors={true}
            hasTags={true}
            overlayColor={
              colors.night ? 'rgba(225,225,225,0.1)' : 'rgba(0,0,0,0.3)'
            }
            rowItems={['Add to', 'Share', 'Export', 'Delete']}
            columnItems={['Add to Vault', 'Pin', 'Favorite']}
            close={value => {
              if (value) {
                show = value;
              }
              ActionSheet._setModalVisible();
            }}
          />
        </ActionSheet>
      </View>
    </View>
  );
};

export default NoteItem;
