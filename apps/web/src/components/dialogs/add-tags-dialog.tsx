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

import { Flex } from "@theme-ui/components";
import { useEffect, useMemo, useState } from "react";
import { db } from "../../common/db";
import { Perform } from "../../common/dialog-controller";
import { Autosuggest } from "../editor/header";
import IconTag from "../icon-tag";
import Tag from "../tag";
import Dialog from "./dialog";
import * as Icon from "../icons";
import { useStore } from "../../stores/tag-store";

export type Note = {
  color: string;
  conflicted: boolean;
  contentId: string;
  dateCreated: number;
  dateEdited: number;
  dateModified: number;
  favorite: boolean;
  headline: string;
  id: string;
  localOnly: boolean;
  locked: boolean;
  notebooks: [];
  pinned: boolean;
  readonly: boolean;
  synced: boolean;
  tags: Array<string>;
  title: string;
  type: string;
};

export type Tag = {
  alias: string;
  dateModified: number;
  id: string;
  localOnly: boolean;
  noteIds: Array<string>;
  synced: boolean;
  title: string;
  type: string;
};

export type AddTagsDialogProps<TCheckId extends string> = {
  title: string;
  subtitle?: string;
  onClose: Perform<false | Record<TCheckId, boolean>>;
  width?: number;
  positiveButtonText?: string;
  negativeButtonText?: string;
  items: Array<Note>;
};

function AddTagsDialog<TCheckId extends string>(
  props: AddTagsDialogProps<TCheckId>
) {
  const {
    onClose,
    title,
    subtitle,
    width,
    negativeButtonText,
    positiveButtonText,
    items
  } = props;

  const refreshTags = useStore((store) => store.refresh);
  const allTags = useStore((store) => store.tags);

  useEffect(() => {
    refreshTags();
  }, [refreshTags]);

  useEffect(() => {
    console.log("allTags", allTags);
    setTags(getTags(allTags, items));
  }, [allTags, items]);

  const [tags, setTags] = useState(getTags(allTags, items));
  const filterableTags = useMemo(() => {
    return db.tags?.all.filter((t) => tags.every((tag) => tag !== t?.title));
  }, [tags]);

  const addTag = async (tag: string) => {
    let tagged = false;
    for (const _tag of tags) {
      if (_tag === tag) tagged = true;
    }

    items.forEach(async (item) => {
      if (tagged) await db.notes?.note(item.id).untag(tag);
      else await db.notes?.note(item.id).tag(tag);
    });
    refreshTags();
  };

  return (
    <Dialog
      isOpen={true}
      title={title}
      width={width}
      description={subtitle}
      onClose={() => onClose(false)}
      positiveButton={
        positiveButtonText
          ? {
              text: positiveButtonText,
              onClick: () => onClose(false),
              autoFocus: !!positiveButtonText
            }
          : undefined
      }
      negativeButton={
        negativeButtonText
          ? {
              text: negativeButtonText,
              onClick: () => onClose(false)
            }
          : undefined
      }
    >
      <Flex
        sx={{ lineHeight: 2.5, alignItems: "center", flexWrap: "wrap" }}
        data-test-id="tags"
      >
        {tags?.map((tag) => (
          <IconTag
            testId={`tag`}
            key={tag}
            text={db.tags?.alias(tag)}
            icon={Icon.Tag}
            title={`Click to remove`}
            onClick={() => {
              addTag(tag);
            }}
            styles={{ container: { mr: 1 }, text: { fontSize: "body" } }}
          />
        ))}
        <Autosuggest
          sessionId={""}
          filter={(query: string) =>
            db.lookup?.tags(filterableTags, query).slice(0, 10)
          }
          onAdd={async (value: string) => {
            addTag(value);
          }}
          onSelect={async (item: Tag) => {
            addTag(item.title);
          }}
          onRemove={() => {
            if (tags.length <= 0) return;
            addTag(tags[tags.length - 1]);
          }}
          defaultItems={filterableTags?.slice(0, 10)}
        />
      </Flex>
    </Dialog>
  );
}

export default AddTagsDialog;

function getTags(allTags: Array<Tag>, items: Array<Note>): Array<string> {
  const tags: Array<Array<string>> = [];
  allTags.shift();
  for (const item of items) {
    const noteTags: Array<string> = [];
    for (const tag of allTags) {
      for (const noteId of tag.noteIds) {
        if (item.id === noteId) {
          noteTags.push(tag.title);
        }
      }
    }
    tags.push(noteTags);
  }
  const result = tags.shift()?.filter(function (_tag: string) {
    return tags.every(function (_tags: Array<string>) {
      return _tags.indexOf(_tag) !== -1;
    });
  });
  console.log("result", result);
  if (result) return result;
  else return [];
}
