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

import React, { useMemo } from "react";
import ListItem from "../list-item";
import { db } from "../../common/db";
import { store as appStore } from "../../stores/app-store";
import { hashNavigate } from "../../navigation";
import { Flex, Text } from "@theme-ui/components";
import * as Icon from "../icons";
import { Multiselect } from "../../common/multi-select";
import { confirm } from "../../common/dialog-controller";
import { useStore as useNotesStore } from "../../stores/note-store";
import { pluralize } from "../../utils/string";

function Topic({ item, index, onClick }) {
  const { id, notebookId } = item;
  const topic = item;
  const isOpened = useNotesStore(
    (store) => store.context?.value?.topic === item.id
  );

  const totalNotes = useMemo(() => {
    return db.notebooks.notebook(notebookId)?.topics.topic(id)?.totalNotes || 0;
  }, [id, notebookId]);

  return (
    <ListItem
      selectable
      isFocused={isOpened}
      isCompact
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
          <Text variant="subBody">{totalNotes}</Text>
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
    key: "set-as-default",
    title: "Set as default",
    checked: ({ topic }) => {
      const defaultNotebook = db.settings.getDefaultNotebook();
      return (
        defaultNotebook?.id === topic.notebookId &&
        defaultNotebook?.topic === topic.id
      );
    },
    icon: Icon.Topic,
    onClick: async ({ topic }) => {
      const defaultNotebook = db.settings.getDefaultNotebook();
      const isDefault =
        defaultNotebook?.id === topic.notebookId &&
        defaultNotebook?.topic === topic.id;

      await db.settings.setDefaultNotebook(
        isDefault ? undefined : { id: topic.notebookId, topic: topic.id }
      );
    }
  },
  {
    key: "shortcut",
    title: ({ topic }) =>
      db.shortcuts.exists(topic.id) ? "Remove shortcut" : "Create shortcut",
    icon: Icon.Shortcut,
    onClick: ({ topic }) => appStore.addToShortcuts(topic)
  },
  { key: "sep", type: "separator" },
  {
    key: "delete",
    title: "Delete",
    icon: Icon.Trash,
    color: "error",
    iconColor: "error",
    onClick: async ({ items, notebookId }) => {
      const result = await confirm({
        title: `Delete ${pluralize(items.length, "topic", "topics")}?`,
        positiveButtonText: `Yes`,
        negativeButtonText: "No",
        checks: {
          deleteContainingNotes: {
            text: `Move all notes in ${
              items.length > 1 ? "these topics" : "this topic"
            } to trash`
          }
        }
      });

      if (result) {
        if (result.deleteContainingNotes) {
          const notes = [];
          for (const item of items) {
            const topic = db.notebooks
              .notebook(notebookId)
              .topics.topic(item.id);
            notes.push(...topic.all);
          }
          await Multiselect.moveNotesToTrash(notes, false);
        }
        await Multiselect.deleteTopics(notebookId, items);
      }
    },
    multiSelect: true
  }
];
