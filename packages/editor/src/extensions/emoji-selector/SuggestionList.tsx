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

// example for mention: https://tiptap.dev/api/nodes/mention
// https://tiptap.dev/api/utilities/suggestion

import { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { SuggestionItem } from "./SuggestionItem";

interface SuggestionListActions {
  onKeyDown: (props: SuggestionKeyDownProps) => void;
}

export const SuggestionList = forwardRef<
  SuggestionListActions,
  SuggestionProps
>((props, ref) => {
  const { clientRect, command, items } = props;

  const referenceEl = useMemo(
    () => (clientRect ? { getBoundingClientRect: clientRect } : null),
    [clientRect]
  );

  const handleCommand = (index: number) => {
    const selectedEmoji = items[index];
    command({
      id: selectedEmoji.id,
      label: selectedEmoji.label,
      emoji: selectedEmoji.emoji
    });
  };

  const [hoverIndex, setHoverIndex] = useState(0);
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      const { key } = event;

      if (key === "ArrowUp") {
        setHoverIndex((prev) => {
          const beforeIndex = prev - 1;
          return beforeIndex >= 0 ? beforeIndex : 0;
        });
        return true;
      }

      if (key === "ArrowDown") {
        setHoverIndex((prev) => {
          const afterIndex = prev + 1;
          const emojiCount = items.length - 1 ?? 0;
          return afterIndex < emojiCount ? afterIndex : emojiCount;
        });
        return true;
      }

      if (key === "Enter") {
        handleCommand(hoverIndex);
        return true;
      }

      return false;
    }
  }));

  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(referenceEl as Element, el, {
    placement: "bottom-start"
  });

  return createPortal(
    <div
      ref={setEl}
      className="SuggestionListContainer"
      style={styles.popper}
      {...attributes.popper}
    >
      {items.map((emoji, index) => (
        <SuggestionItem
          key={emoji.id}
          isActive={index === hoverIndex}
          onMouseEnter={() => setHoverIndex(index)}
          onClick={() => handleCommand(index)}
        >
          {emoji.label}
        </SuggestionItem>
      ))}
    </div>,
    document.body
  );
});
SuggestionList.displayName = "SuggestionList";
