import React, { useState, useEffect } from "react";
import { Flex, Text } from "rebass";
import Button from "../button";
import { ev } from "../../common";
import ListItem from "../list-item";
import TimeAgo from "timeago-react";
import Search from "../search";
import * as Icon from "react-feather";
import { Virtuoso as List } from "react-virtuoso";

function ListView({ type, getItems, menu, button }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    function onRefreshItems() {
      setItems(getItems());
    }
    onRefreshItems();
    ev.addListener(`refresh${type}`, onRefreshItems);
    return () => {
      ev.removeListener(`refresh${type}`, onRefreshItems);
    };
  }, [getItems, type]);

  return (
    <Flex flexDirection="column" flex="1 1 auto">
      {items.length > 0 ? (
        <Flex flexDirection="column" flex="1 1 auto">
          <Search placeholder="Search" />
          <List
            style={{
              width: "100%",
              flex: "1 1 auto",
              height: "auto",
              overflowX: "hidden"
            }}
            totalCount={items.length}
            item={index => {
              const item = items[index];
              return (
                <ListItem
                  title={item.title}
                  body={item.headline}
                  index={index}
                  onClick={() => {}} //TODO
                  info={
                    <Flex justifyContent="center" alignItems="center">
                      <TimeAgo
                        datetime={item.dateDeleted || item.dateCreated}
                      />
                      <Text as="span" mx={1}>
                        •
                      </Text>
                      <Text color="primary">
                        {item.type[0].toUpperCase() + item.type.substring(1)}
                      </Text>
                    </Flex>
                  }
                  menuData={item}
                  menuItems={menu.menuItems(item)}
                  dropdownRefs={menu.dropdownRefs}
                />
              );
            }}
          />
          {button && (
            <Button
              Icon={button.icon}
              content={button.callToAction}
              onClick={button.onClick}
            />
          )}
        </Flex>
      ) : (
        <Flex
          flex="1 1 auto"
          alignItems="center"
          justifyContent="center"
          color="#9b9b9b"
          flexDirection="column"
        >
          {type == "Favorites" ? (
            <Icon.Star size={72} strokeWidth={1.5} />
          ) : (
            <Icon.Trash size={72} strokeWidth={1.5} />
          )}
          <Text variant="title">You have no {type}.</Text>
        </Flex>
      )}
    </Flex>
  );
}

export default ListView;
