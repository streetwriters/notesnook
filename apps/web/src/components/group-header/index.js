import * as Icon from "../icons";
import React from "react";
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
  const [sortDirection, setSortDirection] = usePersistentState(
    "sortDirection",
    "desc"
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
        <IconButton
          text="Default"
          icon={
            isExpanded ? (
              <Icon.ChevronUp size={18} />
            ) : (
              <Icon.ChevronDown size={18} />
            )
          }
          onClick={onExpand}
        />
      </Flex>
      {isExpanded && (
        <Flex flexDirection="column" py={2}>
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
                  <Icon.SortDesc size={18} />
                ) : (
                  <Icon.SortAsc size={18} />
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

function IconButton(props) {
  const { text, icon, onClick, textStyle } = props;
  return (
    <Flex
      onClick={onClick}
      px={1}
      sx={{
        borderRadius: "default",
        cursor: "pointer",
        ":hover": { bg: "hover" },
      }}
    >
      <Text variant="subtitle" fontWeight="normal" sx={textStyle}>
        {text}
      </Text>
      {icon}
    </Flex>
  );
}
