import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Flex, Box, Text, Button as RebassButton, Button } from "rebass";
import { Input, Checkbox, Label } from "@rebass/forms";
import * as Icon from "react-feather";
import { ThemeProvider } from "../../utils/theme";
import { db } from "../../common";
import Modal from "react-modal";
import RootNavigator from "../../navigation/navigators/rootnavigator";

const Dialog = props => {
  const [open, setOpen] = useState(false);
  Dialog.close = () => setOpen(false);
  useEffect(() => {
    setOpen(props.open);
  }, [props.open]);

  return (
    <ThemeProvider>
      {theme => (
        <Modal
          isOpen={open}
          shouldCloseOnOverlayClick={true}
          onRequestClose={props.closeCick}
          style={{
            content: {
              top: "50%",
              left: "50%",
              right: "auto",
              bottom: "auto",
              marginRight: "-50%",
              transform: "translate(-50%, -50%)",
              borderWidth: 0,
              borderRadius: theme.radii["default"],
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              boxShadow: theme.shadows["3"],
              width: "20%",
              paddingRight: 40,
              paddingLeft: 40,
              overflowY: "hidden"
            },
            overlay: {
              background: theme.colors.overlay
            }
          }}
        >
          <Flex flexDirection="column">
            <Flex
              flexDirection="row"
              alignItems="center"
              alignSelf="center"
              justifyContent="center"
              color="primary"
              py={2}
            >
              <Box height={props.IconSize ? props.IconSize : 42}>
                <props.icon size={props.IconSize ? props.IconSize : 42} />
              </Box>
              <Text
                mx={2}
                as="span"
                variant="title"
                fontSize={28}
                textAlign="center"
              >
                {props.title}
              </Text>
            </Flex>
            {props.content}
            <Flex
              flexDirection="row"
              my={1}
              justifyContent="center"
              alignItems="center"
            >
              {props.positiveButton ? (
                <RebassButton
                  variant="primary"
                  sx={{ opacity: props.positiveButton.disabled ? 0.7 : 1 }}
                  mx={1}
                  width={"25%"}
                  disabled={props.positiveButton.disabled || false}
                  onClick={props.positiveButton.click}
                >
                  {props.positiveButton.text || "OK"}
                </RebassButton>
              ) : null}

              {props.negativeButton ? (
                <RebassButton
                  variant="secondary"
                  width={"25%"}
                  onClick={props.negativeButton.click}
                >
                  {props.negativeButton.text || "Cancel"}
                </RebassButton>
              ) : null}
            </Flex>
          </Flex>
        </Modal>
      )}
    </ThemeProvider>
  );
};

const inputRefs = [];
export const CreateNotebookDialog = props => {
  const [topics, setTopics] = useState([""]);
  const addTopic = index => {
    topics.splice(index + 1, 0, "");
    setTopics([...topics]);
    setTimeout(() => {
      inputRefs[index + 1].focus();
    }, 0);
  };
  return (
    <Dialog
      open={props.open}
      title="Notebook"
      icon={Icon.BookOpen}
      content={
        <Box my={1}>
          <Input
            variant="default"
            onChange={e => (CreateNotebookDialog.title = e.target.value)}
            placeholder="Enter name"
          />
          <Input
            variant="default"
            sx={{ marginTop: 1 }}
            onChange={e => (CreateNotebookDialog.description = e.target.value)}
            placeholder="Enter description (optional)"
          />
          <Label alignItems="center" my={1}>
            <Checkbox variant="checkbox" />
            Locked?
          </Label>
          <Text variant="body" fontWeight="bold" my={1}>
            Topics (optional):
          </Text>
          <Box sx={{ maxHeight: 44 * 5, overflowY: "auto", marginBottom: 1 }}>
            {topics.map((value, index) => (
              <Flex
                key={index.toString()}
                flexDirection="row"
                sx={{ marginBottom: 1 }}
              >
                <Input
                  ref={ref => (inputRefs[index] = ref)}
                  variant="default"
                  value={topics[index]}
                  placeholder="Topic name"
                  onFocus={e => {
                    CreateNotebookDialog.lastLength =
                      e.nativeEvent.target.value.length;
                  }}
                  onChange={e => {
                    topics[index] = e.target.value;
                    setTopics([...topics]);
                  }}
                  onKeyUp={e => {
                    if (e.nativeEvent.key === "Enter") {
                      addTopic(index);
                    } else if (
                      e.nativeEvent.key === "Backspace" &&
                      CreateNotebookDialog.lastLength === 0 &&
                      index > 0
                    ) {
                      topics.splice(index, 1);
                      setTopics([...topics]);
                      setTimeout(() => {
                        inputRefs[index - 1].focus();
                      }, 0);
                    }
                    CreateNotebookDialog.lastLength =
                      e.nativeEvent.target.value.length;
                  }}
                />
                <RebassButton
                  variant="tertiary"
                  sx={{ marginLeft: 1 }}
                  px={2}
                  py={1}
                  onClick={() => addTopic(index)}
                >
                  <Box height={20}>
                    <Icon.Plus size={20} />
                  </Box>
                </RebassButton>
              </Flex>
            ))}
          </Box>
        </Box>
      }
      positiveButton={{
        text: "Done",
        click: () =>
          props.onDone(
            topics,
            CreateNotebookDialog.title,
            CreateNotebookDialog.description
          )
      }}
      negativeButton={{ text: "Cancel", click: props.close }}
    />
  );
};

