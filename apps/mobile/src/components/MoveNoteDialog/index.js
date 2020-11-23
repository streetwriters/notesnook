import React, {createRef, useEffect, useState} from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent,
} from '../../services/EventManager';
import {getElevation} from '../../utils';
import {db} from '../../utils/DB';
import {eOpenMoveNoteDialog} from '../../utils/Events';
import {pv, SIZE, WEIGHT} from '../../utils/SizeUtils';
import DialogButtons from '../Dialog/dialog-buttons';
import DialogHeader from '../Dialog/dialog-header';
import {PressableButton} from '../PressableButton';
import {Toast} from '../Toast';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

let newNotebookTitle = null;
let newTopicTitle = null;
const notebookInput = createRef();
const topicInput = createRef();

const MoveNoteDialog = () => {
  const [state, dispatch] = useTracked();
  const {notebooks, colors, selectedItemsList} = state;
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState('');
  const [notebookInputFocused, setNotebookInputFocused] = useState(false);
  const [topicInputFocused, setTopicInputFocused] = useState(false);

  function open() {
    setVisible(true);
  }

  const close = () => {
    setVisible(false);
    setExpanded(false);
    newTopicTitle = null;
    newNotebookTitle = null;
    setNotebookInputFocused(false);
    setTopicInputFocused(false);
  };

  useEffect(() => {
    eSubscribeEvent(eOpenMoveNoteDialog, open);
    return () => {
      eUnSubscribeEvent(eOpenMoveNoteDialog, open);
    };
  }, []);

  const addNewNotebook = async () => {
    if (!newNotebookTitle || newNotebookTitle.trim().length === 0)
      return ToastEvent.show('Title is required', 'error', 'local');

    await db.notebooks.add({
      title: newNotebookTitle,
      description: 'this.description',
      topics: [],
      id: null,
    });
    notebookInput.current?.clear();
    notebookInput.current?.blur();
    dispatch({type: Actions.NOTEBOOKS});
    dispatch({type: Actions.PINNED});
  };

  const addNewTopic = async () => {
    if (!newTopicTitle || newTopicTitle.trim().length === 0) {
      return ToastEvent.show('Title is required', 'error', 'local');
    }
    let res = await db.notebooks.notebook(expanded).topics.add(newTopicTitle);
    dispatch({type: Actions.NOTEBOOKS});
    dispatch({type: Actions.PINNED});
    topicInput.current?.clear();
    topicInput.current?.blur();
    newTopicTitle = null;
  };

  return !visible ? null : (
    <Modal
      animated={true}
      animationType="slide"
      onRequestClose={close}
      visible={true}
      transparent={true}>
      <SafeAreaView
        style={{
          height: '100%',
          width: '100%',
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          style={{
            flex: 1,
            backgroundColor: DDS.isTab ? 'rgba(0,0,0,0.3)' : colors.bg,
            width: '100%',
            height: '100%',
            alignSelf: 'center',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <TouchableOpacity
            onPress={close}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              zIndex: 1,
            }}
          />

          <View
            style={{
              ...getElevation(DDS.isTab ? 10 : 0),
              width: DDS.isTab ? 500 : '100%',
              height: DDS.isTab ? 500 : '100%',
              flex: 1,
              borderRadius: DDS.isTab ? 5 : 0,
              backgroundColor: colors.bg,
              padding: DDS.isTab ? 8 : 0,
              zIndex: 10,
              paddingVertical: 12,
            }}>
            <View
              style={{
                paddingHorizontal: 12,
              }}>
              <DialogHeader
                title="Add to notebook"
                paragraph={`Organize your notes to find them easily.`}
              />
            </View>

            <FlatList
              data={state.notebooks}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              ListHeaderComponent={
                <View
                  style={{
                    paddingHorizontal: 12,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingHorizontal: 0,
                      marginBottom: 10,
                      width: '100%',
                      borderBottomWidth: 1,
                      borderColor: notebookInputFocused
                        ? colors.accent
                        : colors.nav,
                    }}>
                    <TextInput
                      ref={notebookInput}
                      onChangeText={(value) => {
                        newNotebookTitle = value;
                      }}
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
                          width: '85%',
                          maxWidth: '85%',
                          paddingHorizontal: 0,
                          borderRadius: 5,
                          minHeight: 45,
                          fontSize: SIZE.md,
                          fontFamily: WEIGHT.regular,
                          padding: pv - 2,
                        },
                      ]}
                      placeholder="Add a notebook"
                      placeholderTextColor={colors.icon}
                    />
                    <TouchableOpacity
                      onPress={addNewNotebook}
                      style={[
                        {
                          borderRadius: 5,
                          width: '12%',
                          minHeight: 45,
                          justifyContent: 'center',
                          alignItems: 'center',
                        },
                      ]}>
                      <Icon
                        name="plus"
                        size={SIZE.lg}
                        color={
                          notebookInputFocused ? colors.accent : colors.icon
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              }
              renderItem={({item, index}) => (
                <View>
                  <PressableButton
                    onPress={() => {
                      setExpanded(item.id === expanded ? null : item.id);
                    }}
                    color={expanded === item.id ? colors.shade : 'transparent'}
                    selectedColor={
                      expanded === item.id ? colors.accent : colors.nav
                    }
                    alpha={colors.night ? 0.02 : -0.02}
                    opacity={expanded === item.id ? 0.12 : 1}
                    customStyle={{
                      height: 50,
                      width: '100%',
                      borderRadius: 0,
                      alignItems: 'flex-start',
                      paddingHorizontal: 12,
                      marginBottom: 5,
                    }}>
                    <View
                      style={{
                        borderBottomWidth: 1,
                        width: '100%',
                        height: 50,
                        justifyContent: 'center',
                        borderBottomColor:
                          expanded === item.id ? 'transparent' : colors.nav,
                      }}>
                      <Heading size={SIZE.md}>
                        {item.title}
                        {'\n'}
                        <Paragraph size={SIZE.xs} color={colors.icon}>
                          {item.totalNotes +
                            ' notes' +
                            ' & ' +
                            item.topics.length +
                            ' topics'}
                        </Paragraph>
                      </Heading>
                    </View>
                  </PressableButton>

                  {expanded === item.id ? (
                    <FlatList
                      data={item.topics}
                      keyboardShouldPersistTaps="always"
                      keyboardDismissMode="none"
                      ListHeaderComponent={
                        <View
                          style={{
                            paddingRight: 12,
                          }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              width: '90%',
                              alignSelf: 'flex-end',
                              marginBottom: 5,
                              marginTop: 5,
                              borderBottomWidth: 1,
                              borderColor: topicInputFocused
                                ? colors.accent
                                : colors.nav,
                            }}>
                            <TextInput
                              ref={topicInput}
                              onChangeText={(value) => {
                                newTopicTitle = value;
                              }}
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
                                  width: '85%',
                                  maxWidth: '85%',
                                  paddingHorizontal: 0,
                                  borderRadius: 5,
                                  height: 40,
                                  fontSize: SIZE.sm,
                                  fontFamily: WEIGHT.regular,
                                  padding: pv - 2,
                                },
                              ]}
                              placeholder="Add a Topic"
                              placeholderTextColor={colors.icon}
                            />
                            <TouchableOpacity
                              onPress={addNewTopic}
                              style={[
                                {
                                  borderRadius: 5,
                                  width: 40,
                                  minHeight: 40,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                },
                              ]}>
                              <Icon
                                name="plus"
                                size={SIZE.lg}
                                color={
                                  topicInputFocused
                                    ? colors.accent
                                    : colors.icon
                                }
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      }
                      renderItem={({item, index}) => (
                        <PressableButton
                          onPress={async () => {
                            let noteIds = [];
                            selectedItemsList.forEach((i) =>
                              noteIds.push(i.id),
                            );

                            let res = await db.notes.move(
                              {
                                topic: item.title,
                                id: item.notebookId,
                              },
                              ...noteIds,
                            );
                            dispatch({type: Actions.CLEAR_SELECTION});
                            dispatch({type: Actions.NOTEBOOKS});
                            dispatch({type: Actions.PINNED});
                            close();
                            let notebookName = db.notebooks.notebook(
                              item.notebookId,
                            ).title;
                            ToastEvent.show(
                              `Note moved to ${item.title} in ${notebookName}`,
                              'success',
                            );
                          }}
                          color="transparent"
                          selectedColor={colors.nav}
                          alpha={colors.night ? 0.02 : -0.02}
                          customStyle={{
                            height: 50,
                            borderTopWidth: index === 0 ? 0 : 1,
                            borderTopColor: colors.nav,
                            width: '87%',
                            alignSelf: 'flex-end',
                            borderRadius: 0,
                            alignItems: 'center',
                            marginRight: 12,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                          }}>
                          <Paragraph color={colors.heading}>
                            {item.title}
                            {'\n'}
                            <Paragraph color={colors.icon} size={SIZE.xs}>
                              {item.totalNotes + ' notes'}
                            </Paragraph>
                          </Paragraph>
                        </PressableButton>
                      )}
                    />
                  ) : null}
                </View>
              )}
            />

            <DialogButtons negativeTitle="Cancel" onPressNegative={close} />
          </View>
          <Toast context="local" />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default MoveNoteDialog;
