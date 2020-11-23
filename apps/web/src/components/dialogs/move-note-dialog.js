import React from "react";
import { Flex, Box, Text, Button } from "rebass";
import * as Icon from "../icons";
import { db } from "../../common";
import Dialog, { showDialog } from "./dialog";
import { showNotesMovedToast } from "../../common/toasts";
import { showToast } from "../../utils/toast";
import { Input } from "@rebass/forms";

class MoveDialog extends React.Component {
  history = [];
  _inputRef;
  selectedNotebook;
  selectedTopic;
  state = {
    currentOpenedIndex: -1,
    notebooks: db.notebooks.all,
  };

  async addNotebook(input) {
    if (input.value.length > 0) {
      await db.notebooks.add({
        title: input.value,
      });
      this.setState({ notebooks: db.notebooks.all });
      input.value = "";
    }
  }

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
        onClose={props.onClose}
        negativeButton={{
          text: "Cancel",
          onClick: props.onClose,
        }}
      >
        <Flex flexDirection="column" sx={{ overflowY: "hidden" }}>
          <Text variant="title">Notebooks</Text>
          <Flex flexDirection="row" my={2}>
            <Input
              ref={(ref) => (this.inputRef = ref)}
              data-test-id="mnd-new-notebook-title"
              placeholder={"Enter new notebook title"}
              onKeyUp={async (e) => {
                if (e.key === "Enter") await this.addNotebook(e.target);
              }}
            />
            <Button
              variant="tertiary"
              p={1}
              px={2}
              ml={2}
              onClick={async () => {
                await this.addNotebook(this.inputRef);
              }}
              data-test-id="mnd-new-notebook-add"
            >
              <Icon.Plus size={22} />
            </Button>
          </Flex>
          <Box
            sx={{
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "border",
              overflowY: "auto",
            }}
          >
            {notebooks.map((notebook, index) => (
              <Flex variant="columnFill" key={notebook.id}>
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
        </Flex>
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
