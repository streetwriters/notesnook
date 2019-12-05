import React, { useState, useEffect } from "react";
import { Flex, Box, Text, Button as RebassButton } from "rebass";
import { Input, Label } from "@rebass/forms";
import Button from "../components/button";
import * as Icon from "react-feather";
import theme, { ButtonPressedStyle, SHADOW, DIALOG_SHADOW } from "../theme";
import Search from "../components/search";
import Modal from "react-modal";
import { db, ev } from "../common";
import { showSnack } from "../components/snackbar";
import { Virtuoso as List } from "react-virtuoso";
import Dropdown, {
  DropdownTrigger,
  DropdownContent
} from "../components/dropdown";
import Menu from "../components/menu";

const inputRefs = [];
const dropdownRefs = [];
const menuItems = [
  { title: "Favorite", icon: Icon.Heart },
  { title: "Share", icon: Icon.Share2 },
  {
    title: "Delete",
    icon: Icon.Trash,
    color: "red",
    onClick: note => {
      ev.emit("onClearNote", note.dateCreated);
      db.deleteNotes([note]).then(
        //TODO implement undo
        async () => {
          showSnack("Note deleted!", Icon.Check);
        }
      );
    }
  }
];

const Notebooks = props => {
  const [open, setOpen] = useState(false);
  const [notebooks, setNotebooks] = useState([]);
  useEffect(() => {
    Notebooks.onRefresh = () => {
      setNotebooks(db.getNotebooks());
      console.log(notebooks);
    };
    Notebooks.onRefresh();
    return () => {
      Notebooks.onRefresh = undefined;
    };
  }, []);
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      {notebooks.length > 0 ? (
        <Flex flexDirection="column" flex="1 1 auto">
          <Search placeholder="Search" />
          <List
            style={{
              width: "100%",
              flex: "1 1 auto",
              height: "auto",
              overflowX: "hidden"
            }}
            totalCount={notebooks.length}
            item={index => {
              const notebook = notebooks[index];
              return (
                <Box
                  onClick={e => {
                    e.stopPropagation();
                  }}
                  py={1}
                  sx={{
                    borderRadius: "default",
                    marginBottom: 2,
                    borderBottom: "1px solid",
                    borderBottomColor: "navbg",
                    cursor: "default",
                    ...ButtonPressedStyle
                  }}
                >
                  <Flex flexDirection="row" justifyContent="space-between">
                    <Text fontFamily="body" fontSize="title" fontWeight="bold">
                      {notebook.title}
                    </Text>
                    <Dropdown
                      style={{ zIndex: 999 }}
                      ref={ref => (dropdownRefs[index] = ref)}
                    >
                      <DropdownTrigger>
                        <Icon.MoreVertical
                          size={20}
                          strokeWidth={1.5}
                          style={{ marginRight: -5 }}
                        />
                      </DropdownTrigger>
                      <DropdownContent style={{ zIndex: 999, marginLeft: -70 }}>
                        <Menu
                          dropdownRef={dropdownRefs[index]}
                          menuItems={menuItems}
                          data={notebook}
                        />
                      </DropdownContent>
                    </Dropdown>
                  </Flex>
                  <Text variant="body" sx={{ marginBottom: 1 }}>
                    {notebook.description}
                  </Text>
                  <Flex sx={{ marginBottom: 1 }}>
                    {Object.keys(notebook.topics)
                      .slice(0, 3)
                      .map(topic => (
                        <Flex
                          bg="accent"
                          px={1}
                          py={1}
                          sx={{
                            marginRight: 1,
                            borderRadius: "default",
                            color: "fontSecondary"
                          }}
                        >
                          <Text variant="body" fontSize={11}>
                            {topic}
                          </Text>
                        </Flex>
                      ))}
                  </Flex>
                  <Text variant="body" fontSize={12} color="accent">
                    {new Date(notebook.dateCreated).toDateString().substring(4)}
                    <Text as="span" color="fontPrimary">
                      {" • " + notebook.totalNotes} Notes
                    </Text>
                  </Text>
                </Box>
              );
            }}
          />
          <Button
            Icon={Icon.Plus}
            onClick={() => setOpen(true)}
            content="Create a notebook"
          />
        </Flex>
      ) : (
        <Flex
          flex="1 1 auto"
          alignItems="center"
          justifyContent="center"
          color="#9b9b9b"
          flexDirection="column"
        >
          <Icon.Book size={72} strokeWidth={1.5} />
          <Text variant="title">You have no notebooks</Text>
          <Button
            Icon={Icon.Plus}
            content="Let's create one"
            onClick={() => setOpen(true)}
            style={{ marginTop: 2, textAlign: "center" }}
            width={"auto"}
          />
        </Flex>
      )}
      <CreateNotebookDialog
        open={open}
        onDone={async (topics, title, description) => {
          if (await db.addNotebook({ title, description, topics })) {
            setNotebooks(db.getNotebooks());
            setOpen(false);
          } else {
            showSnack("Please fill out the notebook title.");
          }
        }}
        close={() => setOpen(false)}
      />
    </Flex>
  );
};

const CreateNotebookDialog = props => {
  const [topics, setTopics] = useState([""]);
  const addTopic = index => {
    topics.splice(index + 1, 0, "");
    setTopics([...topics]);
    setTimeout(() => {
      inputRefs[index + 1].focus();
    }, 0);
  };
  return (
    <Modal
      isOpen={props.open}
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
          boxShadow: DIALOG_SHADOW,
          width: "20%",
          paddingRight: 40,
          paddingLeft: 40,
          overflowY: "hidden"
        }
      }}
      contentLabel="Add a Notebook"
    >
      <Flex flexDirection="column">
        <Flex
          flexDirection="row"
          alignItems="center"
          alignSelf="center"
          justifyContent="center"
          color="accent"
          py={2}
        >
          <Icon.BookOpen size={42} />
          <Text
            mx={2}
            as="span"
            variant="title"
            fontSize={28}
            textAlign="center"
          >
            Notebook
          </Text>
        </Flex>
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
          <Text variant="body" fontWeight="bold" my={1}>
            Topics (optional):
          </Text>
          <Box sx={{ maxHeight: 44 * 5, overflowY: "auto", marginBottom: 1 }}>
            {topics.map((item, index) => (
              <Flex
                key={item + index.toString()}
                flexDirection="row"
                sx={{ marginBottom: 1 }}
              >
                <Input
                  ref={ref => (inputRefs[index] = ref)}
                  variant="default"
                  value={topics[index]}
                  placeholder="Topic name"
                  onFocus={e => {
                    Notebooks.lastLength = e.nativeEvent.target.value.length;
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
                      Notebooks.lastLength === 0 &&
                      index > 0
                    ) {
                      topics.splice(index, 1);
                      setTopics([...topics]);
                      setTimeout(() => {
                        inputRefs[index - 1].focus();
                      }, 0);
                    }
                    Notebooks.lastLength = e.nativeEvent.target.value.length;
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
        <Flex flexDirection="row" justifyContent="center" alignItems="center">
          <RebassButton
            variant="primary"
            mx={1}
            onClick={() =>
              props.onDone(
                topics,
                CreateNotebookDialog.title,
                CreateNotebookDialog.description
              )
            }
          >
            Done
          </RebassButton>
          <RebassButton variant="secondary" onClick={props.close}>
            Cancel
          </RebassButton>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default Notebooks;
