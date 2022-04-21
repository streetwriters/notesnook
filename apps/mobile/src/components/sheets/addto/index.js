import React, { createRef, useEffect, useState } from 'react';
import { Keyboard, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { notesnook } from '../../../../e2e/test.ids';
import { eSubscribeEvent, eUnSubscribeEvent, ToastEvent } from '../../../services/event-manager';
import Navigation from '../../../services/navigation';
import SearchService from '../../../services/search';
import { useNotebookStore, useSelectionStore } from '../../../stores/stores';
import { useThemeStore } from '../../../stores/theme';
import { getTotalNotes } from '../../../utils';
import { db } from '../../../utils/database';
import { eOpenMoveNoteDialog } from '../../../utils/events';
import layoutmanager from '../../../utils/layout-manager';
import { SIZE } from '../../../utils/size';
import { Dialog } from '../../dialog';
import DialogHeader from '../../dialog/dialog-header';
import { presentDialog } from '../../dialog/functions';
import { Button } from '../../ui/button';
import { IconButton } from '../../ui/icon-button';
import Input from '../../ui/input';
import { PressableButton } from '../../ui/pressable';
import SheetWrapper from '../../ui/sheet';
import Heading from '../../ui/typography/heading';
import Paragraph from '../../ui/typography/paragraph';

let newNotebookTitle = null;
const notebookInput = createRef();
const actionSheetRef = createRef();
const AddToNotebookSheet = () => {
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

  return !visible ? null : (
    <SheetWrapper fwdRef={actionSheetRef} onClose={_onClose}>
      <MoveNoteComponent note={note} />
    </SheetWrapper>
  );
};

export default AddToNotebookSheet;

const MoveNoteComponent = ({ note }) => {
  const colors = useThemeStore(state => state.colors);

  const notebooks = useNotebookStore(state => state.notebooks.filter(n => n?.type === 'notebook'));

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
    console.log('added notebook id', id);
    setExpanded(id);
    openAddTopicDialog(db.notebooks.notebook(id).data);
    notebookInput.current?.clear();
    notebookInput.current?.blur();
    setNotebooks();
    updateNoteExists();
  };

  const addNewTopic = async (value, item) => {
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
    let noteIds = selectedItemsList.length > 0 ? selectedItemsList.map(n => n.id) : [note?.id];

    if (getCount(item)) {
      await db.notebooks
        .notebook(item.notebookId)
        .topics.topic(item.id)
        .delete(...noteIds);
    } else {
      await db.notes.move(
        {
          topic: item.id,
          id: item.notebookId
        },
        ...noteIds
      );
    }

    Navigation.setRoutesToUpdate([
      Navigation.routeNames.NotesPage,
      Navigation.routeNames.Favorites,
      Navigation.routeNames.Notes
    ]);
    setNotebooks();
    updateNoteExists();
    SearchService.updateAndSearch();
  };

  useEffect(() => {
    updateNoteExists();
  }, []);

  const updateNoteExists = () => {
    if (!note?.id && selectedItemsList?.length === 0) return;

    let notes = selectedItemsList.length > 0 ? selectedItemsList.map(n => n.id) : [note?.id];
    let ids = [];
    let notebooks = db.notebooks.all;
    for (let i = 0; i < notebooks.length; i++) {
      if (notebooks[i].topics) {
        for (let t = 0; t < notebooks[i].topics.length; t++) {
          let topic = notebooks[i].topics[t];
          if (topic.type !== 'topic') continue;
          for (let id of notes) {
            if (topic.notes.indexOf(id) > -1) {
              console.log('found', ids.indexOf(notebooks[i].id));
              if (ids.indexOf(notebooks[i].id) === -1) {
                ids.push(notebooks[i].id);
              }
              if (ids.indexOf(topic.id) === -1) ids.push(topic.id);
            }
          }
        }
      }
    }
    console.log('ids: ', ids);
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
        return addNewTopic(value, item);
      }
    });
  };

  const getCount = topic => {
    if (!topic) return;
    let notes = selectedItemsList.length > 0 ? selectedItemsList.map(n => n.id) : [note?.id];
    let count = 0;
    for (let id of notes) {
      if (topic.notes.indexOf(id) > -1) {
        count++;
      }
    }
    return count > 0 && notes.length > 0
      ? `${count} of ${notes.length} selected notes exist in this topic. (Tap to remove)`
      : null;
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
          }}
        >
          <DialogHeader
            title="Add to notebook"
            paragraph={`Add your notes to notebooks to find them easily.`}
          />
        </View>

        <FlatList
          nestedScrollEnabled={true}
          onMomentumScrollEnd={() => {
            actionSheetRef.current?.handleChildScrollEnd();
          }}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          data={notebooks}
          ListFooterComponent={
            <View
              style={{
                height: 200
              }}
            />
          }
          ListHeaderComponent={
            <View
              style={{
                width: '100%',
                marginTop: 10
              }}
            >
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
                  color: notebookInputFocused ? colors.accent : colors.icon,
                  onPress: addNewNotebook
                }}
                onSubmit={addNewNotebook}
                placeholder="Create a new notebook"
              />
            </View>
          }
          style={{
            paddingHorizontal: 12
          }}
          renderItem={({ item, index }) => (
            <View
              style={{
                borderWidth: 1,
                borderColor: expanded ? colors.nav : 'transparent',
                borderRadius: 6,
                overflow: 'hidden',
                marginBottom: 10
              }}
            >
              <PressableButton
                onPress={() => {
                  if (!item.topics || item.topics.length === 0) {
                    setExpanded(item.id);
                    openAddTopicDialog(item);
                    return;
                  }
                  layoutmanager.withAnimation(200);
                  setExpanded(item.id === expanded ? null : item.id);
                  setNotebookInputFocused(false);
                }}
                type="grayBg"
                customStyle={{
                  height: 50,
                  width: '100%',
                  borderRadius: 5,
                  alignItems: 'flex-start'
                }}
              >
                <View
                  style={{
                    width: '100%',
                    height: 50,
                    justifyContent: 'space-between',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12
                  }}
                >
                  <View>
                    <Heading
                      color={noteExists.indexOf(item.id) > -1 ? colors.accent : null}
                      size={SIZE.md}
                    >
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

                  <IconButton
                    name={expanded === item.id ? 'plus' : 'chevron-down'}
                    color={expanded === item.id ? colors.accent : colors.pri}
                    size={SIZE.xl}
                    onPress={() => {
                      if (expanded !== item.id) {
                        setExpanded(item.id);
                        return;
                      }
                      layoutmanager.withAnimation(200);
                      setExpanded(item.id);
                      openAddTopicDialog(item);
                    }}
                  />
                </View>
              </PressableButton>

              {expanded === item.id ? (
                <FlatList
                  nestedScrollEnabled
                  data={item.topics?.filter(t => t.type === 'topic')}
                  keyboardShouldPersistTaps="always"
                  keyboardDismissMode="none"
                  onMomentumScrollEnd={() => {
                    actionSheetRef.current?.handleChildScrollEnd();
                  }}
                  style={{
                    width: '100%',
                    alignSelf: 'flex-end',
                    maxHeight: 500
                  }}
                  renderItem={({ item, index }) => (
                    <PressableButton
                      onPress={() => handlePress(item, index)}
                      type="gray"
                      customStyle={{
                        minHeight: 50,
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: index === 0 ? null : colors.nav,
                        width: '100%',
                        borderRadius: 0,
                        alignItems: 'center',
                        flexDirection: 'row',
                        paddingHorizontal: 12,
                        justifyContent: 'space-between',
                        paddingVertical: 12
                      }}
                    >
                      <View>
                        <Paragraph color={colors.heading}>{item.title}</Paragraph>
                        <Paragraph color={colors.icon} size={SIZE.xs}>
                          {item.notes.length + ' notes'}
                        </Paragraph>
                        {getCount(item) ? (
                          <View
                            style={{
                              backgroundColor: colors.nav,
                              borderRadius: 5,
                              paddingHorizontal: 5,
                              paddingVertical: 2,
                              marginTop: 5
                            }}
                          >
                            <Paragraph color={colors.icon} size={SIZE.xs}>
                              {getCount(item)}
                            </Paragraph>
                          </View>
                        ) : null}
                      </View>
                      {noteExists.indexOf(item.id) > -1 ? (
                        <Button
                          onPress={() => handlePress(item, index)}
                          icon="check"
                          testID="icon-check"
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
