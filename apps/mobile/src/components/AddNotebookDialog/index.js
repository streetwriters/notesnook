import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {FlatList, TextInput} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Actions} from '../../provider/Actions';
import {Button} from '../Button';
import {updateEvent} from '../DialogManager/recievers';
import {Toast} from '../Toast';
import {ToastEvent} from '../../services/EventManager';
import {ph, pv, SIZE, WEIGHT} from '../../utils/SizeUtils';
import {db} from '../../utils/DB';
import {DDS} from '../../services/DeviceDetection';
import {ActionIcon} from '../ActionIcon';
import DialogButtons from '../Dialog/dialog-buttons';
import DialogHeader from '../Dialog/dialog-header';
import Paragraph from '../Typography/Paragraph';

let refs = [];

export class AddNotebookDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      topics: [],
      description: null,
      titleFocused: false,
      descFocused: false,
      count: 0,
      topicInputFocused: false,
      editTopic: false,
    };
    this.title = null;
    this.description = null;
    this.listRef;
    this.prevItem = null;
    this.prevIndex = null;
    this.currentSelectedInput = null;
    this.id = null;
    this.backPressCount = 0;
    this.currentInputValue = null;
    this.titleRef;
    this.descriptionRef;
    this.topicsToDelete = [];
  }

  open = () => {
    refs = [];
    let {toEdit} = this.props;

    if (toEdit && toEdit.type === 'notebook') {
      let topicsList = [];
      toEdit.topics.forEach((item, index) => {
        if (index === 0) return;
        topicsList.push(item.title);
      });
      console.log(topicsList);
      this.id = toEdit.id;
      this.title = toEdit.title;
      this.description = toEdit.description;

      this.setState({
        topics: [...topicsList],

        visible: true,
      });
    } else {
      this.setState({
        visible: true,
      });
    }
  };

  close = () => {
    refs = [];
    this.prevIndex = null;
    this.prevItem = null;
    this.currentSelectedInput = null;
    this.title = null;
    this.description = null;
    this.id = null;
    this.setState({
      visible: false,
      topics: [],
      descFocused: false,
      titleFocused: false,
    });
  };

  onDelete = (index) => {
    let {topics} = this.state;
    let prevTopics = topics;
    refs = [];
    prevTopics.splice(index, 1);
    let edit = this.props.toEdit;
    if (edit && edit.id) {
      let topicToDelete = edit.topics[index + 1];
      console.log(topicToDelete);
      if (topicToDelete) {
        this.topicsToDelete.push(topicToDelete.id);
      }
    }
    let nextTopics = [...prevTopics];
    if (this.prevIndex === index) {
      this.prevIndex = null;
      this.prevItem = null;
      this.currentInputValue = null;
      this.topicInputRef.setNativeProps({
        text: null,
      });
    }
    this.setState({
      topics: nextTopics,
    });
  };

  addNewNotebook = async () => {
    let {topics} = this.state;
    let edit = this.props.toEdit;

    if (!this.title || this.title?.trim().length === 0)
      return ToastEvent.show('Title is required', 'error', 'local');

    let id = edit && edit.id ? edit.id : null;

    let toEdit;
    if (id) {
      toEdit = db.notebooks.notebook(edit.id).data;
    }

    let prevTopics = [...topics];

    if (this.currentInputValue && this.currentInputValue.trim().length !== 0) {
      if (this.prevItem != null) {
        prevTopics[this.prevIndex] = this.currentInputValue;
      } else {
        prevTopics.push(this.currentInputValue);
        this.currentInputValue = null;
      }
    }
    if (id) {
      if (this.topicsToDelete?.length > 0) {
        await db.notebooks
          .notebook(toEdit.id)
          .topics.delete(...this.topicsToDelete);
        toEdit = db.notebooks.notebook(toEdit.id).data;
      }

      await db.notebooks.add({
        title: this.title,
        description: this.description,
        id: id,
      });

      let nextTopics = toEdit.topics.map((topic, index) => {
        if (index === 0) return topic;
        let copy = {...topic};
        copy.title = prevTopics[index - 1];
        return copy;
      });

      prevTopics.forEach((title, index) => {
        if (!nextTopics[index + 1]) {
          nextTopics.push(title);
        }
      });

      await db.notebooks.notebook(id).topics.add(...nextTopics);
    } else {
      await db.notebooks.add({
        title: this.title,
        description: this.description,
        topics: prevTopics,
        id: id,
      });
    }
    this.close();
    updateEvent({type: Actions.NOTEBOOKS});
    updateEvent({type: Actions.PINNED});

    //ToastEvent.show('New notebook added', 'success', 'local');
  };

  onSubmit = (forward = true) => {
    let {topics} = this.state;
    if (!this.currentInputValue || this.currentInputValue?.trim().length === 0)
      return;

    let prevTopics = [...topics];
    if (this.prevItem === null) {
      prevTopics.push(this.currentInputValue);
      this.setState({
        topics: prevTopics,
      });
      this.topicInputRef.setNativeProps({
        text: null,
      });

      setTimeout(() => {
        this.listRef.scrollToEnd({animated: true});
      }, 30);
      this.currentInputValue = null;
    } else {
      prevTopics[this.prevIndex] = this.currentInputValue;
      this.setState({
        topics: prevTopics,
      });
      this.currentInputValue = null;
      /*   if (prevTopics[this.prevIndex + 1] && forward) {
                this.prevIndex = this.prevIndex + 1;
                this.prevItem = prevTopics[this.prevIndex];
                this.currentInputValue = this.prevItem;
                this.topicInputRef.setNativeProps({
                    text: null,
                });
                this.topicInputRef.setNativeProps({
                    text: prevTopics[this.prevIndex],
                });
                this.setState({
                    editTopic:true
                })
            } else {} */

      if (this.state.editTopic) {
        this.topicInputRef.blur();
        Keyboard.dismiss();
        this.setState({
          editTopic: false,
        });
      }
      this.prevItem = null;
      this.prevIndex = null;
      this.currentInputValue = null;
      this.topicInputRef.setNativeProps({
        text: null,
      });

      if (forward) {
        setTimeout(() => {
          this.listRef.scrollToEnd({animated: true});
        }, 30);
      }
    }
  };

  render() {
    const {colors, toEdit} = this.props;
    const {
      titleFocused,
      descFocused,
      topics,
      visible,
      topicInputFocused,
    } = this.state;
    return (
      <Modal
        visible={visible}
        transparent={true}
        animated
        animationType={DDS.isTab ? 'fade' : 'slide'}
        onShow={() => {
          this.topicsToDelete = [];
          this.titleRef.focus();
        }}
        onRequestClose={this.close}>
        <SafeAreaView>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : null}
            style={styles.wrapper}>
            <TouchableOpacity onPress={this.close} style={styles.overlay} />
            <View
              style={[
                styles.container,
                {
                  backgroundColor: colors.bg,
                },
              ]}>
              <DialogHeader
                title={
                  toEdit && toEdit.dateCreated
                    ? 'Edit Notebook'
                    : 'New Notebook'
                }
                paragraph={
                  toEdit && toEdit.dateCreated
                    ? 'Edit your notebook'
                    : 'Add a new notebook to your notebooks.'
                }
              />

              <TextInput
                ref={(ref) => (this.titleRef = ref)}
                style={[
                  styles.input,
                  {
                    borderColor: titleFocused ? colors.accent : colors.nav,
                    color: colors.pri,
                    fontSize: SIZE.md,
                  },
                ]}
                numberOfLines={1}
                multiline={false}
                onFocus={() => {
                  this.setState({
                    titleFocused: true,
                  });
                }}
                onBlur={() => {
                  this.setState({
                    titleFocused: false,
                  });
                }}
                defaultValue={toEdit ? toEdit.title : null}
                onChangeText={(value) => {
                  this.title = value;
                }}
                onSubmitEditing={() => {
                  this.descriptionRef.focus();
                }}
                placeholder="Title"
                placeholderTextColor={colors.icon}
              />
              <TextInput
                ref={(ref) => (this.descriptionRef = ref)}
                style={[
                  styles.input,
                  {
                    borderColor: descFocused ? colors.accent : colors.nav,
                    minHeight: 45,
                    color: colors.pri,
                  },
                ]}
                maxLength={150}
                onFocus={() => {
                  this.setState({
                    descFocused: true,
                  });
                }}
                onBlur={() => {
                  this.setState({
                    descFocused: false,
                  });
                }}
                defaultValue={toEdit ? toEdit.description : null}
                onChangeText={(value) => {
                  this.description = value;
                }}
                onSubmitEditing={() => {
                  this.topicInputRef.focus();
                }}
                placeholder="Describe your notebook."
                placeholderTextColor={colors.icon}
              />

              <View style={styles.topicContainer}>
                <TextInput
                  ref={(ref) => (this.topicInputRef = ref)}
                  onChangeText={(value) => {
                    this.currentInputValue = value;
                    if (this.prevItem !== null) {
                      refs[this.prevIndex].setNativeProps({
                        text: this.prevIndex + 1 + '. ' + value,
                        style: {
                          borderBottomColor: colors.accent,
                        },
                      });
                    }
                  }}
                  blurOnSubmit={false}
                  onFocus={() => {
                    this.setState({
                      topicInputFocused: true,
                    });
                  }}
                  onBlur={() => {
                    this.onSubmit(false);
                    this.setState({
                      topicInputFocused: false,
                      editTopic: false,
                    });
                  }}
                  onSubmitEditing={this.onSubmit}
                  style={[
                    styles.input,
                    {
                      borderColor: topicInputFocused
                        ? colors.accent
                        : colors.nav,
                      color: colors.pri,
                      width: '100%',
                      maxWidth: '100%',
                      marginTop: 5,
                      paddingRight: '15%',
                    },
                  ]}
                  placeholder="Add a topic"
                  placeholderTextColor={colors.icon}
                />
                <TouchableOpacity
                  onPress={this.onSubmit}
                  style={[
                    styles.addBtn,
                    {
                      borderColor: topicInputFocused
                        ? colors.accent
                        : colors.nav,
                    },
                  ]}>
                  <Icon
                    name={this.state.editTopic ? 'check' : 'plus'}
                    size={SIZE.lg}
                    color={topicInputFocused ? colors.accent : colors.icon}
                  />
                </TouchableOpacity>
              </View>

              <FlatList
                data={topics}
                ref={(ref) => (this.listRef = ref)}
                keyExtractor={(item, index) => item + index.toString()}
                renderItem={({item, index}) => (
                  <TopicItem
                    item={item}
                    onPress={(item, index) => {
                      console.log('here');
                      this.prevIndex = index;
                      this.prevItem = item;
                      this.topicInputRef.setNativeProps({
                        text: item,
                      });
                      this.topicInputRef.focus();
                      this.currentInputValue = item;
                      this.setState({
                        editTopic: true,
                      });
                    }}
                    onDelete={this.onDelete}
                    index={index}
                    colors={colors}
                  />
                )}
              />

              <DialogButtons
                negativeTitle="Cancel"
                positiveTitle={toEdit && toEdit.dateCreated ? 'Save' : 'Add'}
                onPressPositive={this.addNewNotebook}
                onPressNegative={this.close}
              />
            </View>
          </KeyboardAvoidingView>
          <Toast context="local" />
        </SafeAreaView>
      </Modal>
    );
  }
}

