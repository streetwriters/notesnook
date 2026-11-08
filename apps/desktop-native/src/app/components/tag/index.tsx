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

import { areFeaturesAvailable } from "@notesnook/common";
import { createInternalLink, type Tag as TagType } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Flex, Text, type MenuItem } from "@ui";
import ListItem from "../list-item";
import { navigate } from "../../navigation";
import { store as appStore } from "../../stores/app-store";
import { store as settingStore } from "../../stores/setting-store";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { useStore as useNoteStore } from "../../stores/note-store";
import { db } from "../../common/db";
import { Multiselect } from "../../common/multi-select";
import {
  createSetDefaultHomepageMenuItem,
  withFeatureCheck
} from "../../common";
import { EditTagDialog } from "../../dialogs/item-dialog";
import { showToast } from "../../utils/toast";
import { handleDrop } from "../../common/drop-handler";
import { writeToClipboard } from "../../utils/clipboard";
import {
  ArrowCounterClockwise,
  Copy,
  LinkBreak,
  LinkHorizontal,
  LinkSimple,
  PencilSimple,
  Tag as TagIcon,
  Trash
} from "../icons";

type TagProps = { item: TagType; totalNotes: number; index?: number };
function Tag(props: TagProps) {
  const { item, totalNotes } = props;
  const { id } = item;
  const currentContext = useNoteStore((store) =>
    store.context?.type === "tag" && store.context.id === id
      ? store.contextNotes
      : null
  );
  const isSelected = !!currentContext;

  return (
    <ListItem
      item={item}
      index={props.index}
      isCompact
      isFocused={isSelected}
      sx={{
        borderRadius: "radius1",
        px: "spacing2",
        mx: "spacing4",
        py: "spacing4",
        pr: "spacing2"
      }}
      title={
        <Flex
          sx={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: "spacing3",
            minWidth: 0,
            overflow: "hidden"
          }}
        >
          <TagIcon
            size={13}
            color={isSelected ? "icon-selected" : "icon"}
            sx={{ flexShrink: 0 }}
          />
          <Text
            testID="title"
            variant="body"
            numberOfLines={1}
            sx={{
              color: isSelected ? "paragraph-selected" : "paragraph",
              fontSize: "xs",
              fontWeight: "normal",
              minWidth: 0
            }}
          >
            {item.title}
          </Text>
        </Flex>
      }
      footer={
        <Text
          variant="subBody"
          sx={{
            fontSize: "3xs",
            color: isSelected ? "paragraph" : "paragraph-secondary"
          }}
        >
          {currentContext?.length || totalNotes}
        </Text>
      }
      onKeyPress={async (e) => {
        if (e.key === "Delete") {
          await Multiselect.deleteTags(
            useSelectionStore.getState().selectedItems
          );
        } else if (e.key === "Enter") {
          navigate(`/tags/${id}`);
        }
      }}
      menuItems={tagMenuItems}
      onDrop={(event) => handleDrop(event.payload, item)}
      onPress={() => {
        navigate(`/tags/${id}`);
      }}
    />
  );
}
export default Tag;

export const tagMenuItems: (
  tag: TagType,
  ids?: string[]
) => Promise<MenuItem[]> = async (tag, ids = []) => {
  const defaultTag = db.settings.getDefaultTag();
  const features = await areFeaturesAvailable([
    "shortcuts",
    "defaultNotebookAndTag",
    "customHomepage"
  ]);
  return [
    {
      type: "button",
      key: "edit",
      title: strings.renameTag(),
      iconComponent: PencilSimple,
      onClick: () => EditTagDialog.show(tag)
    },
    {
      type: "button",
      key: "set-as-default",
      title: strings.setAsDefault(),
      isChecked: defaultTag === tag.id,
      iconComponent: ArrowCounterClockwise,
      premium: !features.defaultNotebookAndTag.isAllowed,
      onClick: withFeatureCheck(features.defaultNotebookAndTag, async () => {
        const defaultTag = db.settings.getDefaultTag();
        const isDefault = defaultTag === tag.id;
        await db.settings.setDefaultTag(isDefault ? undefined : tag.id);
      })
    },
    createSetDefaultHomepageMenuItem(tag.id, tag.type, features.customHomepage),
    {
      type: "button",
      key: "shortcut",
      title: db.shortcuts.exists(tag.id)
        ? strings.removeShortcut()
        : strings.addShortcut(),
      iconComponent: db.shortcuts.exists(tag.id) ? LinkBreak : LinkSimple,
      premium: !features.shortcuts.isAllowed,
      onClick: withFeatureCheck(features.shortcuts, () =>
        appStore.addToShortcuts(tag)
      )
    },
    {
      type: "button",
      key: "copy-link",
      title: strings.copyLink(),
      iconComponent: LinkHorizontal,
      onClick: () => {
        const link = createInternalLink("tag", tag.id);
        writeToClipboard({
          "text/plain": link,
          "text/html": `<a href="${link}">${tag.title}</a>`,
          "text/markdown": `[${tag.title}](${link})`
        });
      }
    },
    { key: "sep", type: "separator" },
    {
      type: "button",
      key: "delete",
      variant: "dangerous",
      title: strings.delete(),
      iconComponent: Trash,
      onClick: async () => {
        await Multiselect.deleteTags(ids);
      },
      multiSelect: true
    },
    {
      type: "button",
      key: "copyid",
      title: strings.copyId(),
      iconComponent: Copy,
      onClick: async () => {
        try {
          await writeToClipboard({
            "text/plain": tag.id
          });
          showToast("success", strings.tagIdCopied());
        } catch (e) {
          console.error(e);
          showToast("error", strings.failedToCopyToClipboard());
        }
      },
      isHidden: !settingStore.get().isInboxEnabled
    }
  ];
};
