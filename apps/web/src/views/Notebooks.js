import React, { useState } from "react";
import { Flex, Box, Text, Button as RebassButton } from "rebass";
import { Input, Label } from "@rebass/forms";
import Button from "../components/button";
import * as Icon from "react-feather";
import theme, { ButtonPressedStyle, SHADOW, DIALOG_SHADOW } from "../theme";
import Search from "../components/search";
import Modal from "react-modal";

const inputRefs = [];
const notebook = {
  title: "December",
  dateCreated: Date.now(),
  topics: ["Birthday", "Christmas"],
  totalNotes: 12
};
const Notebooks = props => {
  const [open, setOpen] = useState(false);
  return (
    <Flex flexDirection="column">
      <Search placeholder="Search" />
      <Flex
        flexDirection="row"
        bg={"primary"}
        py={3}
        px={3}
        justifyContent="space-between"
        alignItems="flex-end"
        sx={{
          fontFamily: "body",
          fontWeight: "body",
          fontSize: "body",
          borderRadius: "default",
          borderBottom: "1px solid",
          borderBottomColor: "border",
          ...ButtonPressedStyle
        }}
      >
        <Box>
          <Text fontSize="title" fontWeight="bold">
            {notebook.title}
          </Text>
          <Text color="accent" fontSize={12}>
            12 hours ago
          </Text>
        </Box>
        <Text className="unselectable">{notebook.totalNotes} Notes</Text>
      </Flex>

      <Button
        Icon={Icon.Plus}
        content="Create a notebook"
        onClick={() => setOpen(true)}
      />
      <CreateNotebookDialog open={open} close={() => setOpen(false)} />
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
          <Input variant="default" placeholder="Enter notebook name" />
          <Text variant="body" fontWeight="bold" my={1}>
            Topics (optional):
          </Text>
          <Box sx={{ maxHeight: 44 * 5, overflowY: "auto", marginBottom: 1 }}>
            {topics.map((item, index) => (
              <Flex flexDirection="row" sx={{ marginBottom: 1 }}>
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
          <RebassButton variant="primary" mx={1} onClick={props.close}>
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
