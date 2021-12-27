import React, {createRef, useEffect, useState} from 'react';
import {Keyboard, TextInput, TouchableOpacity, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {notesnook} from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {useNotebookStore, useSelectionStore, useSettingStore} from '../../provider/stores';
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  sendNoteEditedEvent,
  ToastEvent
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {getTotalNotes} from '../../utils';
import {db} from '../../utils/database';
import {eOpenMoveNoteDialog} from '../../utils/Events';
import {pv, SIZE} from '../../utils/SizeUtils';
import SheetWrapper from '../Sheet';
import {Button} from '../Button';
import DialogHeader from '../Dialog/dialog-header';
import {PressableButton} from '../PressableButton';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import Input from '../Input';
import {ActionIcon} from '../ActionIcon';
import {Dialog} from '../Dialog';
import {presentDialog} from '../Dialog/functions';

let newNotebookTitle = null;
let newTopicTitle = null;
const notebookInput = createRef();
const topicInput = createRef();
const actionSheetRef = createRef();
const MoveNoteDialog = () => {
  const [visible, setVisible] = useState(false);
  const [note, setNote] = useState(null);

  function open(note) {
    setNote(note);
    setVisible(true);
    actionSheetRef.current?.setModalVisible(true);
  }
  const close = () => {
    actionSheetRef.current?.setModalVisible(false);
  };

  useEffect(() => {
    eSubscribeEvent(eOpenMoveNoteDialog, open);
    return () => {
      eUnSubscribeEvent(eOpenMoveNoteDialog, open);
    };
  }, []);

  const _onClose = () => {
    setVisible(false);
    newTopicTitle = null;
    newNotebookTitle = null;
    setNote(null);
    Navigation.setRoutesToUpdate([
      Navigation.routeNames.Notes,
      Navigation.routeNames.Favorites,
      Navigation.routeNames.NotesPage,
      Navigation.routeNames.Notebook,
      Navigation.routeNames.Notebooks
    ]);
  };

  const update = note => {
    setNote(note);
  };

  return !visible ? null : (
    <SheetWrapper fwdRef={actionSheetRef} onClose={_onClose}>
      <MoveNoteComponent close={close} note={note} setNote={update} />
    </SheetWrapper>
  );
};

export default MoveNoteDialog;

const MoveNoteComponent = ({close, note, setNote}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  const notebooks = useNotebookStore(state =>
    state.notebooks.filter(n => n.type === 'notebook')
  );
  const selectedItemsList = useSelectionStore(state => state.selectedItemsList);
  const setNotebooks = useNotebookStore(state => state.setNotebooks);
  const [expanded, setExpanded] = useState('');
  const [notebookInputFocused, setNotebookInputFocused] = useState(false);
  const [noteExists, setNoteExists] = useState([]);
  const addNewNotebook = async () => {
    if (!newNotebookTitle || newNotebookTitle.trim().length === 0)
      return ToastEvent.show({
        heading: 'Notebook title is required',
        type: 'error',
        context: 'local'
      });

    let id = await db.notebooks.add({
      title: newNotebookTitle,
      description: null,
      topics: [],
      id: null
    });
    console.log("added notebook id",id);
    setExpanded(id);
    openAddTopicDialog(db.notebooks.notebook(id).data);
    notebookInput.current?.clear();
    notebookInput.current?.blur();
    setNotebooks();
    updateNoteExists();
  };

  const addNewTopic = async (value,item) => {
    if (!value || value.trim().length === 0) {
      ToastEvent.show({
        heading: 'Topic title is required',
        type: 'error',
        context: 'local'
      });
      return false;
    }
    console.log(item.id);
    await db.notebooks.notebook(item.id).topics.add(value);
    setNotebooks();
    updateNoteExists();
    return true;
  };

  const handlePress = async (item, index) => {
    if (note && item.notes.indexOf(note.id) > -1) {
      await db.notebooks
        .notebook(item.notebookId)
        .topics.topic(item.id)
        .delete(note.id);

      if (note && note.id) {
        setNote({...db.notes.note(note.id).data});
        Navigation.setRoutesToUpdate([
          Navigation.routeNames.NotesPage,
          Navigation.routeNames.Favorites,
          Navigation.routeNames.Notes
        ]);
      }
      setNotebooks();
      updateNoteExists();

      return;
    }

    let noteIds = [];
    selectedItemsList.forEach(i => noteIds.push(i.id));

    await db.notes.move(
      {
        topic: item.id,
        id: item.notebookId
      },
      ...noteIds
    );
    if (note && note.id) {
      setNote({...db.notes.note(note.id).data});

      Navigation.setRoutesToUpdate([
        Navigation.routeNames.NotesPage,
        Navigation.routeNames.Favorites,
        Navigation.routeNames.Notes
      ]);
    }
    setNotebooks();
    updateNoteExists();
  };

  useEffect(() => {
    updateNoteExists();
  }, []);

  const updateNoteExists = () => {
    if (!note?.id) return;
    let ids = [];
    let notebooks = db.notebooks.all;
    for (let i = 0; i < notebooks.length; i++) {
      if (notebooks[i].topics) {
        for (let t = 0; t < notebooks[i].topics.length; t++) {
          if (notebooks[i].topics[t].notes.indexOf(note.id) > -1) {
            ids.push(notebooks[i].id);
          }
        }
      }
    }
    setNoteExists(ids);
  };

  const openAddTopicDialog = item => {
    presentDialog({
      context: 'move_note',
      input: true,
      inputPlaceholder: 'Enter title',
      title: 'New topic',
      paragraph: 'Add a new topic in ' + item.title,
      positiveText: 'Add',
      positivePress: value => {
        return addNewTopic(value,item);
      }
    });

  };

  return (
    <>
      <Dialog context="move_note" />
      <View>
        <TouchableOpacity
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute'
          }}
          onPress={() => {
            Keyboard.dismiss();
          }}
        />
        <View
          style={{
            paddingHorizontal: 12,
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}>
          <DialogHeader
            title="Add to notebook"
            paragraph={`Add your notes in notebooks to find them easily.`}
          />
        </View>

        <FlatList
          nestedScrollEnabled={true}
          onScrollEndDrag={() => {
            actionSheetRef.current?.handleChildScrollEnd();
          }}
          onMomentumScrollEnd={() => {
            actionSheetRef.current?.handleChildScrollEnd();
          }}
          onScrollAnimationEnd={() => {
            actionSheetRef.current?.handleChildScrollEnd();
          }}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          data={notebooks}
          ListFooterComponent={
            <View
              style={{
                height: 100
              }}
            />
          }
          ListHeaderComponent={
            <View
              style={{
                width: '100%',
                marginTop: 10
              }}>
              <Input
                fwdRef={notebookInput}
                onChangeText={value => {
                  newNotebookTitle = value;
                }}
                testID={notesnook.ids.dialogs.addTo.addNotebook}
                blurOnSubmit={false}
                onFocusInput={() => {
                  setNotebookInputFocused(true);
                }}
                onBlurInput={() => {
                  setNotebookInputFocused(false);
                }}
                button={{
                  icon: 'check',
                  color: notebookInputFocused ? colors.accent : colors.icon
                }}
                onSubmit={addNewNotebook}
                placeholder="Create a new notebook"
              />
            </View>
          }
          style={{
            paddingHorizontal: 12
          }}
          renderItem={({item, index}) => (
            <View
              style={{
                borderWidth: 1,
                borderColor: expanded ? colors.nav : 'transparent',
                borderRadius: 6,
                overflow: 'hidden',
                marginBottom: 10
              }}>
              <PressableButton
                onPress={() => {
                  if (!item.topics || item.topics.length === 0) {
                    setExpanded(item.id);
                    openAddTopicDialog(item);
                    return;
                  }
                  setExpanded(item.id === expanded ? null : item.id);
                  setNotebookInputFocused(false);
                }}
                type="grayBg"
                customStyle={{
                  height: 50,
                  width: '100%',
                  borderRadius: 5,
                  alignItems: 'flex-start'
                }}>
                <View
                  style={{
                    width: '100%',
                    height: 50,
                    justifyContent: 'space-between',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12
                  }}>
                  <View>
                    <Heading
                      color={
                        noteExists.indexOf(item.id) > -1 ? colors.accent : null
                      }
                      size={SIZE.md}>
                      {item.title}
                    </Heading>
                    {item.topics?.length > 0 ? (
                      <Paragraph size={SIZE.xs} color={colors.icon}>
                        {getTotalNotes(item) + ' notes' + ' & '}
                        {item.topics.length === 1
                          ? item.topics.length + ' topic'
                          : item.topics.length + ' topics'}
                      </Paragraph>
                    ) : null}
                  </View>

                  <ActionIcon
                    name={expanded === item.id ? 'plus' : 'chevron-down'}
                    color={expanded === item.id ? colors.accent : colors.pri}
                    size={SIZE.xl}
                    onPress={() => {
                      if (expanded !== item.id) {
                        setExpanded(item.id);
                        return;
                      }
                      setExpanded(item.id);
                      openAddTopicDialog(item);
                    }}
                  />
                </View>
              </PressableButton>

              {expanded === item.id ? (
                <FlatList
                  nestedScrollEnabled
                  data={item.topics}
                  keyboardShouldPersistTaps="always"
                  keyboardDismissMode="none"
                  onScrollEndDrag={() => {
                    actionSheetRef.current?.handleChildScrollEnd();
                  }}
                  onMomentumScrollEnd={() => {
                    actionSheetRef.current?.handleChildScrollEnd();
                  }}
                  onScrollAnimationEnd={() => {
                    actionSheetRef.current?.handleChildScrollEnd();
                  }}
                  style={{
                    width: '100%',
                    alignSelf: 'flex-end',
                    maxHeight: 500
                  }}
                  renderItem={({item, index}) => (
                    <PressableButton
                      onPress={() => handlePress(item, index)}
                      type="gray"
                      customStyle={{
                        height: 50,
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: index === 0 ? null : colors.nav,
                        width: '100%',
                        borderRadius: 0,
                        alignItems: 'center',
                        flexDirection: 'row',
                        paddingHorizontal: 12,
                        justifyContent: 'space-between'
                      }}>
                      <View>
                        <Paragraph color={colors.heading}>
                          {item.title}
                        </Paragraph>
                        <Paragraph color={colors.icon} size={SIZE.xs}>
                          {item.notes.length + ' notes'}
                        </Paragraph>
                      </View>
                      {note && item.notes.indexOf(note.id) > -1 ? (
                        <Button
                          onPress={() => handlePress(item, index)}
                          icon="check"
                          iconColor={colors.accent}
                          iconSize={SIZE.lg}
                          height={35}
                          width={35}
                          style={{
                            borderRadius: 100,
                            paddingHorizontal: 0
                          }}
                        />
                      ) : null}
                    </PressableButton>
                  )}
                />
              ) : null}
            </View>
          )}
        />
      </View>
    </>
  );
};
