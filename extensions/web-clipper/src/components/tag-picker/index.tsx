import { useState } from "react";
import { Button, Flex, Text } from "@theme-ui/components";
import { FilteredList } from "../filtered-list";
import { ItemReference } from "../../common/bridge";
import { Icon } from "../icons/icon";
import { Icons } from "../icons";
import { useAppStore } from "../../stores/app-store";
import { Picker } from "../picker";

type TagPickerProps = {
  selectedTags: string[];
  onSelected: (tag: string) => void;
  onDeselected: (tag: string) => void;
};
export const TagPicker = (props: TagPickerProps) => {
  const { selectedTags, onSelected, onDeselected } = props;

  const [modalVisible, setModalVisible] = useState(false);
  const tags = useAppStore((s) => s.tags);

  const close = () => {
    setModalVisible(false);
  };
  const open = () => setModalVisible(true);

  return (
    <>
      <Flex
        sx={{
          border: "2px solid var(--border)",
          p: 1,
          pb: 0,
          borderRadius: "default",
          flexWrap: "wrap"
        }}
      >
        {selectedTags.length
          ? selectedTags.map((tag, index) => (
              <InlineTag
                key={tag}
                tag={tag}
                onDeselected={() => {
                  onDeselected(tag);
                }}
              />
            ))
          : null}
        <Flex
          onClick={open}
          sx={{
            bg: "bgSecondary",
            border: "1px solid var(--border)",
            borderRadius: "small",
            mr: 1,
            px: 1,
            mb: 1,
            cursor: "pointer",
            ":hover": {
              bg: "hover"
            }
          }}
          title="Click to assign more tags"
        >
          <Icon path={Icons.plus} size={12} color="fontTertiary" />
          <Text variant="subBody" sx={{ ml: "2px", color: "icon" }}>
            Assign a tag
          </Text>
        </Flex>
      </Flex>
      <Picker onClose={close} isOpen={modalVisible}>
        <FilteredList
          getAll={() => tags}
          filter={(items, query) =>
            items.filter((item) => item.title.toLowerCase().indexOf(query) > -1)
          }
          itemName="tag"
          placeholder={"Search for a tag"}
          onCreateNewItem={(tag) => onSelected(tag)}
          refreshItems={() => tags}
          renderItem={(tag, index) => (
            <Tag
              tag={tag}
              onSelected={() => {
                onSelected(tag.title);
              }}
              isSelected={selectedTags.indexOf(tag.title) > -1}
            />
          )}
        />
      </Picker>
    </>
  );
};

type TagProps = {
  tag: ItemReference;
  isSelected: boolean;
  onSelected: () => void;
};
function Tag(props: TagProps) {
  const { tag, onSelected, isSelected } = props;

  return (
    <Button
      variant="list"
      onClick={onSelected}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: "7px",
        px: 1
      }}
    >
      <Text
        sx={{
          fontSize: "13px",
          fontWeight: 400,
          color: "var(--paragraph)"
        }}
      >
        #{tag.title}
      </Text>
      {isSelected ? <Icon path={Icons.check} color="text" size={14} /> : null}
    </Button>
  );
}

function InlineTag(props: { tag: string; onDeselected: () => void }) {
  const { tag, onDeselected } = props;

  return (
    <Flex
      onClick={onDeselected}
      sx={{
        bg: "bgSecondary",
        border: "1px solid var(--border)",
        borderRadius: "small",
        mr: 1,
        px: 1,
        mb: 1,
        cursor: "pointer",
        ":hover": {
          bg: "hover"
        }
      }}
      title="Click to remove"
    >
      <Text variant="subBody" sx={{ color: "icon" }}>
        #{tag}
      </Text>
    </Flex>
  );
}
