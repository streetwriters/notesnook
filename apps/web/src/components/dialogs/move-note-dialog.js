import React from "react";
import { Flex, Box, Text } from "rebass";
import { Input } from "@rebass/forms";
import * as Icon from "../icons";
import { db } from "../../common";
import Dialog, { showDialog } from "./dialog";
import { toTitleCase } from "../../utils/string";

class MoveDialog extends React.Component {
  history = [];
  _inputRef;
  selectedNotebook;
  selectedTopic;
  state = {
    items: db.notebooks.all,
    type: "notebooks",
    title: "Notebooks",
    mode: "read"
  };

  render() {
    const { items, type, title, mode } = this.state;
    const props = this.props;
    return (
      <Dialog
        isOpen={true}
        title={
          type === "notes"
            ? "Move Note"
            : "Select " + toTitleCase(type.substring(0, type.length - 1))
        }
        icon={
          type === "notes"
            ? Icon.Move
            : type === "topics"
            ? Icon.Topic
            : Icon.Notebook
        }
        positiveButton={{
          text: "Move",
          onClick: async () => {
            try {
              await db.notes.move(
                { id: this.selectedNotebook.id, topic: this.selectedTopic },
                ...props.noteIds
              );
              props.onMove();
            } catch (e) {
              console.error(e);
            } finally {
              props.onClose();
            }
          },
          disabled: type !== "notes"
        }}
        negativeButton={{ text: "Cancel", onClick: props.onClose }}
      >
        <Box>
          <Flex alignContent="center" justifyContent="space-between" my={1}>
            <Flex>
              <Text
                onClick={() => {
                  let item = this.history.pop();
                  this.setState({ ...item });
                }}
                sx={{
                  display: this.history.length ? "block" : "none",
                  ":hover": { color: "primary" },
                  marginRight: 2
                }}
              >
                <Icon.ArrowLeft />
              </Text>
              <Text variant="title">{title}</Text>
            </Flex>
            <Text
              onClick={() => {
                if (mode === "write") {
                  this.setState({ mode: "read" });
                  return;
                }
                this.setState({ mode: "write" });
                setTimeout(() => {
                  this._inputRef.focus();
                }, 0);
              }}
              sx={{
                display: type === "notes" ? "none" : "block",
                ":hover": { color: "primary" }
              }}
            >
              {mode === "read" ? <Icon.Plus /> : <Icon.Minus />}
            </Text>
          </Flex>
          <Input
            ref={ref => (this._inputRef = ref)}
            variant="default"
            sx={{ display: mode === "write" ? "block" : "none" }}
            my={1}
            placeholder={type === "notebooks" ? "Notebook name" : "Topic name"}
            onKeyUp={async e => {
              if (e.nativeEvent.key === "Enter" && e.target.value.length > 0) {
                if (type === "notebooks") {
                  await db.notebooks.add({
                    title: e.target.value
                  });
                  this.setState({ items: db.notebooks.all });
                } else {
                  await db.notebooks
                    .notebook(this.selectedNotebook.id)
                    .topics.add(e.target.value);
                  this.setState({
                    items: db.notebooks.notebook(this.selectedNotebook.id)
                      .topics.all
                  });
                }
                this._inputRef.value = "";
                this.setState({ mode: "read" });
              }
            }}
          />
          <Box
            sx={{
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "border",
              maxHeight: 8 * 30,
              overflowY: "auto"
            }}
          >
            {items.length ? (
              items.map(item => {
                return (
                  <Flex
                    key={item.title + item.dateCreated}
                    sx={{
                      borderWidth: 1,
                      padding: 2,
                      borderBottomColor: "border",
                      borderBottomStyle: "solid",
                      cursor: "pointer",
                      ":hover": { borderBottomColor: "primary" }
                    }}
                    onClick={() => {
                      this.history.push({
                        title,
                        items,
                        type
                      });
                      if (type === "notebooks") {
                        this.setState({
                          type: "topics",
                          items: item.topics,
                          title: item.title
                        });
                        this.selectedNotebook = item;
                      } else if (type === "topics") {
                        this.setState({
                          type: "notes",
                          title: `${this.selectedNotebook.title} - ${item.title}`,
                          items: db.notebooks
                            .notebook(this.selectedNotebook.id)
                            .topics.topic(item.title).all
                        });
                        this.selectedTopic = item.title;
                      }
                    }}
                  >
                    <Text sx={{ width: "80%" }}>{item.title}</Text>
                    {item.totalNotes !== undefined && (
                      <Text sx={{ width: "20%", textAlign: "right" }}>
                        {item.totalNotes + " Notes"}
                      </Text>
                    )}
                  </Flex>
                );
              })
            ) : (
              <Text
                py={2}
                px={2}
                sx={{ textAlign: "center", fontStyle: "italic" }}
              >
                Nothing here
              </Text>
            )}
          </Box>
        </Box>
      </Dialog>
    );
  }
}

export function showMoveNoteDialog(noteIds) {
  return showDialog(perform => (
    <MoveDialog
      noteIds={noteIds}
      onClose={() => perform(false)}
      onMove={() => perform(true)}
    />
  ));
}
