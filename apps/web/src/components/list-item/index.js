import React from "react";
import { Flex, Box, Text } from "rebass";
import * as Icon from "react-feather";
import Dropdown, { DropdownTrigger, DropdownContent } from "../dropdown";
import Menu from "../menu";
import { useStore } from "../../stores/note-store";

const ListItem = props => {
  const selectedNote = useStore(store => store.selectedNote);
  const isSelected = selectedNote === props.id;
  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      py={1}
      bg={props.pinned || isSelected ? "shade" : "background"}
      px={2}
      sx={{
        position: "relative",
        marginTop: props.pinned ? 4 : 0,
        borderBottom: "1px solid",
        borderBottomColor: "navbg",
        cursor: "default",
        ":hover": {
          borderBottomColor: "primary",
          cursor: "pointer"
        }
        //TODO add onpressed reaction
      }}
    >
      {props.pinned && (
        <Flex
          bg="primary"
          sx={{
            borderRadius: 35,
            width: 30,
            height: 30,
            position: "absolute",
            top: -15,
            left: 0,
            marginTop: 5,
            boxShadow: "2px 1px 3px #00000066"
          }}
          mx={2}
          alignItems="center"
          justifyContent="center"
        >
          <Box
            bg="static"
            sx={{
              borderRadius: 5,
              width: 5,
              height: 5
            }}
          />
        </Flex>
      )}
      <Box
        onClick={() => {
          //e.stopPropagation();
          if (props.onClick) {
            props.onClick();
          }
        }}
        sx={{
          flex: "1 1 auto",
          paddingTop: props.pinned ? 4 : 0,
          ":hover": {
            cursor: "pointer"
          }
        }}
      >
        <Flex flexDirection="row" justifyContent="space-between">
          <Text fontFamily={"heading"} fontSize="title" fontWeight={"bold"}>
            {props.title}
          </Text>
        </Flex>
        <Text
          display={props.body ? "flex" : "none"}
          variant="body"
          sx={{
            marginBottom: 1,
            ":hover": {
              cursor: "pointer"
            },
            flexWrap: "wrap"
          }}
        >
          {props.body}
        </Text>
        {props.subBody && props.subBody}
        <Text
          display={props.info ? "flex" : "none"}
          variant="body"
          fontSize={10}
          color="fontTertiary"
        >
          {props.info}
        </Text>
      </Box>
      {props.menuItems && props.dropdownRefs && (
        <Dropdown
          style={{ zIndex: 1, marginRight: -4 }}
          ref={ref => (props.dropdownRefs[props.index] = ref)}
        >
          <DropdownTrigger>
            <Text sx={{ ":active, :hover": { color: "primary" } }}>
              <Icon.MoreVertical
                size={24}
                strokeWidth={1.5}
                style={{ marginRight: -5 }}
              />
            </Text>
          </DropdownTrigger>
          <DropdownContent style={{ zIndex: 2, marginLeft: -110 }}>
            <Menu
              dropdownRef={props.dropdownRefs[props.index]}
              menuItems={props.menuItems}
              data={props.menuData}
            />
          </DropdownContent>
        </Dropdown>
      )}
    </Flex>
  );
};

export default ListItem;