const TopicItem = ({item, index, colors, onPress, onDelete}) => {
  const topicRef = (ref) => (refs[index] = ref);

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: colors.nav,
      }}>
      <TouchableOpacity
        style={{
          width: '80%',
          backgroundColor: 'transparent',
          zIndex: 10,
          position: 'absolute',
          height: 30,
        }}
        onPress={() => {
          onPress(item, index);
        }}
      />
      <Paragraph
        style={{
          marginRight: index === 0 ? 2 : 0,
        }}>
        {index + 1 + '.'}
      </Paragraph>
      <TextInput
        ref={topicRef}
        editable={false}
        style={[
          styles.topicInput,
          {
            color: colors.pri,
          },
        ]}
        defaultValue={item}
        placeholderTextColor={colors.icon}
      />

      <View
        style={{
          width: 80,
          position: 'absolute',
          right: 0,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'flex-end',
        }}>
        <ActionIcon
          onPress={() => {
            onPress(item, index);
          }}
          name="pencil"
          size={SIZE.lg - 5}
          color={colors.icon}
        />
        <ActionIcon
          onPress={() => {
            onDelete(index);
          }}
          name="minus"
          size={SIZE.lg}
          color={colors.icon}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: DDS.isTab ? 500 : '80%',
    height: DDS.isTab ? 600 : null,
    maxHeight: DDS.isTab ? 600 :"90%",
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: pv,
  },
  overlay: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  headingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headingText: {
    fontFamily: WEIGHT.bold,
    marginLeft: 5,
    fontSize: SIZE.xl,
  },
  input: {
    paddingRight: 12,
    paddingHorizontal: 0,
    borderRadius: 0,
    minHeight: 45,
    fontSize: SIZE.md,
    fontFamily: WEIGHT.regular,
    padding: pv - 2,
    borderBottomWidth: 1,
    marginTop: 10,
    marginBottom: 5,
  },
  addBtn: {
    width: '12%',
    minHeight: 45,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
  },
  buttonContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    marginTop: 20,
  },

  topicContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  topicInput: {
    padding: pv - 5,
    fontSize: SIZE.sm,
    fontFamily: WEIGHT.regular,
    paddingHorizontal: ph,
    paddingRight: 40,
    paddingVertical: 10,
    width: '100%',
    maxWidth: '100%',
  },
  topicBtn: {
    borderRadius: 5,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
  },
});
