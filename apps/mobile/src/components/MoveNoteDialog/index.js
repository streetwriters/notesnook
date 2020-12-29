import React, {createRef, useEffect, useState} from 'react';
import {Keyboard, TextInput, TouchableOpacity, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {notesnook} from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent,
} from '../../services/EventManager';
import {db} from '../../utils/DB';
import {
  eOnNewTopicAdded,
  eOpenMoveNoteDialog,
  refreshNotesPage,
} from '../../utils/Events';
import {pv, SIZE, WEIGHT} from '../../utils/SizeUtils';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import DialogHeader from '../Dialog/dialog-header';
import {PressableButton} from '../PressableButton';
import {Toast} from '../Toast';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

let newNotebookTitle = null;
let newTopicTitle = null;
const notebookInput = createRef();
const topicInput = createRef();
const actionSheetRef = createRef();
const MoveNoteDialog = () => {
  const [, dispatch] = useTracked();
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
    eSendEvent(refreshNotesPage);
    eSendEvent(eOnNewTopicAdded);
    dispatch({type: Actions.CLEAR_SELECTION});
    dispatch({type: Actions.NOTEBOOKS});
    dispatch({type: Actions.NOTES});
  };

  const update = (note) => {
    console.log(note.notebooks.length);
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
  const {colors, selectedItemsList} = state;
  const [expanded, setExpanded] = useState('');
  const [notebookInputFocused, setNotebookInputFocused] = useState(false);
  const [topicInputFocused, setTopicInputFocused] = useState(false);

  const addNewNotebook = async () => {
    if (!newNotebookTitle || newNotebookTitle.trim().length === 0)
      return ToastEvent.show('Title is required', 'error', 'local');

    await db.notebooks.add({
      title: newNotebookTitle,
      description: null,
      topics: [],
      id: null,
    });
    notebookInput.current?.clear();
    notebookInput.current?.blur();
    dispatch({type: Actions.NOTEBOOKS});
  };

  const addNewTopic = async () => {
    if (!newTopicTitle || newTopicTitle.trim().length === 0) {
      return ToastEvent.show('Title is required', 'error', 'local');
    }
    await db.notebooks.notebook(expanded).topics.add(newTopicTitle);
    dispatch({type: Actions.NOTEBOOKS});
    topicInput.current?.clear();
    topicInput.current?.blur();
    newTopicTitle = null;
  };

  const handlePress = async (item, index) => {
    if (
      note?.notebooks?.findIndex(
        (o) =>
          o.topics.findIndex((i) => {
            return i === item.id;
          }) > -1,
      ) > -1
    ) {
      await db.notebooks
        .notebook(item.notebookId)
        .topics.topic(item.id)
        .delete(note.id);

      if (note && note.id) {
        setNote({...db.notes.note(note.id).data});
      }
      dispatch({type: Actions.NOTEBOOKS});
      return;
    }

    let noteIds = [];
    selectedItemsList.forEach((i) => noteIds.push(i.id));
    console.log(noteIds, 'NOTE IDS');
    await db.notes.move(
      {
        topic: item.id,
        id: item.notebookId,
      },
      ...noteIds,
    );
    if (note && note.id) {
      setNote({...db.notes.note(note.id).data});
    }
    dispatch({type: Actions.NOTEBOOKS});
  };

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
            actionSheetRef.current?.childScrollHandler();
          }}
          onMomentumScrollEnd={() => {
            actionSheetRef.current?.childScrollHandler();
          }}
          onScrollAnimationEnd={() => {
            actionSheetRef.current?.childScrollHandler();
          }}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          data={state.notebooks}
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
                onChangeText={(value) => {
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
                    fontFamily: WEIGHT.regular,
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
                    expanded === item.id ? colors.accent : colors.nav,
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
                      color={expanded === item.id ? colors.accent : null}
                      size={SIZE.md}>
                      {item.title}
                    </Heading>
                    <Paragraph size={SIZE.xs} color={colors.icon}>
                      Notebook{' '}
                      {item.totalNotes +
                        ' notes' +
                        ' & ' +
                        item.topics.length +
                        ' topics'}
                    </Paragraph>
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
                    actionSheetRef.current?.childScrollHandler();
                  }}
                  onMomentumScrollEnd={() => {
                    actionSheetRef.current?.childScrollHandler();
                  }}
                  onScrollAnimationEnd={() => {
                    actionSheetRef.current?.childScrollHandler();
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
                          onChangeText={(value) => {
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
                              fontFamily: WEIGHT.regular,
                              padding: pv - 2,
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
                          {'\n'}
                          <Paragraph color={colors.icon} size={SIZE.xs}>
                            {item.totalNotes + ' notes'}
                          </Paragraph>
                        </Paragraph>
                      </View>
                      {note?.notebooks?.findIndex(
                        (o) => o.topics.indexOf(item.id) > -1,
                      ) > -1 ? (
                        <Paragraph size={SIZE.sm} color={colors.errorText}>
                          Remove Note
                        </Paragraph>
                      ) : null}
                    </PressableButton>
                  )}
                />
              ) : null}
            </View>
          )}
        />
      </View>
      <Toast context="local" />
    </>
  );
};
