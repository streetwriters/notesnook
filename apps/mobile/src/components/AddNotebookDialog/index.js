import React, {createRef} from 'react';
import {Keyboard, StyleSheet, TouchableOpacity, View,TextInput} from 'react-native';
import {FlatList, ScrollView, } from 'react-native-gesture-handler';
import {notesnook} from '../../../e2e/test.ids';
import {useMenuStore} from '../../provider/stores';
import {DDS} from '../../services/DeviceDetection';
import {ToastEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {db} from '../../utils/DB';
import {ph, pv, SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {ActionIcon} from '../ActionIcon';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import {Button} from '../Button';
import DialogHeader from '../Dialog/dialog-header';
import Input from '../Input';
import Seperator from '../Seperator';
import {Toast} from '../Toast';

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
      loading: false
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
    this.hiddenInput = createRef();
    this.topicInputRef = createRef();
    this.addingTopic = false;
    this.actionSheetRef = createRef();
  }

  open = () => {
    console.log('opening called');
    refs = [];
    let {toEdit} = this.props;
    if (toEdit && toEdit.type === 'notebook') {
      let topicsList = [];
      toEdit.topics.forEach((item, index) => {
        topicsList.push(item.title);
      });
      this.id = toEdit.id;
      this.title = toEdit.title;
      this.description = toEdit.description;

      this.setState({
        topics: [...topicsList],
        visible: true
      });
    } else {
      this.setState({
        visible: true
      });
    }
    sleep(100).then(r => {
      this.actionSheetRef.current?.show();
    });
  };

  close = () => {
    this.actionSheetRef.current?.hide();
    refs = [];
    this.prevIndex = null;
    this.prevItem = null;
    this.currentSelectedInput = null;
    this.title = null;
    this.description = null;
    this.currentInputValue = null;
    this.id = null;
    this.setState({
      visible: false,
      topics: [],
      descFocused: false,
      titleFocused: false,
      editTopic: false
    });
  };

  onDelete = index => {
    let {topics} = this.state;
    let prevTopics = topics;
    refs = [];
    prevTopics.splice(index, 1);
    let edit = this.props.toEdit;
    if (edit && edit.id) {
      let topicToDelete = edit.topics[index];

      if (topicToDelete) {
        this.topicsToDelete.push(topicToDelete.id);
      }
    }
    let nextTopics = [...prevTopics];
    if (this.prevIndex === index) {
      this.prevIndex = null;
      this.prevItem = null;
      this.currentInputValue = null;
      this.topicInputRef.current?.setNativeProps({
        text: null
      });
    }
    this.setState({
      topics: nextTopics
    });
  };

  addNewNotebook = async () => {
    this.setState({
      loading: true
    });
    let {topics} = this.state;
    let edit = this.props.toEdit;

    if (!this.title || this.title?.trim().length === 0) {
      ToastEvent.show({
        heading: 'Notebook title is required',
        type: 'error',
        context: 'local'
      });
      this.setState({
        loading: false
      });
      return;
    }

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
        id: id
      });

      let nextTopics = toEdit.topics.map((topic, index) => {
        //if (index === 0) return topic;
        let copy = {...topic};
        copy.title = prevTopics[index];
        return copy;
      });

      prevTopics.forEach((title, index) => {
        if (!nextTopics[index]) {
          nextTopics.push(title);
        }
      });

      await db.notebooks.notebook(id).topics.add(...nextTopics);
    } else {
      await db.notebooks.add({
        title: this.title,
        description: this.description,
        topics: prevTopics,
        id: id
      });
    }
    useMenuStore.getState().setMenuPins();
    Navigation.setRoutesToUpdate([
      Navigation.routeNames.Notebooks,
      Navigation.routeNames.Notebook,
      Navigation.routeNames.NotesPage
    ]);
    this.setState({
      loading: false
    });
    this.close();
  };

  onSubmit = (forward = true) => {
    this.hiddenInput.current?.focus();
    let willFocus = true;
    let {topics} = this.state;
    if (!this.currentInputValue || this.currentInputValue?.trim().length === 0)
      return;

    let prevTopics = [...topics];
    if (this.prevItem === null) {
      prevTopics.push(this.currentInputValue);
      this.setState({
        topics: prevTopics
      });
      setTimeout(() => {
        this.listRef.scrollToEnd({animated: true});
      }, 30);
      this.currentInputValue = null;
    } else {
      prevTopics[this.prevIndex] = this.currentInputValue;
      this.setState({
        topics: prevTopics
      });
      this.currentInputValue = null;

      if (this.state.editTopic) {
        this.topicInputRef.current?.blur();
        Keyboard.dismiss();
        this.setState({
          editTopic: false
        });
        willFocus = false;
      }
      this.prevItem = null;
      this.prevIndex = null;
      this.currentInputValue = null;

      if (forward) {
        setTimeout(() => {
          this.listRef.scrollToEnd({animated: true});
        }, 30);
      }
    }
    this.topicInputRef.current?.setNativeProps({
      text: ''
    });
    willFocus && this.topicInputRef.current?.focus();
  };

  render() {
    const {colors, toEdit} = this.props;
    const {topics, visible, topicInputFocused} = this.state;
    if (!visible) return null;
    return (
      <ActionSheetWrapper
        onOpen={async () => {
          this.topicsToDelete = [];
          await sleep(300);
          this.props.toEdit?.type !== 'notebook' && this.titleRef?.focus();
        }}
        fwdRef={this.actionSheetRef}
        onClose={() => {
          console.log('closing now');
          this.close();
          this.setState({
            visible: false
          });
        }}
        statusBarTranslucent={false}
        onRequestClose={this.close}>
        <View
          style={{
            maxHeight: DDS.isTab ? '90%' : '100%',
            borderRadius: DDS.isTab ? 5 : 0,
            paddingHorizontal: 12
          }}>
          <TextInput
            ref={this.hiddenInput}
            style={{
              width: 1,
              height: 1,
              opacity: 0,
              position: 'absolute'
            }}
            blurOnSubmit={false}
          />
          <DialogHeader
            title={
              toEdit && toEdit.dateCreated ? 'Edit Notebook' : 'New Notebook'
            }
            paragraph={
              toEdit && toEdit.dateCreated
                ? 'You are editing ' + this.title + ' notebook.'
                : 'Notebooks are the best way to organize your notes.'
            }
          />
          <Seperator half />

          <Input
            fwdRef={ref => (this.titleRef = ref)}
            testID={notesnook.ids.dialogs.notebook.inputs.title}
            onChangeText={value => {
              this.title = value;
            }}
            placeholder="Enter a title"
            onSubmit={() => {
              this.descriptionRef.focus();
            }}
            returnKeyLabel="Next"
            returnKeyType="next"
            defaultValue={toEdit ? toEdit.title : null}
          />

          <Input
            fwdRef={ref => (this.descriptionRef = ref)}
            testID={notesnook.ids.dialogs.notebook.inputs.description}
            onChangeText={value => {
              this.description = value;
            }}
            placeholder="Describe your notebook."
            onSubmit={() => {
              this.topicInputRef.current?.focus();
            }}
            returnKeyLabel="Next"
            returnKeyType="next"
            defaultValue={toEdit ? toEdit.description : null}
          />

          <Input
            fwdRef={this.topicInputRef}
            testID={notesnook.ids.dialogs.notebook.inputs.topic}
            onChangeText={value => {
              this.currentInputValue = value;
              if (this.prevItem !== null) {
                refs[this.prevIndex].setNativeProps({
                  text: value,
                  style: {
                    borderBottomColor: colors.accent
                  }
                });
              }
            }}
            returnKeyLabel="Done"
            returnKeyType="done"
            onSubmit={() => {
              this.onSubmit();
            }}
            blurOnSubmit={false}
            button={{
              icon: this.state.editTopic ? 'check' : 'plus',
              onPress: this.onSubmit,
              color: topicInputFocused ? colors.accent : colors.icon
            }}
            placeholder="Add a topic"
          />

          <FlatList
            data={topics}
            ref={ref => (this.listRef = ref)}
            nestedScrollEnabled
            keyExtractor={(item, index) => item + index.toString()}
            onMomentumScrollEnd={() => {
              this.actionSheetRef.current?.handleChildScrollEnd();
            }}
            renderItem={({item, index}) => (
              <TopicItem
                item={item}
                onPress={(item, index) => {
                  this.prevIndex = index;
                  this.prevItem = item;
                  this.topicInputRef.current?.setNativeProps({
                    text: item
                  });
                  this.topicInputRef.current?.focus();
                  this.currentInputValue = item;
                  this.setState({
                    editTopic: true
                  });
                }}
                onDelete={this.onDelete}
                index={index}
                colors={colors}
              />
            )}
          />
          <Seperator />
          <Button
            width="100%"
            height={50}
            fontSize={SIZE.md}
            title={
              toEdit && toEdit.dateCreated ? 'Save changes' : 'Create notebook'
            }
            type="accent"
            onPress={this.addNewNotebook}
          />
        </View>

        <Toast context="local" />
      </ActionSheetWrapper>
    );
  }
}

