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

import { useCallback, useEffect, useRef, useState } from "react";
import type { Tag } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Flex, Input, type MenuItem, type UIElement } from "@ui";
import { useEditorStore } from "../../stores/editor-store";
import { useStore as useTagStore } from "../../stores/tag-store";
import { useStore as useNoteStore } from "../../stores/note-store";
import { useStore as useAppStore } from "../../stores/app-store";
import { Tag as TagIcon, Plus } from "../icons";
import IconTag from "../icon-tag";
import { db } from "../../common/db";
import { checkFeature } from "../../common";
import { useMenuTrigger } from "../../hooks/use-menu";
import { navigate } from "../../navigation";

type HeaderProps = { readonly: boolean; id: string };

async function toggleTag(noteId: string, tags: Tag[], value: string) {
  const oldTag = tags.find((t) => t.title === value);
  if (oldTag) {
    await db.relations.unlink(oldTag, { type: "note", id: noteId });
  } else {
    let id = (await db.tags.find(value))?.id;
    if (!id) {
      if (!(await checkFeature("tags"))) return;
      id = await db.tags.add({ title: value });
    }
    if (!id) return;
    await db.relations.add({ id, type: "tag" }, { type: "note", id: noteId });
    await useTagStore.getState().refresh();
  }
  await useNoteStore.getState().refresh();
}

function Header(props: HeaderProps) {
  const { readonly, id } = props;
  const activeSession = useEditorStore((store) =>
    store.getActiveSession(["default", "readonly"])
  );
  const tags = activeSession?.tags || [];
  const noteId = activeSession?.note.id;

  return (
    <Flex
      testID="tags"
      sx={{
        alignItems: "center",
        flexWrap: "wrap",
        gap: "spacing2",
        py: "spacing2",
        opacity: !noteId ? 0.5 : 1
      }}
    >
      {tags.map((tag) => (
        <IconTag
          testId="tag"
          key={tag.id}
          text={tag.title}
          icon={TagIcon}
          onClick={() => {
            useAppStore.getState().setNavigationTab("tags");
            navigate(`/tags/${tag.id}`);
          }}
          onDismiss={
            readonly || !noteId
              ? undefined
              : () => toggleTag(noteId, tags, tag.title)
          }
        />
      ))}
      {!readonly && activeSession ? (
        <Autosuggest
          sessionId={id}
          disabled={!noteId}
          filter={(query) => db.lookup.tags(query).items(10)}
          toMenuItems={(filtered, reset, query) => {
            const items: MenuItem[] = [];
            if (!noteId) return items;
            const isExactMatch =
              !!query && filtered.some((item) => item.title === query);
            if (query && !isExactMatch) {
              items.push({
                type: "button",
                key: "new",
                title: strings.createTagTitle(query),
                iconComponent: Plus,
                onClick: () => toggleTag(noteId, tags, query).finally(reset)
              });
            }
            items.push(
              ...filtered.map((item) => ({
                type: "button" as const,
                key: item.id,
                title: item.title,
                iconComponent: TagIcon,
                onClick: () =>
                  toggleTag(noteId, tags, item.title).finally(reset)
              }))
            );
            return items;
          }}
          onAdd={(value) => {
            if (noteId) toggleTag(noteId, tags, value);
          }}
          onRemove={() => {
            if (noteId && tags.length > 0)
              toggleTag(noteId, tags, tags[tags.length - 1].title);
          }}
          defaultItems={() =>
            db.tags.all.limit(10).items(undefined, {
              sortBy: "title",
              sortDirection: "desc"
            })
          }
        />
      ) : null}
    </Flex>
  );
}
export default Header;

type AutosuggestProps<T> = {
  sessionId: string;
  filter: (query: string) => Promise<T[]>;
  onRemove: () => void;
  onAdd: (text: string) => void;
  toMenuItems: (filtered: T[], reset: () => void, query?: string) => MenuItem[];
  defaultItems: () => Promise<T[]>;
  disabled?: boolean;
};

export function Autosuggest<T>(props: AutosuggestProps<T>) {
  const { sessionId, filter, onRemove, onAdd, defaultItems, toMenuItems } =
    props;
  const inputRef = useRef<UIElement>(null);
  const [value, setValue] = useState("");
  const [generation, setGeneration] = useState(0);
  const { openMenu, closeMenu } = useMenuTrigger();

  const skipOpen = useRef(false);
  const latestText = useRef("");
  const reset = useCallback(() => {
    setValue("");
    setGeneration((current) => current + 1);
    latestText.current = "";
    closeMenu();
    skipOpen.current = true;
    setTimeout(() => {
      skipOpen.current = false;
    }, 200);
  }, [closeMenu]);

  const onOpenMenu = useCallback(
    (filtered: T[], text: string) => {
      if (!text && filtered.length <= 0) return closeMenu();
      inputRef.current?.measureInWindow((x, y, width, height) =>
        openMenu(toMenuItems(filtered, reset, text), {
          position: { x, y, width, height }
        })
      );
    },
    [closeMenu, openMenu, reset, toMenuItems]
  );

  useEffect(() => {
    closeMenu();
  }, [sessionId, closeMenu]);

  return (
    <Input
      key={generation}
      ref={inputRef}
      testID="editor-tag-input"
      autoFocus={generation > 0}
      disabled={props.disabled}
      value={value}
      placeholder={strings.addATag()}
      sx={{
        width: 120,
        borderWidth: 0,
        bg: "transparent",
        p: 0,
        fontSize: "body",
        alignSelf: "flex-start"
      }}
      onFocus={async () => {
        if (skipOpen.current) return;
        if (!value.trim()) onOpenMenu(await defaultItems(), "");
      }}
      onPress={async () => {
        if (!value.trim()) onOpenMenu(await defaultItems(), "");
      }}
      onChangeText={async (text) => {
        setValue(text);
        const trimmed = text.trim();
        latestText.current = trimmed;
        if (!trimmed) return closeMenu();
        const filtered = await filter(trimmed);
        if (latestText.current === trimmed) onOpenMenu(filtered, trimmed);
      }}
      onSubmit={(text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        onAdd(trimmed);
        reset();
      }}
      onKeyDown={(event) => {
        if (event.key === "Backspace" && !value) {
          onRemove();
          closeMenu();
        } else if (event.key === "Escape") closeMenu();
      }}
    />
  );
}
