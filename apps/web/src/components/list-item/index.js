import React, { useEffect, useState, useCallback } from "react";
import { Flex, Box, Text } from "rebass";
import * as Icon from "../icons";
import Dropdown, { DropdownTrigger, DropdownContent } from "../dropdown";
import Menu from "../menu";
import {
  store as appStore,
  useStore as useSelectionStore
} from "../../stores/selection-store";
import useContextMenu from "../../utils/useContextMenu";

function ActionsMenu(props) {
  return (
    <Menu
      id={props.id}
      menuItems={props.menuItems}
      data={props.menuData}
      style={props.style}
      closeMenu={props.closeMenu}
    />
  );
}

function selectMenuItem(isSelected, toggleSelection) {
  return {
    title: isSelected ? "Unselect" : "Select",
    onClick: () => {
      const appState = appStore;
      if (!appState.isSelectionMode) {
        appState.enterSelectionMode();
        toggleSelection();
      } else {
        toggleSelection();
      }
    }
  };
}

const ItemSelector = ({ isSelected, toggleSelection }) => {
  return (
    <Box
      width={24}
      sx={{
        marginLeft: 3,
        marginRight: 1,
        color: "primary",
        cursor: "pointer"
      }}
      onClick={() => toggleSelection()}
    >
      {isSelected ? <Icon.Check /> : <Icon.CircleEmpty />}
    </Box>
  );
};

function ListItem(props) {
  const [parentRef, closeContextMenu] = useContextMenu(
    `contextMenu${props.index}`
  );
  const isSelectionMode = useSelectionStore(store => store.isSelectionMode);
  const selectedItems = useSelectionStore(store => store.selectedItems);
  const isSelected =
    selectedItems.findIndex(item => props.item.id === item.id) > -1;
  const selectItem = useSelectionStore(store => store.selectItem);
  const [menuItems, setMenuItems] = useState(props.menuItems);

  const toggleSelection = useCallback(
    function toggleSelection() {
      selectItem(props.item);
    },
    [selectItem, props.item]
  );

  useEffect(() => {
    if (!isSelectionMode && isSelected) toggleSelection();
  }, [isSelectionMode, toggleSelection, isSelected]);

  useEffect(() => {
    if (props.selectable) {
      setMenuItems([
        selectMenuItem(isSelected, toggleSelection),
        ...props.menuItems
      ]);
    }
  }, [props.menuItems, isSelected, props.selectable, toggleSelection]);

  return (
    <Flex
      ref={parentRef}
      bg={props.pinned ? "shade" : "background"}
      alignItems="center"
      sx={{
        borderBottom: "1px solid",
        borderBottomColor: "border",
        cursor: "pointer",
        ":hover": {
          borderBottomColor: "primary"
        }
      }}
    >
      {isSelectionMode && (
        <ItemSelector
          isSelected={isSelected}
          toggleSelection={toggleSelection}
        />
      )}
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
          paddingBottom: 2

          //TODO add onpressed reaction
        }}
      >
        {props.pinned && (
          <Flex
            variant="rowCenter"
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
            if (isSelectionMode) {
              toggleSelection();
            } else if (props.onClick) {
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
          <Text
            color={props.focused ? "primary" : "text"}
            fontFamily={"heading"}
            fontSize="title"
            fontWeight={"bold"}
          >
            {props.title}
          </Text>
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
                  size={22}
                  strokeWidth={2}
                  color="icon"
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
}
export default ListItem;
