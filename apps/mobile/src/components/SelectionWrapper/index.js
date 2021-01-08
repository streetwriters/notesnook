import React, {useEffect, useState} from 'react';
import {TouchableOpacity, View, Clipboard} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  openVault,
  sendNoteEditedEvent,
  ToastEvent,
} from '../../services/EventManager';
import {dWidth, getElevation, toTXT} from '../../utils';
import {hexToRGBA} from '../../utils/ColorUtils';
import {db} from '../../utils/DB';
import {refreshNotesPage} from '../../utils/Events';
import {deleteItems} from '../../utils/functions';
import {SIZE} from '../../utils/SizeUtils';
import {ActionIcon} from '../ActionIcon';
import {Button} from '../Button';
import {simpleDialogEvent} from '../DialogManager/recievers';
import {TEMPLATE_PERMANANT_DELETE} from '../DialogManager/Templates';
import {PressableButton} from '../PressableButton';
import Heading from '../Typography/Heading';
const Filler = ({item, background}) => {
  const [state] = useTracked();
  const {colors, currentEditingNote} = state;
  const color = item.color || 'accent';

  return (
    <View
      style={{
        position: 'absolute',
        width: '110%',
        height: '110%',
        paddingVertical: '3.5%',
        paddingHorizontal: '5%',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
      }}>
      <View
        style={{
          flexDirection: 'row',
        }}>
        {item.conflicted ? (
          <View
            style={{
              backgroundColor: hexToRGBA(colors.red, 0.12),
              paddingHorizontal: 3,
              paddingVertical: 2,
              borderRadius: 3,
              marginRight: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Icon name="alert-circle" size={SIZE.xxs} color={colors.red} />
            <Heading
              size={SIZE.xxs}
              style={{
                color: colors.red,
                marginLeft: 5,
              }}>
              CONFLICTS
            </Heading>
          </View>
        ) : null}

        {currentEditingNote === item.id ? (
          <View
            style={{
              backgroundColor: hexToRGBA(colors[color], 0.12),
              paddingHorizontal: 3,
              paddingVertical: 2,
              borderRadius: 3,
              marginRight: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Icon name="pencil-outline" size={SIZE.xxs} color={colors[color]} />
            <Heading
              size={SIZE.xxs}
              style={{marginLeft: 5}}
              color={colors[color]}>
              EDITING NOW
            </Heading>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const ActionStrip = ({note, setActionStrip}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode} = state;
  const [isPinnedToMenu, setIsPinnedToMenu] = useState(false);
  const [width, setWidth] = useState(dWidth);
  useEffect(() => {
    if (note.type === 'note') return;
    setIsPinnedToMenu(db.settings.isPinned(note.id));
  }, []);

  const updateNotes = () => {
    dispatch({type: Actions.NOTES});
    sendNoteEditedEvent({id: note.id, forced: true});
    dispatch({type: Actions.FAVORITES});
    eSendEvent(refreshNotesPage);
  };

  const actions = [
    {
      title: 'Pin ' + note.type,
      icon: note.pinned ? 'pin-off' : 'pin',
      visible: note.type === 'note' || note.type === 'notebook',
      onPress: async () => {
        if (!note.id) return;

        if (note.type === 'note') {
          if (db.notes.pinned.length === 3 && !note.pinned) {
            ToastEvent.show('You cannot pin more than 3 notes', 'error');
            return;
          }
          await db.notes.note(note.id).pin();
        } else {
          if (db.notebooks.pinned.length === 3 && !note.pinned) {
            ToastEvent.show('You cannot pin more than 3 notebooks', 'error');
            return;
          }
          await db.notebooks.notebook(note.id).pin();
          dispatch({type: Actions.NOTEBOOKS});
        }
        updateNotes();
        setActionStrip(false);
      },
    },
    {
      title: 'Add to favorites',
      icon: note.favorite ? 'star-off' : 'star',
      onPress: async () => {
        if (!note.id) return;
        if (note.type === 'note') {
          await db.notes.note(note.id).favorite();
        } else {
          await db.notebooks.notebook(note.id).favorite();
        }
        updateNotes();
        setActionStrip(false);
      },
      visible: note.type === 'note',
      color: !note.favorite ? 'orange' : null,
    },

    {
      title: isPinnedToMenu
        ? 'Remove Shortcut from Menu'
        : 'Add Shortcut to Menu',
      icon: isPinnedToMenu ? 'link-variant-remove' : 'link-variant',
      onPress: async () => {
        try {
          if (isPinnedToMenu) {
            await db.settings.unpin(note.id);
            ToastEvent.show('Shortcut removed from menu', 'success');
          } else {
            if (note.type === 'topic') {
              await db.settings.pin(note.type, {
                id: note.id,
                notebookId: note.notebookId,
              });
            } else {
              await db.settings.pin(note.type, {id: note.id});
            }

            ToastEvent.show('Shortcut added to menu', 'success');
          }
          setIsPinnedToMenu(db.settings.isPinned(note.id));
          dispatch({type: Actions.MENU_PINS});

          setActionStrip(false);
        } catch (e) {}
      },
      visible: note.type !== 'note',
    },
    {
      title: 'Copy Note',
      icon: 'content-copy',
      visible: note.type === 'note',
      onPress: async () => {
        if (note.locked) {
          openVault({
            copyNote: true,
            novault: true,
            locked: true,
            item: note,
          });
        } else {
          let delta = await db.notes.note(note.id).content();
          let text = toTXT(delta);
          text = `${note.title}\n \n ${text}`;
          Clipboard.setString(text);
          ToastEvent.show('Note copied to clipboard', 'success');
        }
        setActionStrip(false);
      },
    },
    {
      title: 'Restore ' + note.itemType,
      icon: 'delete-restore',
      onPress: async () => {
        await db.trash.restore(note.id);
        dispatch({type: Actions.TRASH});
        dispatch({type: note.itemType});
        dispatch({type: Actions.FAVORITES});
        eSendEvent(refreshNotesPage);
        ToastEvent.show(
          item.type === 'note' ? 'Note restored' : 'Notebook restored',
          'success',
        );
        setActionStrip(false);
      },
      visible: note.type === 'trash',
    },
    {
      title: 'Delete' + note.itemType,
      icon: 'delete',
      visible: note.type === 'trash',
      onPress: () => {
        simpleDialogEvent(TEMPLATE_PERMANANT_DELETE);
        setActionStrip(false);
      },
    },
    {
      title: 'Delete' + note.type,
      icon: 'delete',
      visible: note.type !== 'trash',
      onPress: async () => {
        try {
          await deleteItems(note);
        } catch (e) {}
        setActionStrip(false);
      },
    },
    {
      title: 'Close',
      icon: 'close',
      onPress: () => setActionStrip(false),
      color: colors.light,
      bg: colors.red,
      visible: true,
    },
  ];

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{
        position: 'absolute',
        zIndex: 10,
        width: '102%',
        height: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}>
      <Button
        type="accent"
        title="Select"
        icon="check"
        tooltipText="Select Item"
        onPress={(event) => {
          if (!selectionMode) {
            dispatch({type: Actions.SELECTION_MODE, enabled: true});
          }
          dispatch({type: Actions.SELECTED_ITEMS, item: note});
          setActionStrip(false);
        }}
        style={{
          borderRadius: 100,
          paddingHorizontal: 12,
          ...getElevation(5),
        }}
        height={30}
      />
      {actions.map(
        (item) =>
          item.visible && (
            <View
              key={item.icon}
              style={{
                width: width / 1.4 / actions.length,
                height: width / 1.4 / actions.length,
                backgroundColor: item.bg || colors.nav,
                borderRadius: 100,
                justifyContent: 'center',
                alignItems: 'center',
                ...getElevation(5),
                marginLeft: 15,
              }}>
              <ActionIcon
                color={item.color || colors.heading}
                onPress={item.onPress}
                tooltipText={item.title}
                top={60}
                bottom={60}
                name={item.icon}
                size={width / 2.8 / actions.length}
              />
            </View>
          ),
      )}
    </View>
  );
};

const SelectionWrapper = ({
  children,
  item,
  index,
  background,
  onLongPress,
  onPress,
  testID,
}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, selectedItemsList} = state;
  const [selected, setSelected] = useState(false);
  const [actionStrip, setActionStrip] = useState(false);

  useEffect(() => {
    if (selectionMode) {
      setActionStrip(false);
      let exists = selectedItemsList.filter(
        (o) => o.dateCreated === item.dateCreated,
      );

      if (exists[0]) {
        if (!selected) {
          setSelected(true);
        }
      } else {
        if (selected) {
          setSelected(false);
        }
      }
    }
  }, [selectedItemsList]);

  const onLong = () => {
    if (selectionMode) return;
    console.log(item.type,item.title)
    if (item.type === 'topic' && item.title === 'General') return;

    setActionStrip(!actionStrip);
  };

  const _onPress = async () => {
    if (actionStrip) {
      setActionStrip(false);
      return;
    }
    await onPress();
  };

  const closeStrip = () => {
    setActionStrip(false);
  };

  useEffect(() => {
    eSubscribeEvent('navigate', closeStrip);

    return () => {
      eUnSubscribeEvent('navigate', closeStrip);
    };
  }, []);

  return (
    <PressableButton
      customColor="transparent"
      testID={testID}
      onLongPress={onLong}
      onPress={_onPress}
      customSelectedColor={colors.nav}
      customAlpha={!colors.night ? -0.02 : 0.02}
      customOpacity={1}
      customStyle={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        borderRadius: 0,
        overflow: 'hidden',
        paddingHorizontal: 12,
        marginTop:
          index === 0 && !selectionMode
            ? 15
            : index === 0 && selectionMode
            ? 30
            : 0,
      }}>
      {actionStrip && (
        <ActionStrip note={item} setActionStrip={setActionStrip} />
      )}

      {item.type === 'note' && <Filler background={background} item={item} />}

      {selectionMode && (
        <View
          style={{
            display: 'flex',
            opacity: 1,
            width: '10%',
            height: 70,
            justifyContent: 'center',
            alignItems: 'center',
            paddingRight: 8,
          }}>
          {item.type !== 'topic' ||
          (item.type === 'topic' && item.title !== 'General') ? (
            <TouchableOpacity
              activeOpacity={1}
              onPress={onLongPress}
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                height: 70,
              }}>
              <Icon
                size={SIZE.lg}
                color={selected ? colors.accent : colors.icon}
                name={
                  selected
                    ? 'check-circle-outline'
                    : 'checkbox-blank-circle-outline'
                }
              />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {children}
    </PressableButton>
  );
};

export default SelectionWrapper;