const TopicItem = ({item, index, colors, onPress, onDelete}) => {
  const topicRef = ref => (refs[index] = ref);

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.nav,
        borderRadius: 5,
        marginVertical: 5
      }}>
      <TouchableOpacity
        style={{
          width: '80%',
          backgroundColor: 'transparent',
          zIndex: 10,
          position: 'absolute',
          height: 30
        }}
        onPress={() => {
          onPress(item, index);
        }}
      />
      <TextInput
        ref={topicRef}
        editable={false}
        style={[
          styles.topicInput,
          {
            color: colors.pri
          }
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
          justifyContent: 'flex-end'
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
    alignItems: 'center'
  },
  overlay: {
    width: '100%',
    height: '100%',
    position: 'absolute'
  },
  headingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headingText: {
    marginLeft: 5,
    fontSize: SIZE.xl
  },
  input: {
    paddingRight: 12,
    paddingHorizontal: 0,
    borderRadius: 0,
    minHeight: 45,
    fontSize: SIZE.md,
    padding: pv - 2,
    borderBottomWidth: 1,
    marginTop: 10,
    marginBottom: 5
  },
  addBtn: {
    width: '12%',
    minHeight: 45,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0
  },
  buttonContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    marginTop: 20
  },

  topicContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  topicInput: {
    padding: pv - 5,
    fontSize: SIZE.sm,
    //fontFamily: "sans-serif",
    paddingHorizontal: ph,
    paddingRight: 40,
    paddingVertical: 10,
    width: '100%',
    maxWidth: '100%'
  },
  topicBtn: {
    borderRadius: 5,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0
  }
});
