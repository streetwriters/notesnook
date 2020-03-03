import React from "react";
import { Flex, Box, Text } from "rebass";
import * as Icon from "react-feather";
import Dropdown, { DropdownTrigger, DropdownContent } from "../dropdown";
import Menu from "../menu";
import { useStore } from "../../stores/note-store";
import useContextMenu from "../../utils/useContextMenu";

const ActionsMenu = props => (
  <Menu
    id={props.id}
    menuItems={props.menuItems}
    data={props.menuData}
    style={props.style}
    closeMenu={props.closeMenu}
  />
);

const ListItem = props => {
  const selectedNote = useStore(store => store.selectedNote);
  const isSelected = selectedNote === props.id;
  const [parentRef, closeContextMenu] = useContextMenu(
    `contextMenu${props.index}`
  );
  const menuItems = [
    { title: isSelected ? "Unselect" : "Select", onClick: () => {} },
    ...props.menuItems
  ];
  return (
    <Flex
      ref={parentRef}
      bg={props.pinned || isSelected ? "shade" : "background"}
      alignItems="center"
    >
      <Box width={24} sx={{ marginLeft: 3, marginRight: 1 }}>
        <Icon.Circle />
      </Box>
      <Flex
        flex="1 1 auto"
        alignItems="center"
        justifyContent="space-between"
        px={2}
        sx={{
          width: "full",
          position: "relative",
          marginTop: props.pinned ? 4 : 0,
          paddingTop: props.pinned ? 0 : 2,
          paddingBottom: 2,
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
              position: "absolute",
              top: -15,
              left: 0,
              borderRadius: 35,
              width: 30,
              height: 30,
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
            fontSize={11}
            color="fontTertiary"
            sx={{ marginTop: 2 }}
          >
            {props.info}
          </Text>
        </Box>
        {props.menuItems && props.dropdownRefs && (
          <Dropdown
            style={{ zIndex: 1, marginRight: -4 }}
            ref={ref => (props.dropdownRefs[props.index] = ref)}
          >
            <DropdownTrigger onClick={() => closeContextMenu()}>
              <Text sx={{ ":active, :hover": { color: "primary" } }}>
                <Icon.MoreVertical
                  size={24}
                  strokeWidth={1.5}
                  style={{ marginRight: -5 }}
                />
              </Text>
            </DropdownTrigger>
            <DropdownContent style={{ zIndex: 2, marginLeft: -130 }}>
              <ActionsMenu
                {...props}
                menuItems={menuItems}
                closeMenu={() => props.dropdownRefs[props.index].hide()}
              />
            </DropdownContent>
          </Dropdown>
        )}
      </Flex>
      {props.menuItems && props.dropdownRefs && (
        <ActionsMenu
          {...props}
          menuItems={menuItems}
          id={`contextMenu${props.index}`}
          style={{
            position: "absolute",
            display: "none",
            zIndex: 999
          }}
          closeMenu={() => closeContextMenu()}
        />
      )}
    </Flex>
  );
};

export default ListItem;
