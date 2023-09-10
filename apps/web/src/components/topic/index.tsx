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

import React from "react";
import ListItem from "../list-item";
import { db } from "../../common/db";
import { store as appStore } from "../../stores/app-store";
import { hashNavigate, navigate } from "../../navigation";
import { Flex, Text } from "@theme-ui/components";
import { Edit, Topic as TopicIcon, Shortcut, Trash } from "../icons";
import { Multiselect } from "../../common/multi-select";
import { confirm } from "../../common/dialog-controller";
import { useStore as useNotesStore } from "../../stores/note-store";
import { pluralize } from "@notesnook/common";
import { getTotalNotes } from "@notesnook/common";
import { Item } from "../list-container/types";
import { MenuItem } from "@notesnook/ui";

type TopicProps = { item: Item };
function Topic(props: TopicProps) {
  const { item: topic } = props;
  const isOpened = useNotesStore(
    (store) => (store.context?.value as any)?.topic === topic.id
  );

  return (
    <ListItem
      isFocused={isOpened}
      isCompact
      item={topic}
      onClick={() => navigate(`/notebooks/${topic.notebookId}/${topic.id}`)}
      title={topic.title}
      footer={<Text variant="subBody">{getTotalNotes(topic)}</Text>}
      menuItems={menuItems}
    />
  );
}

export default React.memo(Topic, (prev, next) => {
  return prev?.item?.title === next?.item?.title;
});

const menuItems: (topic: any, items?: any[]) => MenuItem[] = (
  topic,
  items = []
) => {
  const defaultNotebook = db.settings?.getDefaultNotebook();
  return [
    {
      type: "button",
      key: "edit",
      title: "Edit",
      icon: Edit.path,
      onClick: () =>
        hashNavigate(`/notebooks/${topic.notebookId}/topics/${topic.id}/edit`)
    },
    {
      type: "button",
      key: "set-as-default",
      title: "Set as default",
      checked:
        defaultNotebook?.id === topic.notebookId &&
        defaultNotebook?.topic === topic.id,
      icon: TopicIcon.path,
      onClick: async () => {
        const defaultNotebook = db.settings?.getDefaultNotebook();
        const isDefault =
          defaultNotebook?.id === topic.notebookId &&
          defaultNotebook?.topic === topic.id;

        await db.settings?.setDefaultNotebook(
          isDefault ? undefined : { id: topic.notebookId, topic: topic.id }
        );
      }
    },
    {
      type: "button",
      key: "shortcut",
      title: db.shortcuts?.exists(topic.id)
        ? "Remove shortcut"
        : "Create shortcut",
      icon: Shortcut.path,
      onClick: () => appStore.addToShortcuts(topic)
    },
    { key: "sep", type: "separator" },
    {
      type: "button",
      key: "delete",
      title: "Delete",
      icon: Trash.path,
      variant: "dangerous",
      onClick: async () => {
        const result = await confirm({
          title: `Delete ${pluralize(items.length, "topic")}?`,
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
                ?.notebook(item.notebookId)
                .topics.topic(item.id);
              if (!topic) continue;
              notes.push(...topic.all);
            }
            await Multiselect.moveNotesToTrash(notes, false);
          }
          await Multiselect.deleteTopics(topic.notebookId, items);
        }
      },
      multiSelect: true
    }
  ];
};
