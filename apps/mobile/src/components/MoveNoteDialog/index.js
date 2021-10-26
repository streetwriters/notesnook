import React, {createRef, useEffect, useState} from 'react';
import {Keyboard, TextInput, TouchableOpacity, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {notesnook} from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {useNotebookStore, useSelectionStore} from '../../provider/stores';
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  sendNoteEditedEvent,
  ToastEvent,
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {getTotalNotes} from '../../utils';
import {db} from '../../utils/database';
import {eOpenMoveNoteDialog} from '../../utils/Events';
import {pv, SIZE} from '../../utils/SizeUtils';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import {Button} from '../Button';
import DialogHeader from '../Dialog/dialog-header';
import {PressableButton} from '../PressableButton';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

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
      Navigation.routeNames.Notebooks,
    ]);
  };

  const update = note => {
    setNote(note);
  };

  return !visible ? null : (
    <ActionSheetWrapper fwdRef={actionSheetRef} onClose={_onClose}>
      <MoveNoteComponent close={close} note={note} setNote={update} />
    </ActionSheetWrapper>
  );
};

export default MoveNoteDialog;

const MoveNoteComponent = ({close, note, setNote}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  const notebooks = useNotebookStore(state =>
    state.notebooks.filter(n => n.type === 'notebook'),
  );
  const selectedItemsList = useSelectionStore(state => state.selectedItemsList);
  const setNotebooks = useNotebookStore(state => state.setNotebooks);

  const [expanded, setExpanded] = useState('');
  const [notebookInputFocused, setNotebookInputFocused] = useState(false);
  const [topicInputFocused, setTopicInputFocused] = useState(false);
  const [noteExists, setNoteExists] = useState([]);
  const addNewNotebook = async () => {
    if (!newNotebookTitle || newNotebookTitle.trim().length === 0)
      return ToastEvent.show({
        heading: 'Notebook title is required',
        type: 'error',
        context: 'local',
      });

    await db.notebooks.add({
      title: newNotebookTitle,
      description: null,
      topics: [],
      id: null,
    });
    notebookInput.current?.clear();
    notebookInput.current?.blur();
    setNotebooks();
  };

  const addNewTopic = async () => {
    if (!newTopicTitle || newTopicTitle.trim().length === 0) {
      return ToastEvent.show({
        heading: 'Topic title is required',
        type: 'error',
        context: 'local',
      });
    }
    await db.notebooks.notebook(expanded).topics.add(newTopicTitle);
    setNotebooks();
    topicInput.current?.clear();
    topicInput.current?.blur();
    newTopicTitle = null;
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
          Navigation.routeNames.Notes,
        ]);
      }
      setNotebooks();

      return;
    }

    let noteIds = [];
    selectedItemsList.forEach(i => noteIds.push(i.id));

    await db.notes.move(
      {
        topic: item.id,
        id: item.notebookId,
      },
      ...noteIds,
    );
    if (note && note.id) {
      setNote({...db.notes.note(note.id).data});

      Navigation.setRoutesToUpdate([
        Navigation.routeNames.NotesPage,
        Navigation.routeNames.Favorites,
        Navigation.routeNames.Notes,
      ]);
    }
    setNotebooks();
  };

  useEffect(() => {
    if (!note?.id) return;
    let ids = [];

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
  }, []);

  return (
    <>
      <View>
        <TouchableOpacity
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
          }}
          onPress={() => {
            Keyboard.dismiss();
          }}
        />
        <View
          style={{
            paddingHorizontal: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
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
                height: 100,
              }}
            />
          }
          ListHeaderComponent={
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
                width: '100%',
                borderBottomWidth: 1,
                borderColor: colors.nav,
                paddingHorizontal: 12,
              }}>
              <TextInput
                ref={notebookInput}
                onChangeText={value => {
                  newNotebookTitle = value;
                }}
                testID={notesnook.ids.dialogs.addTo.addNotebook}
                blurOnSubmit={false}
                onFocus={() => {
                  setNotebookInputFocused(true);
                }}
                onBlur={() => {
                  setNotebookInputFocused(false);
                }}
                onSubmitEditing={addNewNotebook}
                style={[
                  {
                    color: colors.pri,
                    width: '90%',
                    maxWidth: '90%',
                    paddingHorizontal: 0,
                    borderRadius: 5,
                    minHeight: 45,
                    fontSize: SIZE.md,
                    fontFamily: 'OpenSans-Regular',
                    padding: pv - 2,
                  },
                ]}
                placeholder="Create a new notebook"
                placeholderTextColor={colors.icon}
              />
              <TouchableOpacity
                onPress={addNewNotebook}
                testID={notesnook.ids.dialogs.addTo.addNotebook}
                style={[
                  {
                    borderRadius: 5,
                    minHeight: 45,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}>
                <Icon
                  name="plus"
                  size={SIZE.lg}
                  color={notebookInputFocused ? colors.accent : colors.icon}
                />
              </TouchableOpacity>
            </View>
          }
          renderItem={({item, index}) => (
            <View
              style={{
                height: expanded === item.id ? null : 60,
              }}>
              <PressableButton
                onPress={() => {
                  setExpanded(item.id === expanded ? null : item.id);
                  setTopicInputFocused(false);
                  setNotebookInputFocused(false);
                }}
                type="gray"
                customStyle={{
                  height: 50,
                  width: '100%',
                  borderRadius: 0,
                  alignItems: 'flex-start',
                  marginBottom: 5,
                  borderBottomWidth: 1,
                  borderBottomColor:
                    noteExists.indexOf(item.id) > -1
                      ? colors.accent
                      : colors.nav,
                }}>
                <View
                  style={{
                    width: '100%',
                    height: 50,
                    justifyContent: 'space-between',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
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

                  <Icon
                    name={expanded === item.id ? 'chevron-up' : 'chevron-down'}
                    color={colors.pri}
                    size={SIZE.lg}
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
                    width: '90%',
                    alignSelf: 'flex-end',
                    maxHeight: 500,
                  }}
                  ListHeaderComponent={
                    <View>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          width: '100%',
                          alignSelf: 'flex-end',
                          marginBottom: 5,
                          marginTop: 5,
                          borderBottomWidth: 1,
                          paddingHorizontal: 12,
                          borderColor: colors.nav,
                        }}>
                        <TextInput
                          ref={topicInput}
                          onChangeText={value => {
                            newTopicTitle = value;
                          }}
                          testID={notesnook.ids.dialogs.addTo.addTopic}
                          blurOnSubmit={false}
                          onFocus={() => {
                            setTopicInputFocused(true);
                          }}
                          onBlur={() => {
                            setTopicInputFocused(false);
                          }}
                          onSubmitEditing={addNewTopic}
                          style={[
                            {
                              color: colors.pri,
                              width: '90%',
                              maxWidth: '90%',
                              paddingHorizontal: 0,
                              borderRadius: 5,
                              height: 40,
                              fontSize: SIZE.sm,
                              padding: pv - 2,
                              fontFamily: 'OpenSans-Regular',
                            },
                          ]}
                          placeholder="Add a topic"
                          placeholderTextColor={colors.icon}
                        />
                        <TouchableOpacity
                          onPress={addNewTopic}
                          testID={notesnook.ids.dialogs.addTo.btnTopic}
                          style={[
                            {
                              borderRadius: 5,
                              height: 40,
                              justifyContent: 'center',
                              alignItems: 'center',
                            },
                          ]}>
                          <Icon
                            name="plus"
                            size={SIZE.lg}
                            color={
                              topicInputFocused ? colors.accent : colors.icon
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  }
                  renderItem={({item, index}) => (
                    <PressableButton
                      onPress={() => handlePress(item, index)}
                      type="gray"
                      customStyle={{
                        height: 50,
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: colors.nav,
                        width: '100%',
                        borderRadius: 0,
                        alignItems: 'center',
                        flexDirection: 'row',
                        paddingHorizontal: 12,
                        justifyContent: 'space-between',
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
                          title="Remove"
                          type="error"
                          height={25}
                          fontSize={SIZE.xs + 1}
                          style={{
                            margin: 1,
                            marginRight: 5,
                            paddingHorizontal: 0,
                            paddingVertical: 2.5,
                            borderRadius: 100,
                            paddingHorizontal: 12,
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
