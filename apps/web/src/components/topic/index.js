/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import React, { useMemo } from "react";
import ListItem from "../list-item";
import { db } from "../../common/db";
import { store as appStore } from "../../stores/app-store";
import { hashNavigate } from "../../navigation";
import { Flex, Text } from "@theme-ui/components";
import * as Icon from "../icons";
import { Multiselect } from "../../common/multi-select";
import { pluralize } from "../../utils/string";

function Topic({ item, index, onClick }) {
  const { id, notebookId } = item;
  const topic = item;
  const totalNotes = useMemo(() => {
    return db.notebooks.notebook(notebookId)?.topics.topic(id).totalNotes;
  }, [id, notebookId]);

  return (
    <ListItem
      selectable
      item={topic}
      onClick={onClick}
      title={topic.title}
      footer={
        <Flex
          sx={{
            fontSize: "subBody",
            color: "fontTertiary",
            alignItems: "center"
          }}
        >
          <Text variant="subBody" sx={{ color: "primary" }}>
            Topic
          </Text>
          <Text as="span" mx={1}>
            •
          </Text>
          <Text variant="subBody">
            {pluralize(totalNotes || 0, "note", "notes")}
          </Text>
        </Flex>
      }
      index={index}
      menu={{
        items: menuItems,
        extraData: { topic, notebookId: topic.notebookId }
      }}
    />
  );
}

export default React.memo(Topic, (prev, next) => {
  return prev?.item?.title === next?.item?.title;
});

const menuItems = [
  {
    key: "edit",
    title: "Edit",
    icon: Icon.Edit,
    onClick: ({ topic }) =>
      hashNavigate(`/notebooks/${topic.notebookId}/topics/${topic.id}/edit`)
  },
  {
    key: "shortcut",
    title: ({ topic }) =>
      db.settings.isPinned(topic.id) ? "Remove shortcut" : "Create shortcut",
    icon: Icon.Shortcut,
    onClick: ({ topic }) => appStore.pinItemToMenu(topic)
  },
  {
    key: "delete",
    title: "Delete",
    icon: Icon.Trash,
    color: "error",
    iconColor: "error",
    onClick: async ({ items, notebookId }) => {
      await Multiselect.deleteTopics(notebookId, items);
    },
    multiSelect: true
  }
];
