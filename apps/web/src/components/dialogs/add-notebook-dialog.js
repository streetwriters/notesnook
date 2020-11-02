import React from "react";
import { Flex, Box, Button as RebassButton, Text } from "rebass";
import { Input } from "@rebass/forms";
import * as Icon from "../icons";
import Dialog, { showDialog } from "./dialog";
import { store } from "../../stores/notebook-store";
import { qclone } from "qclone";
import { showToast } from "../../utils/toast";
import { db } from "../../common";

class AddNotebookDialog extends React.Component {
  title = "";
  description = "";
  id = undefined;
  deletedTopics = [];
  state = {
    topics: [],
    isEditting: false,
    editIndex: -1,
  };

  removeTopic(index) {
    const topics = this.state.topics.slice();
    if (topics[index].id) {
      this.deletedTopics.push(topics[index].id);
    }
    topics.splice(index, 1);
    this.setState({
      topics,
    });
  }

  addTopic(topicTitle) {
    if (topicTitle.trim().length <= 0) return;

    const topics = this.state.topics.slice();
    topics.push({ title: topicTitle });
    this.setState({
      topics,
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
      topics,
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
      topics: [],
    });
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
        icon={Icon.Notebook}
        positiveButton={{
          text: props.edit ? "Edit notebook" : "Create notebook",
          onClick: () => {
            props.onDone(
              {
                title: this.title,
                description: this.description,
                topics: this.state.topics.map((topic) => {
                  if (topic.id) return topic;
                  return topic.title;
                }),
                id: this.id,
              },
              this.deletedTopics
            );
          },
        }}
        onClose={props.onClose}
        negativeButton={{ text: "Cancel", onClick: props.onClose }}
      >
        <Flex flexDirection="column" sx={{ overflowY: "auto" }}>
          <Input
            data-test-id="dialog-nb-name"
            autoFocus
            onChange={(e) => (this.title = e.target.value)}
            placeholder="Enter name"
            defaultValue={this.title}
          />
          <Input
            data-test-id="dialog-nb-description"
            mt={2}
            onChange={(e) => (this.description = e.target.value)}
            placeholder="Enter description (optional)"
            defaultValue={this.description}
          />
          <Flex flexDirection="row" mt={2}>
            <Input
              data-test-id={"dialog-nb-topic"}
              ref={(ref) => (this._topicInputRef = ref)}
              placeholder="Add a topic"
              onChange={(e) => {
                if (!this.state.isEditting) return;
                const topics = this.state.topics.slice();
                topics[this.state.editIndex].title = e.target.value;
                this.setState({
                  topics,
                });
              }}
              onKeyUp={(e) => {
                if (e.nativeEvent.key === "Enter") {
                  if (this.state.isEditting) {
                    this.doneEditingTopic();
                  } else {
                    this.addTopic(e.target.value);
                  }
                }
              }}
            />
            <RebassButton
              variant="tertiary"
              sx={{ marginLeft: 1 }}
              px={2}
              py={1}
              onClick={() => {
                if (this.state.isEditting) {
                  this.doneEditingTopic();
                } else {
                  this.addTopic(this._topicInputRef.value);
                }
              }}
              data-test-id="dialog-nb-topic-action"
            >
              <Box height={20}>
                {this.state.isEditting ? (
                  <Icon.Checkmark size={22} />
                ) : (
                  <Icon.Plus size={22} />
                )}
              </Box>
            </RebassButton>
          </Flex>
          {this.state.topics.map((topic, index) => (
            <TopicItem
              key={topic.id || topic.title || index}
              hideActions={topic.title === "General"}
              title={topic.title}
              isEditing={this.state.editIndex === index}
              onEdit={() => this.editTopic(index)}
              onDoneEditing={() => this.doneEditingTopic()}
              onDelete={() => this.removeTopic(index)}
              index={index}
            />
          ))}
        </Flex>
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
      onDone={async (nb, deletedTopics) => {
        // we remove the topics from notebook
        // beforehand so we can add them manually, later
        const topics = qclone(nb.topics);
        delete nb.topics;

        // add the edited notebook to db
        await store.add({ ...notebook, ...nb });

        // add or delete topics as required
        const notebookTopics = db.notebooks.notebook(notebook.id).topics;
        await notebookTopics.delete(...deletedTopics);
        await notebookTopics.add(...topics);

        showToast("success", "Notebook edited successfully!");
        perform(true);
      }}
      onClose={() => {
        perform(false);
      }}
    />
  ));
}

export default AddNotebookDialog;

function TopicItem(props) {
  const {
    title,
    onEdit,
    onDoneEditing,
    onDelete,
    isEditing,
    hideActions,
    index,
  } = props;
  return (
    <Flex
      p={2}
      pl={0}
      justifyContent="space-between"
      alignItems="center"
      sx={{
        borderWidth: 1,
        borderBottomColor: isEditing ? "primary" : "border",
        borderBottomStyle: "solid",
        cursor: "pointer",
        ":hover": { borderBottomColor: "primary" },
      }}
      onClick={isEditing ? onDoneEditing : onEdit}
    >
      <Flex alignItems="center" justifyContent="center">
        <Icon.Topic />
        <Text as="span" ml={1} fontSize="body">
          {title}
        </Text>
      </Flex>
      {!hideActions && (
        <Flex justifyContent="center" alignItems="center">
          <Text
            variant="subBody"
            color="primary"
            sx={{ ":hover": { opacity: 0.8 } }}
            onClick={isEditing ? onDoneEditing : onEdit}
            data-test-id={`dialog-nb-topic-${index}-actions-edit`}
          >
            {isEditing ? "Done" : "Edit"}
          </Text>
          <Text
            variant="subBody"
            color="error"
            ml={1}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            sx={{ ":hover": { opacity: 0.8 } }}
          >
            Delete
          </Text>
        </Flex>
      )}
    </Flex>
  );
}
