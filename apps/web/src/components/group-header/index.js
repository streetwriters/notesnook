import * as Icon from "../icons";
import React, { useState } from "react";
import { Flex, Text } from "rebass";
import { usePersistentState } from "../../utils/hooks";
import { useStore as useNoteStore } from "../../stores/note-store";

const groups = [
  { type: undefined, title: "Default" },
  { type: "abc", title: "Alphabetic" },
  { type: "year", title: "Year" },
  { type: "week", title: "Week" },
  { type: "month", title: "Month" },
];

function GroupHeader(props) {
  const { title, onExpand, isExpanded } = props;
  const [selectedGroup, setSelectedGroup] = usePersistentState(
    "selectedGroup",
    undefined
  );
  const refresh = useNoteStore((store) => store.refresh);
  if (!title) return null;

  return (
    <Flex
      bg="bgSecondary"
      flexDirection="column"
      sx={{
        borderBottom: "1px solid",
        borderBottomColor: "border",
        borderBottomWidth: isExpanded ? 1 : 0,
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
        <Flex
          onClick={onExpand}
          px={1}
          sx={{
            borderRadius: "default",
            cursor: "pointer",
            ":hover": { bg: "hover" },
          }}
        >
          <Text variant="subtitle" fontWeight="normal">
            Default
          </Text>
          {isExpanded ? (
            <Icon.ChevronUp size={18} />
          ) : (
            <Icon.ChevronDown size={18} />
          )}
        </Flex>
      </Flex>
      {isExpanded && (
        <Flex flexDirection="column" py={2}>
          <Flex
            px={2}
            mb={1}
            justifyContent="space-between"
            alignItems="center"
          >
            <Text color="primary" variant="title">
              Group by
            </Text>
            <Text variant="body">Descending</Text>
          </Flex>
          {groups.map((item) => (
            <Flex
              key={item.title}
              justifyContent="space-between"
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
        </Flex>
      )}
    </Flex>
  );
}
export default GroupHeader;
