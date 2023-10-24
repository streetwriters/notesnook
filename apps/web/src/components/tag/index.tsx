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

import ListItem from "../list-item";
import { hashNavigate, navigate } from "../../navigation";
import { Text } from "@theme-ui/components";
import { store as appStore } from "../../stores/app-store";
import { store as tagStore } from "../../stores/tag-store";
import { store as noteStore } from "../../stores/note-store";
import { store as editorStore } from "../../stores/editor-store";
import { db } from "../../common/db";
import { Edit, Shortcut, DeleteForver } from "../icons";
import { showToast } from "../../utils/toast";
import { pluralize } from "@notesnook/common";
import { MenuItem } from "@notesnook/ui";
import { Tag } from "@notesnook/core/dist/types";

type TagProps = { item: Tag; totalNotes: number };
function Tag(props: TagProps) {
  const { item, totalNotes } = props;
  const { id, title } = item;

  return (
    <ListItem
      item={item}
      isCompact
      title={
        <Text as="span">
          <Text as="span" sx={{ color: "accent" }}>
            {"#"}
          </Text>
          {title}
        </Text>
      }
      footer={
        <Text mt={1} variant="subBody">
          {totalNotes}
        </Text>
      }
      menuItems={menuItems}
      onClick={() => {
        navigate(`/tags/${id}`);
      }}
    />
  );
}
export default Tag;

const menuItems: (tag: Tag, ids?: string[]) => MenuItem[] = (tag, ids = []) => {
  return [
    {
      type: "button",
      key: "edit",
      title: "Rename tag",
      icon: Edit.path,
      onClick: () => {
        hashNavigate(`/tags/${tag.id}/edit`);
      }
    },
    {
      type: "button",
      key: "shortcut",
      title: db.shortcuts.exists(tag.id)
        ? "Remove shortcut"
        : "Create shortcut",
      icon: Shortcut.path,
      onClick: () => appStore.addToShortcuts(tag)
    },
    { key: "sep", type: "separator" },
    {
      type: "button",
      key: "delete",
      variant: "dangerous",
      title: "Delete",
      icon: DeleteForver.path,
      onClick: async () => {
        await db.tags.remove(...ids);
        showToast("success", `${pluralize(ids.length, "tag")} deleted`);
        await editorStore.refreshTags();
        await tagStore.refresh();
        await noteStore.refresh();
      },
      multiSelect: true
    }
  ];
};
