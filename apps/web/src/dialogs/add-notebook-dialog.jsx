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

import React from "react";
import { Flex, Text } from "@theme-ui/components";
import { Notebook, Checkmark, Plus, Topic } from "../components/icons";
import Dialog from "../components/dialog";
import qclone from "qclone";
import Field from "../components/field";
import { showToast } from "../utils/toast";

class AddNotebookDialog extends React.Component {
  title = "";
  description = "";
  id = undefined;
  deletedTopics = [];
  state = {
    topics: [],
    isEditting: false,
    editIndex: -1
  };

  removeTopic(index) {
    const topics = this.state.topics.slice();
    if (!topics[index]) return;
    if (topics[index].id) {
      this.deletedTopics.push(topics[index].id);
    }
    topics.splice(index, 1);
    this.setState({
      topics
    });
  }

  addTopic(topicTitle) {
    if (topicTitle.trim().length <= 0) return;

    const topics = this.state.topics.slice();
    topics.push({ title: topicTitle });
    this.setState({
      topics
    });
    this.resetTopicInput();
  }

  editTopic(index) {
    this._topicInputRef.value = this.state.topics[index].title;
    this._topicInputRef.focus();
    this.setState({ isEditting: true, editIndex: index });
  }

  doneEditingTopic() {
    this.setState({ isEditting: false, editIndex: -1 });
    this.resetTopicInput();
  }

  resetTopicInput() {
    this._topicInputRef.value = "";
    this._topicInputRef.focus();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.isOpen === false) {
      this._reset();
    }
  }

  componentDidMount() {
    if (!this.props.notebook) return;
    const { title, description, id, topics } = qclone(this.props.notebook);
    this.setState({
      topics
    });
    this.title = title;
    this.notebookTitle = title;
    this.description = description;
    this.id = id;
  }

  _reset() {
    this.title = "";
    this.notebookTitle = "";
    this.description = "";
    this.id = undefined;
    this.setState({
      topics: []
    });
  }

  createNotebook() {
    if (!this.title.trim())
      return showToast("error", "Notebook title cannot be empty.");

    const notebook = {
      title: this.title,
      description: this.description,
      topics: this.state.topics.map((topic) => {
        if (topic.id) return topic;
        return topic.title;
      }),
      id: this.id
    };
    this.props.onDone(notebook, this.deletedTopics);
  }

  render() {
    const props = this.props;
    return (
      <Dialog
        isOpen={props.isOpen}
        title={props.edit ? "Edit Notebook" : "Create a Notebook"}
        description={
          props.edit
            ? `You are editing "${this.notebookTitle}".`
            : "Notebooks are the best way to organize your notes."
        }
        icon={Notebook}
        positiveButton={{
          text: props.edit ? "Save" : "Create",
          onClick: () => {
            this.createNotebook();
          }
        }}
        onClose={() => props.onClose(false)}
        negativeButton={{ text: "Cancel", onClick: () => props.onClose(false) }}
      >
        <Flex sx={{ overflowY: "auto", flexDirection: "column" }}>
          <Field
            defaultValue={this.title}
            data-test-id="title-input"
            autoFocus
            required
            label="Title"
            name="title"
            id="title"
            onChange={(e) => (this.title = e.target.value)}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                this.createNotebook();
              }
            }}
          />
          <Field
            data-test-id="description-input"
            label="Description"
            name="description"
            id="description"
            onChange={(e) => (this.description = e.target.value)}
            defaultValue={this.description}
            helpText="Optional"
            sx={{ mt: 1 }}
          />
          <Field
            inputRef={(ref) => (this._topicInputRef = ref)}
            data-test-id="edit-topic-input"
            label="Topics"
            name="topic"
            id="topic"
            action={{
              testId: "edit-topic-action",
              onClick: () => {
                if (this.state.isEditting) {
                  this.doneEditingTopic();
                } else {
                  this.addTopic(this._topicInputRef.value);
                }
              },
              icon: this.state.isEditting ? Checkmark : Plus
            }}
            onChange={(e) => {
              if (!this.state.isEditting) return;
              const topics = this.state.topics.slice();
              topics[this.state.editIndex].title = e.target.value;
              this.setState({
                topics
              });
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                if (this.state.isEditting) {
                  this.doneEditingTopic();
                } else {
                  this.addTopic(e.target.value);
                }
              }
            }}
            helpText="Press enter to add a topic (optional)"
            sx={{ mt: 1 }}
          />
          {this.state.topics.map((topic, index) => (
            <TopicItem
              key={topic.id || topic.title || index}
              title={topic.title}
              isEditing={this.state.editIndex === index}
              onEdit={() => this.editTopic(index)}
              onDoneEditing={() => this.doneEditingTopic()}
              onDelete={() => this.removeTopic(index)}
            />
          ))}
        </Flex>
      </Dialog>
    );
  }
}

export default AddNotebookDialog;

function TopicItem(props) {
  const { title, onEdit, onDoneEditing, onDelete, isEditing, hideActions } =
    props;
  return (
    <Flex
      p={2}
      pl={0}
      sx={{
        borderWidth: 1,
        borderBottomColor: isEditing ? "primary" : "border",
        borderBottomStyle: "solid",
        cursor: "pointer",
        ":hover": { borderBottomColor: "primary" },
        alignItems: "center",
        justifyContent: "space-between"
      }}
      onClick={isEditing ? onDoneEditing : onEdit}
      data-test-id="topic-item"
    >
      <Flex sx={{ alignItems: "center", justifyContent: "center" }}>
        <Topic />
        <Text as="span" ml={1} sx={{ fontSize: "body", color: "paragraph" }}>
          {title}
        </Text>
      </Flex>
      {!hideActions && (
        <Flex sx={{ alignItems: "center", justifyContent: "center" }}>
          <Text
            variant="subBody"
            sx={{
              alignItems: "center",
              ":hover": { opacity: 0.8 },
              height: "25px",
              color: "primary",
              display: "flex"
            }}
            onClick={isEditing ? onDoneEditing : onEdit}
          >
            {isEditing ? "Done" : "Edit"}
          </Text>
          <Text
            variant="subBody"
            ml={2}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            sx={{
              alignItems: "center",
              ":hover": { opacity: 0.8 },
              height: "25px",
              color: "error",
              display: "flex"
            }}
          >
            Delete
          </Text>
        </Flex>
      )}
    </Flex>
  );
}
