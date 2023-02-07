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
import * as Icon from "../icons";
import { showToast } from "../../utils/toast";
import { pluralize } from "../../utils/string";

const menuItems = [
  {
    key: "edit",
    title: "Rename tag",
    icon: Icon.Edit,
    onClick: ({ tag }) => {
      hashNavigate(`/tags/${tag.id}/edit`);
    }
  },
  {
    key: "shortcut",
    title: ({ tag }) =>
      db.shortcuts.exists(tag.id) ? "Remove shortcut" : "Create shortcut",
    icon: Icon.Shortcut,
    onClick: ({ tag }) => appStore.addToShortcuts(tag)
  },
  {
    key: "delete",
    color: "error",
    iconColor: "error",
    title: "Delete",
    icon: Icon.DeleteForver,
    onClick: async ({ items }) => {
      for (let tag of items) {
        if (tag.noteIds.includes(editorStore.get().session.id))
          await editorStore.clearSession();
        await db.tags.remove(tag.id);
      }
      showToast("success", `${pluralize(items.length, "tag", "tags")} deleted`);
      tagStore.refresh();
      noteStore.refresh();
    },
    multiSelect: true
  }
];

function Tag({ item, index }) {
  const { id, noteIds, alias } = item;
  return (
    <ListItem
      item={item}
      selectable={false}
      index={index}
      title={<TagNode title={alias} />}
      footer={
        <Text mt={1} variant="subBody">
          {noteIds.length} notes
        </Text>
      }
      menu={{ items: menuItems, extraData: { tag: item } }}
      onClick={() => {
        navigate(`/tags/${id}`);
      }}
      divider
    />
  );
}
export default Tag;

function TagNode({ title }) {
  return (
    <Text as="span" variant="title">
      <Text as="span" sx={{ color: "primary" }}>
        {"#"}
      </Text>
      {title}
    </Text>
  );
}
