import React from "react";
import { Flex, Text } from "rebass";
import TimeAgo from "timeago-react";
import ListItem from "../list-item";

const dropdownRefs = [];
const menuItems = [
  { title: "Unfavorite" },
  {
    title: "Delete",
    color: "red"
  }
];

const Favourite = ({ item, index }) => {
  const trashItem = item;
  return (
    <ListItem
      title={trashItem.title}
      body={trashItem.headline}
      index={index}
      onClick={() => {}} //TODO
      info={
        <Flex justifyContent="center" alignItems="center">
          <TimeAgo datetime={trashItem.dateDeleted} />
          <Text as="span" mx={1}>
            •
          </Text>
          <Text color="primary">
            {trashItem.type[0].toUpperCase() + trashItem.type.substring(1)}
          </Text>
        </Flex>
      }
      menuData={trashItem}
      menuItems={menuItems}
      dropdownRefs={dropdownRefs}
    />
  );
};

export default Favourite;