const ConfirmationDialog = props => (
  <Dialog
    open={true}
    title={props.title}
    icon={props.icon}
    content={
      <Box my={1}>
        <Text>{props.message}</Text>
      </Box>
    }
    positiveButton={{
      text: "Yes",
      click: props.onYes
    }}
    negativeButton={{ text: "No", click: props.onNo }}
  />
);

const SignInDialog = props => (
  <Dialog
    open={true}
    title={props.title}
    icon={props.icon}
    IconSize={30}
    closeCick={props.closeCick}
    content={
      <Box my={1}>
        <Input
          placeholder="Email"
          my="10px"
          sx={{ borderColor: "border" }}
        ></Input>
        <Input
          placeholder="Password"
          my="10px"
          sx={{ borderColor: "border" }}
        ></Input>
        <Button width={1} my="10px">
          Login
        </Button>
        <Flex flexDirection="row" justifyContent="space-between">
          <Button variant="links">Create a New Account</Button>
          <Button variant="links" alignItems="right">
            Forgot password?
          </Button>
        </Flex>
      </Box>
    }
  />
);

export const askSign = (icon, title, message) => {
  const root = document.getElementById("dialogContainer");
  const perform = (result, resolve) => {
    Dialog.close();
    ReactDOM.unmountComponentAtNode(root);
    resolve(result);
  };
  if (root) {
    return new Promise((resolve, _) => {
      ReactDOM.render(
        <SignInDialog
          closeCick={() => {
            perform(false, resolve);
            RootNavigator.navigate("home");
          }}
          id="SignInDialog"
          title={title}
          message={message}
          icon={icon}
        />,
        root
      );
    });
  }
  return Promise.reject("No element with id 'dialogContainer'");
};

export const ask = (icon, title, message) => {
  const root = document.getElementById("dialogContainer");
  const perform = (result, resolve) => {
    Dialog.close();
    ReactDOM.unmountComponentAtNode(root);
    resolve(result);
  };
  if (root) {
    return new Promise((resolve, _) => {
      ReactDOM.render(
        <ConfirmationDialog
          id="confirmationDialog"
          title={title}
          message={message}
          icon={icon}
          onNo={() => perform(false, resolve)}
          onYes={() => perform(true, resolve)}
        />,
        root
      );
    });
  }
  return Promise.reject("No element with id 'dialogContainer'");
};

