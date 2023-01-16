/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
import { useState } from "react";
import { Button, Flex, Text } from "@theme-ui/components";
import { FilteredList } from "../filtered-list";
import {
  NotebookReference,
  ItemReference,
  SelectedNotebook
} from "../../common/bridge";
import { Icon } from "../icons/icon";
import { Icons } from "../icons";
import { useAppStore } from "../../stores/app-store";
import { Picker } from "../picker";

type NotebookPickerProps = {
  selectedNotebook?: SelectedNotebook;
  onSelected: (notebook?: SelectedNotebook) => void;
};
export const NotebookPicker = (props: NotebookPickerProps) => {
  const { selectedNotebook, onSelected } = props;

  const [modalVisible, setModalVisible] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const notebooks = useAppStore((s) => s.notebooks);

  const close = () => {
    setExpanded(null);
    setModalVisible(false);
  };
  const open = () => setModalVisible(true);

  return (
    <>
      <Flex sx={{ alignItems: "center" }}>
        <Button
          variant="tool"
          onClick={open}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flex: 1,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            height: 33
          }}
          title={
            selectedNotebook
              ? `${selectedNotebook.title} > ${selectedNotebook.topic.title}`
              : `Select a notebook`
          }
        >
          <Text variant="text">
            {selectedNotebook
              ? `${selectedNotebook.title} > ${selectedNotebook.topic.title}`
              : `Select a notebook`}
          </Text>
          <Icon path={Icons.chevronDown} color="text" size={18} />
        </Button>
        {selectedNotebook && (
          <Button
            variant="tool"
            onClick={() => onSelected(undefined)}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              height: 33
            }}
            title={"Clear selection"}
          >
            <Icon path={Icons.close} color="text" size={16} />
          </Button>
        )}
      </Flex>

      <Picker onClose={close} isOpen={modalVisible}>
        <FilteredList
          getAll={() => notebooks}
          filter={(items, query) =>
            items.filter((item) => item.title.toLowerCase().indexOf(query) > -1)
          }
          itemName="notebook"
          placeholder={"Search for a notebook"}
          refreshItems={() => notebooks}
          renderItem={(item) => (
            <Notebook
              notebook={item}
              isExpanded={expanded === item.id}
              onExpand={(id) => setExpanded(id || null)}
              onSelected={(notebook) => {
                onSelected(notebook);
                close();
              }}
            />
          )}
        />
      </Picker>
    </>
  );
};

type NotebookProps = {
  notebook: NotebookReference;
  isExpanded: boolean;
  onExpand: (notebookId?: string) => void;
  onSelected: (notebook: SelectedNotebook) => void;
};
function Notebook(props: NotebookProps) {
  const { notebook, isExpanded, onExpand, onSelected } = props;

  return (
    <Flex
      sx={{
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      <Button
        variant="list"
        onClick={() => {
          if (isExpanded) return onExpand();
          onExpand(notebook.id);
        }}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: isExpanded ? "border" : "transparent",
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
          {notebook.title}
        </Text>
        <Icon
          path={isExpanded ? Icons.chevronUp : Icons.chevronDown}
          color="text"
          size={18}
        />
      </Button>

      {isExpanded ? (
        <FilteredList
          getAll={() => notebook.topics}
          filter={(items, query) =>
            items.filter((item) => item.title.toLowerCase().indexOf(query) > -1)
          }
          itemName="topic"
          placeholder={"Search for a topic"}
          refreshItems={() => notebook.topics}
          renderItem={(topic) => (
            <Topic
              topic={topic}
              onSelected={() => {
                onSelected({ id: notebook.id, title: notebook.title, topic });
              }}
            />
          )}
        />
      ) : null}
    </Flex>
  );
}

type TopicProps = {
  topic: ItemReference;
  onSelected: () => void;
};
function Topic(props: TopicProps) {
  const { topic, onSelected } = props;
  return (
    <Button variant="list" onClick={onSelected} sx={{ pl: 3, py: "7px" }}>
      <Text variant="text">{topic.title}</Text>
    </Button>
  );
}
