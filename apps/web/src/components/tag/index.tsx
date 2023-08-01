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
import { Item } from "../list-container/types";
import { MenuItem } from "@notesnook/ui";

type TagProps = { item: Item };
function Tag(props: TagProps) {
  const { item } = props;
  const { id, noteIds, alias } = item;

  return (
    <ListItem
      item={item}
      isCompact
      title={
        <Text as="span">
          <Text as="span" sx={{ color: "accent" }}>
            {"#"}
          </Text>
          {alias}
        </Text>
      }
      footer={
        <Text mt={1} variant="subBody">
          {(noteIds as string[]).length}
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

const menuItems: (tag: any, items?: any[]) => MenuItem[] = (
  tag,
  items = []
) => {
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
      title: db.shortcuts?.exists(tag.id)
        ? "Remove shortcut"
        : "Create shortcut",
      icon: Shortcut.path,
      onClick: () => appStore.addToShortcuts(tag)
    },
    { key: "sep", type: "separator" },
    {
      type: "button",
      key: "delete",
      styles: { icon: { color: "red" }, text: { color: "red" } },
      title: "Delete",
      icon: DeleteForver.path,
      onClick: async () => {
        for (const tag of items) {
          if (tag.noteIds.includes(editorStore.get().session.id))
            await editorStore.clearSession();
          await db.tags?.remove(tag.id);
        }
        showToast("success", `${pluralize(items.length, "tag")} deleted`);
        tagStore.refresh();
        noteStore.refresh();
      },
      multiSelect: true
    }
  ];
};
