import React, { useState, useEffect } from "react";
import { Flex, Text } from "rebass";
import { ev } from "../../common";
import ListItem from "../list-item";
import TimeAgo from "timeago-react";
import ListContainer from "../list-container";

function ListView({ items, menu, button, onClick, noType }) {
  return (
    items && (
      <ListContainer
        itemsLength={items.length}
        item={index => {
          const item = items[index];
          return (
            <ListItem
              title={item.title}
              body={item.headline}
              index={index}
              onClick={onClick && onClick.bind(this, item)}
              info={
                <Flex justifyContent="center" alignItems="center">
                  <TimeAgo datetime={item.dateDeleted || item.dateCreated} />
                  <Text as="span" mx={1}>
                    •
                  </Text>
                  {!noType && (
                    <Text color="primary">
                      {item.type[0].toUpperCase() + item.type.substring(1)}
                    </Text>
                  )}
                </Flex>
              }
              menuData={item}
              menuItems={menu.menuItems(item, index)}
              dropdownRefs={menu.dropdownRefs}
            />
          );
        }}
        button={button}
      />
    )
  );
}

export default ListView;
