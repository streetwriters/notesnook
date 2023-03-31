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
import { View } from "react-native";

import { useMenuStore } from "../../../stores/use-menu-store";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { db } from "../../../common/database";
import {
  eCloseAddTopicDialog,
  eOnTopicSheetUpdate,
  eOpenAddTopicDialog
} from "../../../utils/events";
import { sleep } from "../../../utils/time";
import BaseDialog from "../../dialog/base-dialog";
import DialogButtons from "../../dialog/dialog-buttons";
import DialogContainer from "../../dialog/dialog-container";
import DialogHeader from "../../dialog/dialog-header";
import Input from "../../ui/input";
import Seperator from "../../ui/seperator";
import { Toast } from "../../toast";
import { useRelationStore } from "../../../stores/use-relation-store";

export class AddTopicDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      titleFocused: false,
      loading: false
    };

    this.ref = createRef();
    this.title;
    this.titleRef = createRef();
    this.notebook = null;
    this.toEdit = null;
  }

  addNewTopic = async () => {
    try {
      if (!this.title || this.title?.trim() === "") {
        ToastEvent.show({
          heading: "Topic title is required",
          type: "error",
          context: "local"
        });
        return;
      }

      if (!this.toEdit) {
        await db.notebooks.notebook(this.notebook.id).topics.add(this.title);
      } else {
        let topic = this.toEdit;
        topic.title = this.title;

        await db.notebooks.notebook(topic.notebookId).topics.add(topic);
      }
      this.close();
      setTimeout(() => {
        Navigation.queueRoutesForUpdate("Notebooks", "Notebook", "TopicNotes");
        useMenuStore.getState().setMenuPins();
      });
      eSendEvent(eOnTopicSheetUpdate);
      useRelationStore.getState().update();
    } catch (e) {
      console.error(e);
    }
  };

  componentDidMount() {
    eSubscribeEvent(eOpenAddTopicDialog, this.open);
    eSubscribeEvent(eCloseAddTopicDialog, this.close);
  }
  componentWillUnmount() {
    eUnSubscribeEvent(eOpenAddTopicDialog, this.open);
    eUnSubscribeEvent(eCloseAddTopicDialog, this.close);
  }

  open = async ({ notebookId, toEdit }) => {
    let id = notebookId;
    if (id) {
      this.notebook = await db.notebooks.notebook(id).data;
    }
    this.toEdit = toEdit;

    if (this.toEdit) {
      this.title = this.toEdit.title;
    }

    this.setState({
      visible: true
    });
  };
  close = () => {
    this.title = null;
    this.notebook = null;
    this.toEdit = null;
    this.setState({
      visible: false
    });
  };

  render() {
    const { visible } = this.state;
    if (!visible) return null;
    return (
      <BaseDialog
        onShow={async () => {
          if (this.toEdit) {
            this.titleRef.current?.setNativeProps({
              text: this.toEdit.title
            });
          }

          this.ref.current?.animateNextTransition();
          await sleep(300);
          this.titleRef.current?.focus();
        }}
        bounce={false}
        statusBarTranslucent={false}
        visible={true}
        onRequestClose={this.close}
      >
        <DialogContainer>
          <DialogHeader
            icon="book-outline"
            title={this.toEdit ? "Edit topic" : "New topic"}
            paragraph={
              this.toEdit
                ? "Edit title of the topic"
                : "Add a new topic in " + this.notebook.title
            }
            padding={12}
          />
          <Seperator half />
          <View
            style={{
              paddingHorizontal: 12,
              zIndex: 10
            }}
          >
            <Input
              fwdRef={this.titleRef}
              testID="input-title"
              onChangeText={(value) => {
                this.title = value;
              }}
              blurOnSubmit={false}
              placeholder="Enter title"
              onSubmit={() => this.addNewTopic()}
              returnKeyLabel="Done"
              returnKeyType="done"
            />
          </View>

          <DialogButtons
            positiveTitle={this.toEdit ? "Save" : "Add"}
            onPressNegative={() => this.close()}
            onPressPositive={() => this.addNewTopic()}
          />
        </DialogContainer>
        <Toast context="local" />
      </BaseDialog>
    );
  }
}
