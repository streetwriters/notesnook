import * as Icon from "../icons";
import React, { useState } from "react";
import { Flex, Text } from "rebass";
import Animated from "../animated";
import { usePersistentState } from "../../utils/hooks";
import { useStore as useNoteStore } from "../../stores/note-store";
import { useTheme } from "emotion-theming";

const groups = [
  { type: undefined, title: "Default" },
  { type: "abc", title: "Alphabetic" },
  { type: "year", title: "Year" },
  { type: "week", title: "Week" },
  { type: "month", title: "Month" },
];

function getGroupTitleByType(type) {
  return groups.find((v) => v.type === type).title;
}

function GroupHeader(props) {
  const { title, groups, onJump, wasJumpedTo, index } = props;
  const [selectedGroup] = usePersistentState("selectedGroup", undefined);
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuType, setMenuType] = useState();
  const theme = useTheme();
  if (!title) return null;

  return (
    <Animated.Flex
      bg={"bgSecondary"}
      flexDirection="column"
      sx={{ cursor: "pointer" }}
      animate={{
        backgroundColor: wasJumpedTo
          ? theme.colors["dimPrimary"]
          : "bgSecondary",
      }}
      transition={{ duration: 0.3, repeatType: "reverse", repeat: 3 }}
      onClick={() => {
        if (groups.length <= 0) return;
        setMenuType("jumpto");
        setIsExpanded((s) => !s);
      }}
    >
      <Flex
        //my={2}
        pl={2}
        py={1}
        alignItems="center"
        justifyContent="space-between"
        sx={{ borderBottom: "1px solid", borderBottomColor: "border" }}
      >
        <Text variant="subtitle" color="primary">
          {title}
        </Text>
        {index === 0 && (
          <IconButton
            text={getGroupTitleByType(selectedGroup)}
            icon={
              isExpanded ? (
                <Icon.ChevronUp size={18} />
              ) : (
                <Icon.ChevronDown size={18} />
              )
            }
            onClick={() => {
              setMenuType("groupby");
              setIsExpanded((s) => !s);
            }}
          />
        )}
      </Flex>
      <Flex
        flexDirection="column"
        p={menuType === "jumpto" ? 2 : 0}
        pt={2}
        style={{
          display: isExpanded ? "flex" : "none",
        }}
        justifyContent="center"
        sx={{
          position: "absolute",
          zIndex: 1,
          bg: "bgSecondary",
          width: "100%",
          top: "29px",
          borderBottom: "1px solid",
          borderBottomColor: "border",
          borderBottomWidth: 1,
          boxShadow: "0px 3px 6px 0px #0000005e",
        }}
      >
        <JumpToGroupMenu
          onJump={(title) => {
            setIsExpanded(false);
            onJump(title);
          }}
          isVisible={menuType === "jumpto"}
          groups={groups}
        />
        <GroupByMenu isVisible={menuType === "groupby"} />
      </Flex>
    </Animated.Flex>
  );
}
export default GroupHeader;

function IconButton(props) {
  const { text, icon, onClick, textStyle, sx } = props;
  return (
    <Flex
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      px={1}
      sx={{
        borderRadius: "default",
        cursor: "pointer",
        ":hover": { bg: "hover" },
        ...sx,
      }}
      alignItems="center"
    >
      <Text variant="subtitle" fontWeight="normal" sx={textStyle}>
        {text}
      </Text>
      {icon}
    </Flex>
  );
}

function JumpToGroupMenu(props) {
  const { groups, isVisible, onJump } = props;
  if (!isVisible) return null;
  return (
    <>
      <Text color="primary" variant="title" mb={1}>
        Jump to
      </Text>
      <Flex flexWrap="wrap">
        {groups.map((group) => (
          <IconButton
            text={group.title}
            textStyle={{ fontSize: "body" }}
            onClick={() => onJump(group.title)}
            sx={{ bg: "shade", mr: 1, mt: 1 }}
          ></IconButton>
        ))}
      </Flex>
    </>
  );
}

function GroupByMenu(props) {
  const { isVisible } = props;

  const [sortDirection, setSortDirection] = usePersistentState(
    "sortDirection",
    "desc"
  );
  const [selectedGroup, setSelectedGroup] = usePersistentState(
    "selectedGroup",
    undefined
  );
  const refresh = useNoteStore((store) => store.refresh);

  if (!isVisible) return null;
  return (
    <>
      <Flex
        pl={2}
        pr={1}
        mb={1}
        justifyContent="space-between"
        alignItems="center"
      >
        <Text color="primary" variant="title">
          Group by
        </Text>
        <IconButton
          text={sortDirection === "desc" ? "Ascending" : "Descending"}
          icon={
            sortDirection === "desc" ? (
              <Icon.SortDesc size={14} />
            ) : (
              <Icon.SortAsc size={14} />
            )
          }
          textStyle={{ mr: 1 }}
          onClick={() => {
            setSortDirection(sortDirection === "desc" ? "asc" : "desc");
            refresh();
          }}
        />
      </Flex>
      {groups.map((item) => (
        <Flex
          key={item.title}
          justifyContent="space-between"
          alignItems="center"
          p={1}
          px={2}
          sx={{ cursor: "pointer", ":hover": { bg: "shade" } }}
          onClick={() => {
            setSelectedGroup(item.type);
            refresh();
          }}
        >
          <Text variant="body">{item.title}</Text>
          {selectedGroup === item.type && (
            <Icon.Checkmark size={16} color="primary" />
          )}
        </Flex>
      ))}
    </>
  );
}
