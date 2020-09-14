import React from "react";
import { Flex, Box, Text, Button as RebassButton } from "rebass";
import { Input } from "@rebass/forms";
import * as Icon from "../icons";
import Dialog, { showDialog } from "./dialog";
import { store } from "../../stores/notebook-store";
import { qclone } from "qclone";
import { showToast } from "../../utils/toast";

class AddNotebookDialog extends React.Component {
  MAX_AVAILABLE_HEIGHT = window.innerHeight * 0.3;
  title = "";
  description = "";
  _inputRefs = [];
  lastLength = 0;
  topics = [{ title: "" }];
  id = undefined;
  state = {
    topics: [{ title: "" }],
    focusedInputIndex: 0,
  };

  performActionOnTopic(index) {
    if (this.state.focusedInputIndex !== index) {
      this.removeTopic(index);
    } else {
      this.addTopic(index);
    }
  }

  removeTopic(index) {
    this._action(index, 1);
  }

  addTopic(index) {
    this._action(index + 1, 0, { title: "" });
  }

  _action(index, deleteCount, replaceItem) {
    if (replaceItem !== undefined)
      this.topics.splice(index, deleteCount, replaceItem);
    else this.topics.splice(index, deleteCount);

    this.setState({ topics: this.topics }, () =>
      setTimeout(() => {
        this._inputRefs[index].focus();
      }, 0)
    );
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.isOpen === false) {
      this._reset();
    }
  }

  componentDidMount() {
    if (!this.props.notebook) return;
    const { title, description, id, topics } = qclone(this.props.notebook);
    this.topics = topics;
    this.setState({
      topics: topics,
    });
    this.title = title;
    this.description = description;
    this.id = id;
  }

  _reset() {
    this.title = "";
    this.description = "";
    this._inputRefs = [];
    this.lastLength = 0;
    this.topics = [{ title: "" }];
    this.id = undefined;
    this.setState({
      topics: [{ title: "" }],
      focusedInputIndex: 0,
    });
  }

  render() {
    const props = this.props;
    return (
      <Dialog
        isOpen={props.isOpen}
        title="Notebook"
        icon={Icon.Notebook}
        positiveButton={{
          text: props.edit ? "Edit" : "Add",
          onClick: () => {
            props.onDone({
              title: this.title,
              description: this.description,
              topics: this.topics.map((topic) => {
                if (topic.id) return topic;
                return topic.title;
              }),
              id: this.id,
            });
          },
        }}
        negativeButton={{ text: "Cancel", onClick: props.close }}
      >
        <Box my={1}>
          <Input
            autoFocus
            onChange={(e) => (this.title = e.target.value)}
            placeholder="Enter name"
            defaultValue={this.title}
          />
          <Input
            sx={{ marginTop: 1 }}
            onChange={(e) => (this.description = e.target.value)}
            placeholder="Enter description (optional)"
            defaultValue={this.description}
          />
          <Text variant="body" fontWeight="bold" my={1}>
            Topics (optional):
          </Text>
          <Box
            sx={{
              maxHeight: this.MAX_AVAILABLE_HEIGHT,
              overflowY: "auto",
              marginBottom: 1,
            }}
          >
            {this.state.topics.map((value, index) => (
              <Flex key={value} flexDirection="row" sx={{ marginBottom: 1 }}>
                <Input
                  ref={(ref) => {
                    this._inputRefs[index] = ref;
                    if (ref) ref.value = value.title; // set default value
                  }}
                  placeholder="Topic name"
                  onFocus={(e) => {
                    this.lastLength = e.nativeEvent.target.value.length;
                    if (this.state.focusedInputIndex === index) return;
                    this.setState({ focusedInputIndex: index });
                  }}
                  onChange={(e) => {
                    this.topics[index].title = e.target.value;
                  }}
                  onKeyUp={(e) => {
                    if (e.nativeEvent.key === "Enter") {
                      this.addTopic(index);
                    } else if (
                      e.nativeEvent.key === "Backspace" &&
                      this.lastLength === 0 &&
                      index > 0
                    ) {
                      this.removeTopic(index);
                    }
                    this.lastLength = e.nativeEvent.target.value.length;
                  }}
                />
                <RebassButton
                  variant="tertiary"
                  sx={{ marginLeft: 1 }}
                  px={2}
                  py={1}
                  onClick={() => this.performActionOnTopic(index)}
                >
                  <Box height={20}>
                    {this.state.focusedInputIndex === index ? (
                      <Icon.Plus size={22} />
                    ) : (
                      <Icon.Minus size={22} />
                    )}
                  </Box>
                </RebassButton>
              </Flex>
            ))}
          </Box>
        </Box>
      </Dialog>
    );
  }
}

export function showEditNoteDialog(notebook) {
  return showDialog((perform) => (
    <AddNotebookDialog
      isOpen={true}
      notebook={notebook}
      edit={true}
      onDone={async (nb) => {
        await store.add(nb);
        showToast("success", "Notebook edited successfully!");
        perform(true);
      }}
      close={() => {
        perform(false);
      }}
    />
  ));
}

export default AddNotebookDialog;
