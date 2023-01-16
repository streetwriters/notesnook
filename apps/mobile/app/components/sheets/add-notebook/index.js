/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import React, { createRef } from "react";
import {
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { notesnook } from "../../../../e2e/test.ids";
import { useMenuStore } from "../../../stores/use-menu-store";
import { DDS } from "../../../services/device-detection";
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { db } from "../../../common/database";
import {
  eCloseAddNotebookDialog,
  eOpenAddNotebookDialog
} from "../../../utils/events";
import { ph, pv, SIZE } from "../../../utils/size";
import { sleep } from "../../../utils/time";
import { IconButton } from "../../ui/icon-button";
import { Button } from "../../ui/button";
import DialogHeader from "../../dialog/dialog-header";
import Input from "../../ui/input";
import { MoveNotes } from "../move-notes/movenote";
import Seperator from "../../ui/seperator";
import SheetWrapper from "../../ui/sheet";
import { Toast } from "../../toast";

let refs = [];

export class AddNotebookSheet extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      notebook: null,
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

  componentDidMount() {
    eSubscribeEvent(eOpenAddNotebookDialog, this.open);
    eSubscribeEvent(eCloseAddNotebookDialog, this.close);
  }

  componentWillUnmount() {
    eUnSubscribeEvent(eOpenAddNotebookDialog, this.open);
    eUnSubscribeEvent(eCloseAddNotebookDialog, this.close);
  }

  open = (notebook) => {
    refs = [];

    if (notebook) {
      let topicsList = [];
      notebook.topics.forEach((item) => {
        topicsList.push(item.title);
      });
      this.id = notebook.id;
      this.title = notebook.title;
      this.description = notebook.description;

      this.setState({
        topics: [...topicsList],
        visible: true,
        notebook: notebook
      });
    } else {
      this.setState({
        visible: true,
        notebook: null
      });
    }
    sleep(100).then(() => {
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
  };

  onDelete = (index) => {
    let { topics } = this.state;
    let prevTopics = topics;
    refs = [];
    prevTopics.splice(index, 1);
    let edit = this.state.notebook;
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
    let { topics, notebook } = this.state;

    if (!this.title || this.title?.trim().length === 0) {
      ToastEvent.show({
        heading: "Notebook title is required",
        type: "error",
        context: "local"
      });
      this.setState({
        loading: false
      });
      return;
    }
    let toEdit = null;
    if (notebook) {
      toEdit = db.notebooks.notebook(notebook.id).data;
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
    let newNotebookId = null;
    if (notebook) {
      if (this.topicsToDelete?.length > 0) {
        await db.notebooks
          .notebook(toEdit.id)
          .topics.delete(...this.topicsToDelete);
        toEdit = db.notebooks.notebook(toEdit.id).data;
      }

      await db.notebooks.add({
        title: this.title,
        description: this.description,
        id: notebook.id
      });

      let nextTopics = toEdit.topics.map((topic, index) => {
        let copy = { ...topic };
        copy.title = prevTopics[index];
        return copy;
      });

      prevTopics.forEach((title, index) => {
        if (!nextTopics[index]) {
          nextTopics.push(title);
        }
      });

      await db.notebooks.notebook(toEdit.id).topics.add(...nextTopics);
    } else {
      newNotebookId = await db.notebooks.add({
        title: this.title,
        description: this.description,
        topics: prevTopics,
        id: null
      });
    }
    useMenuStore.getState().setMenuPins();
    Navigation.queueRoutesForUpdate(
      "Notes",
      "ColoredNotes",
      "TaggedNotes",
      "TopicNotes",
      "Notebooks",
      "Notebook"
    );

    this.setState({
      loading: false
    });
    this.close();
    await sleep(300);
    if (!notebook) {
      MoveNotes.present(db.notebooks.notebook(newNotebookId).data);
    }
  };

  onSubmit = (forward = true) => {
    this.hiddenInput.current?.focus();
    let willFocus = true;
    let { topics } = this.state;
    if (!this.currentInputValue || this.currentInputValue?.trim().length === 0)
      return;

    let prevTopics = [...topics];
    if (this.prevItem === null) {
      prevTopics.push(this.currentInputValue);
      this.setState({
        topics: prevTopics
      });
      setTimeout(() => {
        this.listRef.scrollToEnd({ animated: true });
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
          this.listRef.scrollToEnd({ animated: true });
        }, 30);
      }
    }
    this.topicInputRef.current?.setNativeProps({
      text: ""
    });
    willFocus && this.topicInputRef.current?.focus();
  };

  render() {
    const { colors } = this.props;
    const { topics, visible, topicInputFocused, notebook } = this.state;
    if (!visible) return null;
    return (
      <SheetWrapper
        onOpen={async () => {
          this.topicsToDelete = [];
          await sleep(300);
          !this.state.notebook && this.titleRef?.focus();
        }}
        fwdRef={this.actionSheetRef}
        onClose={() => {
          this.close();
          this.setState({
            visible: false,
            topics: [],
            descFocused: false,
            titleFocused: false,
            editTopic: false,
            notebook: null
          });
        }}
        statusBarTranslucent={false}
        onRequestClose={this.close}
      >
        <View
          style={{
            maxHeight: DDS.isTab ? "90%" : "96%",
            borderRadius: DDS.isTab ? 5 : 0,
            paddingHorizontal: 12
          }}
        >
          <TextInput
            ref={this.hiddenInput}
            style={{
              width: 1,
              height: 1,
              opacity: 0,
              position: "absolute"
            }}
            blurOnSubmit={false}
          />
          <DialogHeader
            title={
              notebook && notebook.dateCreated
                ? "Edit Notebook"
                : "New Notebook"
            }
            paragraph={
              notebook && notebook.dateCreated
                ? "You are editing " + this.title + " notebook."
                : "Notebooks are the best way to organize your notes."
            }
          />
          <Seperator half />

          <Input
            fwdRef={(ref) => (this.titleRef = ref)}
            testID={notesnook.ids.dialogs.notebook.inputs.title}
            onChangeText={(value) => {
              this.title = value;
            }}
            placeholder="Enter a title"
            onSubmit={() => {
              this.descriptionRef.focus();
            }}
            returnKeyLabel="Next"
            returnKeyType="next"
            defaultValue={notebook ? notebook.title : null}
          />

          <Input
            fwdRef={(ref) => (this.descriptionRef = ref)}
            testID={notesnook.ids.dialogs.notebook.inputs.description}
            onChangeText={(value) => {
              this.description = value;
            }}
            placeholder="Describe your notebook."
            onSubmit={() => {
              this.topicInputRef.current?.focus();
            }}
            returnKeyLabel="Next"
            returnKeyType="next"
            defaultValue={notebook ? notebook.description : null}
          />

          <Input
            fwdRef={this.topicInputRef}
            testID={notesnook.ids.dialogs.notebook.inputs.topic}
            onChangeText={(value) => {
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
              testID: "topic-add-button",
              icon: this.state.editTopic ? "check" : "plus",
              onPress: this.onSubmit,
              color: topicInputFocused ? colors.accent : colors.icon
            }}
            placeholder="Add a topic"
          />

          <FlatList
            data={topics}
            ref={(ref) => (this.listRef = ref)}
            nestedScrollEnabled
            keyExtractor={(item, index) => item + index.toString()}
            onMomentumScrollEnd={() => {
              this.actionSheetRef.current?.handleChildScrollEnd();
            }}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="interactive"
            ListFooterComponent={<View style={{ height: 50 }} />}
            renderItem={({ item, index }) => (
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
              notebook && notebook.dateCreated
                ? "Save changes"
                : "Create notebook"
            }
            type="accent"
            onPress={this.addNewNotebook}
          />
          {/* 
          {Platform.OS === 'ios'  && (
            <View
              style={{
                height: 40
              }}
            />
          )} */}
        </View>

        <Toast context="local" />
      </SheetWrapper>
    );
  }
}

const TopicItem = ({ item, index, colors, onPress, onDelete }) => {
  const topicRef = (ref) => (refs[index] = ref);

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: colors.nav,
        borderRadius: 5,
        marginVertical: 5
      }}
    >
      <TouchableOpacity
        style={{
          width: "80%",
          backgroundColor: "transparent",
          zIndex: 10,
          position: "absolute",
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
        placeholderTextColor={colors.placeholder}
      />

      <View
        style={{
          width: 80,
          position: "absolute",
          right: 0,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "flex-end"
        }}
      >
        <IconButton
          onPress={() => {
            onPress(item, index);
          }}
          name="pencil"
          size={SIZE.lg - 5}
          color={colors.icon}
        />
        <IconButton
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
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center"
  },
  overlay: {
    width: "100%",
    height: "100%",
    position: "absolute"
  },
  headingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
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
    width: "12%",
    minHeight: 45,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 0
  },
  buttonContainer: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
    marginTop: 20
  },

  topicContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10
  },
  topicInput: {
    padding: pv - 5,
    fontSize: SIZE.sm,
    //fontFamily: "sans-serif",
    paddingHorizontal: ph,
    paddingRight: 40,
    paddingVertical: 10,
    width: "100%",
    maxWidth: "100%"
  },
  topicBtn: {
    borderRadius: 5,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 0
  }
});
