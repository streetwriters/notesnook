import React from "react";
import { Flex, Text } from "rebass";
import * as Icon from "react-feather";
import ListItem from "../list-item";
import { store } from "../../stores/notebook-store";

const dropdownRefs = [];
const menuItems = (notebook, index) => [
  {
    title: notebook.pinned ? "Unpin" : "Pin",
    onClick: () => store.getState().pin(notebook, index)
  },
  { title: "Edit" },
  {
    title: "Delete",
    color: "red",
    onClick: () => store.getState().delete(notebook.id, index)
  }
];

export default class Notebook extends React.Component {
  shouldComponentUpdate(nextProps) {
    const prevItem = this.props.item;
    const nextItem = nextProps.item;
    return (
      prevItem.pinned !== nextItem.pinned ||
      prevItem.favorite !== nextItem.favorite
    );
  }
  render() {
    const { item, index, onClick, onTopicClick } = this.props;
    const notebook = item;
    console.log("rendering notebook", notebook.id);
    return (
      <ListItem
        onClick={onClick}
        title={notebook.title}
        body={notebook.description}
        subBody={
          <Flex sx={{ marginBottom: 1 }}>
            {notebook.topics.slice(1, 4).map(topic => (
              <Flex
                onClick={e => {
                  onTopicClick(notebook, topic);
                  e.stopPropagation();
                }}
                key={topic.id + topic.title}
                bg="primary"
                px={2}
                py={1}
                sx={{
                  marginRight: 1,
                  borderRadius: "default",
                  color: "static"
                }}
              >
                <Text variant="body" fontSize={11}>
                  {topic.title}
                </Text>
              </Flex>
            ))}
          </Flex>
        }
        info={
          <Flex justifyContent="center" alignItems="center">
            {new Date(notebook.dateCreated).toDateString().substring(4)}
            <Text as="span" mx={1}>
              •
            </Text>
            <Text>{notebook.totalNotes} Notes</Text>
            {notebook.favorite && (
              <Icon.Star size={16} style={{ marginLeft: 5 }} />
            )}
          </Flex>
        }
        pinned={notebook.pinned}
        dropdownRefs={dropdownRefs}
        index={index}
        menuData={notebook}
        menuItems={menuItems(notebook, index)}
      />
    );
  }
}
