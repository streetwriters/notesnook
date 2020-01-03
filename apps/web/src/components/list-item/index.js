import React from "react";
import { Flex, Box, Text } from "rebass";
import * as Icon from "react-feather";
import { ButtonPressedStyle } from "../../theme";
import Dropdown, { DropdownTrigger, DropdownContent } from "../dropdown";
import Menu from "../menu";

const ListItem = props => (
  <Flex
    onClick={e => {
      if (props.onClick) {
        props.onClick();
      }
      e.stopPropagation();
    }}
    alignItems="center"
    justifyContent="space-between"
    py={1}
    bg={props.pinned ? "#1790F310" : "background"}
    sx={{
      position: "relative",
      borderRadius: "default",
      marginBottom: 2,
      marginTop: props.pinned ? 4 : 0,
      borderBottom: "1px solid",
      borderBottomColor: "navbg",
      cursor: "default",
      ...ButtonPressedStyle
    }}
  >
    {props.pinned && (
      <Flex
        bg="primary"
        sx={{
          borderRadius: 35,
          width: 35,
          height: 35,
          position: "absolute",
          top: -15,
          left: 0
        }}
        alignItems="center"
        justifyContent="center"
      >
        <Box
          bg="white"
          sx={{
            borderRadius: 5,
            width: 3,
            height: 3,
            boxShadow: "1px 1px 4px 0px #000000bd" //TODO
          }}
        />
      </Flex>
    )}
    <Box
      sx={{
        paddingTop: props.pinned ? 4 : 0
      }}
    >
      <Flex flexDirection="row" justifyContent="space-between">
        <Text fontFamily="heading" fontSize="title" fontWeight="bold">
          {props.title}
        </Text>
      </Flex>
      <Text
        display={props.body ? "flex" : "none"}
        variant="body"
        sx={{ marginBottom: 1 }}
      >
        {props.body}
      </Text>
      {props.subBody && props.subBody}
      <Text
        display={props.info ? "flex" : "none"}
        variant="body"
        fontSize={12}
        color="fontTertiary"
      >
        {props.info}
      </Text>
    </Box>
    <Dropdown
      style={{ zIndex: 999 }}
      ref={ref => (props.dropdownRefs[props.index] = ref)}
    >
      <DropdownTrigger>
        <Icon.MoreVertical
          size={24}
          strokeWidth={1.5}
          style={{ marginRight: -5 }}
        />
      </DropdownTrigger>
      <DropdownContent style={{ zIndex: 999, marginLeft: -110 }}>
        <Menu
          dropdownRef={props.dropdownRefs[props.index]}
          menuItems={props.menuItems}
          data={props.menuData}
        />
      </DropdownContent>
    </Dropdown>
  </Flex>
);

export default ListItem;