export const MoveDialog = props => {
  const [items, setItems] = useState(db.getNotebooks());
  const [type, setType] = useState("notebooks");
  const [title, setTitle] = useState("Notebooks");
  const [mode, setMode] = useState("read");
  useEffect(() => {
    MoveDialog.last = [];
  }, []);
  return (
    <Dialog
      open={true}
      title={"Move Note"}
      icon={Icon.Move}
      content={
        <Box>
          <Flex alignContent="center" justifyContent="space-between" my={1}>
            <Flex>
              {type !== "notebooks" && (
                <Text
                  onClick={() => {
                    let item = MoveDialog.last.pop();
                    setType(item.type);
                    setTitle(item.title);
                    setItems(item.items);
                  }}
                  sx={{
                    ":hover": { color: "primary" },
                    marginRight: 2
                  }}
                >
                  <Icon.ArrowLeft />
                </Text>
              )}
              <Text variant="title">{title}</Text>
            </Flex>
            {type !== "notes" && (
              <Text
                onClick={() => {
                  if (mode === "write") {
                    setMode("read");
                    return;
                  }
                  setMode("write");
                  setTimeout(() => {
                    MoveDialog.inputRef.focus();
                  }, 0);
                }}
                sx={{
                  ":hover": { color: "primary" }
                }}
              >
                {mode === "read" ? <Icon.Plus /> : <Icon.Minus />}
              </Text>
            )}
          </Flex>
          <Input
            ref={ref => (MoveDialog.inputRef = ref)}
            variant="default"
            sx={{ display: mode === "write" ? "block" : "none" }}
            my={1}
            placeholder={type === "notebooks" ? "Notebook name" : "Topic name"}
            onKeyUp={async e => {
              if (e.nativeEvent.key === "Enter" && e.target.value.length > 0) {
                if (type === "notebooks") {
                  await db.addNotebook({ title: e.target.value });
                  setItems(db.getNotebooks());
                } else {
                  await db.addTopicToNotebook(
                    MoveDialog.notebook.dateCreated,
                    e.target.value
                  );
                  setItems(
                    db.getNotebook(MoveDialog.notebook.dateCreated).topics
                  );
                }
                MoveDialog.inputRef.value = "";
                setMode("read");
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
              items.map(v => {
                return (
                  <Flex
                    sx={{
                      borderWidth: 1,
                      padding: 2,
                      borderBottomColor: "border",
                      borderBottomStyle: "solid",
                      ":hover": { borderBottomColor: "primary" }
                    }}
                    onClick={() => {
                      MoveDialog.last.push({
                        title: title,
                        items: items,
                        type: type
                      });
                      if (type === "notebooks") {
                        setType("topics");
                        MoveDialog.notebook = v;
                        setTitle(v.title);
                        setItems(v.topics);
                      } else if (type === "topics") {
                        setType("notes");
                        MoveDialog.topic = v.title;
                        setTitle(`${MoveDialog.notebook.title} - ${v.title}`);
                        setItems(
                          db.getTopic(MoveDialog.notebook.dateCreated, v.title)
                        );
                      }
                    }}
                  >
                    <Text sx={{ width: "80%" }}>{v.title}</Text>
                    {v.totalNotes !== undefined && (
                      <Text sx={{ width: "20%", textAlign: "right" }}>
                        {v.totalNotes + " Notes"}
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
      }
      positiveButton={{
        text: "Move",
        click: async () => {
          if (
            await db.moveNote(props.noteId, props.notebook, {
              notebook: MoveDialog.notebook.dateCreated,
              topic: MoveDialog.topic
            })
          ) {
            props.onMove();
          }
          props.onClose();
        },
        disabled: type !== "notes"
      }}
      negativeButton={{ text: "Cancel", onClick: props.onClose }}
    />
  );
};

export const moveNote = (noteId, notebook) => {
  const root = document.getElementById("dialogContainer");
  const perform = (result, resolve) => {
    Dialog.close();
    ReactDOM.unmountComponentAtNode(root);
    resolve(result);
  };
  if (root) {
    return new Promise((resolve, _) => {
      ReactDOM.render(
        <MoveDialog
          noteId={noteId}
          notebook={notebook}
          onClose={() => perform(false, resolve)}
          onMove={() => perform(true, resolve)}
        />,
        root
      );
    });
  }
  return Promise.reject("No element with id 'dialogContainer'");
};
