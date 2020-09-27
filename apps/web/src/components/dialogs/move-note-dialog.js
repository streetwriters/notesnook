import React from "react";
import { Flex, Box, Text, Button } from "rebass";
import { Input } from "@rebass/forms";
import * as Icon from "../icons";
import { db } from "../../common";
import Dialog, { showDialog } from "./dialog";
import { toTitleCase } from "../../utils/string";
import { showNotesMovedToast } from "../../common/toasts";
import { showToast } from "../../utils/toast";

class MoveDialog extends React.Component {
  history = [];
  _inputRef;
  selectedNotebook;
  selectedTopic;
  state = {
    currentOpenedIndex: -1,
    notebooks: db.notebooks.all,
  };

  render() {
    const { notebooks, currentOpenedIndex } = this.state;
    const props = this.props;
    return (
      <Dialog
        isOpen={true}
        title={"Add Note to Notebook"}
        description={"Organize your notes by adding them to notebooks."}
        icon={Icon.Move}
        buttonsAlignment="center"
        negativeButton={{
          text: "Get me out of here",
          onClick: props.onClose,
        }}
      >
        <Box>
          <Flex alignItems="center" justifyContent="space-between" mb={2}>
            <Text variant="title">Notebooks</Text>
            <Button
              variant="anchor"
              fontSize="body"
              /* onClick={() => {
                if (mode === "write") {
                  this.setState({ mode: "read" });
                  return;
                }
                this.setState({ mode: "write" });
                setTimeout(() => {
                  this._inputRef.focus();
                }, 0);
              }} */
            >
              Create
            </Button>
          </Flex>
          {/* <Input
            ref={(ref) => (this._inputRef = ref)}
            sx={{ display: mode === "write" ? "block" : "none" }}
            my={1}
            placeholder={type === "notebooks" ? "Notebook name" : "Topic name"}
            onKeyUp={async (e) => {
              if (e.nativeEvent.key === "Enter" && e.target.value.length > 0) {
                if (type === "notebooks") {
                  await db.notebooks.add({
                    title: e.target.value,
                  });
                  this.setState({ items: db.notebooks.all });
                } else {
                  await db.notebooks
                    .notebook(this.selectedNotebook.id)
                    .topics.add(e.target.value);
                  this.setState({
                    items: db.notebooks.notebook(this.selectedNotebook.id)
                      .topics.all,
                  });
                }
                this._inputRef.value = "";
                this.setState({ mode: "read" });
              }
            }}
          /> */}
          <Box
            sx={{
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "border",
              maxHeight: 8 * 30,
              overflowY: "auto",
            }}
          >
            {notebooks.map((notebook, index) => (
              <Flex
                variant="columnFill"
                key={notebook.id}
                /* onClick={() => {
                      this.history.push({
                        title,
                        items,
                        type,
                      });
                      if (type === "notebooks") {
                        this.setState({
                          type: "topics",
                          items: item.topics,
                          title: item.title,
                        });
                        this.selectedNotebook = item;
                      } else if (type === "topics") {
                        this.setState({
                          type: "notes",
                          title: `${this.selectedNotebook.title} - ${item.title}`,
                          items: db.notebooks
                            .notebook(this.selectedNotebook.id)
                            .topics.topic(item.title).all,
                        });
                        this.selectedTopic = item.title;
                      }
                    }} */
              >
                <Item
                  icon={Icon.Notebook}
                  title={notebook.title}
                  totalNotes={notebook.totalNotes}
                  onClick={() =>
                    this.setState({
                      currentOpenedIndex:
                        this.state.currentOpenedIndex === index ? -1 : index,
                    })
                  }
                />
                <Flex
                  variant="columnFill"
                  style={{
                    display: currentOpenedIndex === index ? "flex" : "none",
                  }}
                >
                  {notebook.topics.map((topic) => (
                    <Item
                      key={topic.id}
                      onClick={async () => {
                        try {
                          const nb = {
                            id: notebook.id,
                            topic: topic.id,
                          };
                          const note = db.notes.note(props.noteIds[0]).data;
                          await db.notes.move(nb, ...props.noteIds);
                          showNotesMovedToast(note, props.noteIds, nb);
                          props.onMove();
                        } catch (e) {
                          showToast("error", e.message);
                          console.error(e);
                        } finally {
                          props.onClose();
                        }
                      }}
                      indent={1}
                      icon={Icon.Topic}
                      title={topic.title}
                      totalNotes={topic.totalNotes}
                      action={
                        <Text color="primary" fontSize="body">
                          Move here
                        </Text>
                      }
                    />
                  ))}
                </Flex>
              </Flex>
            ))}
          </Box>
        </Box>
      </Dialog>
    );
  }
}

export function showMoveNoteDialog(noteIds) {
  return showDialog((perform) => (
    <MoveDialog
      noteIds={noteIds}
      onClose={() => perform(false)}
      onMove={() => perform(true)}
    />
  ));
}

function Item(props) {
  const { icon: Icon, indent = 0, title, totalNotes, onClick, action } = props;
  return (
    <Flex
      p={2}
      justifyContent="space-between"
      alignItems="center"
      pl={!indent ? 2 : indent * 30}
      sx={{
        borderWidth: 1,
        borderBottomColor: "border",
        borderBottomStyle: "solid",
        cursor: "pointer",
        ":hover": { borderBottomColor: "primary" },
      }}
      onClick={onClick}
    >
      <Flex alignItems="center" justifyContent="center">
        <Icon />
        <Text as="span" ml={1} fontSize="body">
          {title}
        </Text>
      </Flex>
      {action || (
        <Text sx={{ textAlign: "right" }} fontSize="body">
          {totalNotes + " Notes"}
        </Text>
      )}
    </Flex>
  );
}
