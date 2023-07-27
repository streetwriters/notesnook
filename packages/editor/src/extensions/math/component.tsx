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

import { Text } from "@theme-ui/components";
import { useRef, useEffect } from "react";
import { SelectionBasedReactNodeViewProps } from "../react";
import { loadKatex } from "./plugin/renderers/katex";
import { MathInline } from "./math-inline";

const HIDDEN_STYLES = {
  visibility: "hidden" as const,
  width: 0,
  height: 0,
  display: "inline-block" as const,
  position: "absolute" as const
};

const VISIBLE_STYLES = {
  visibility: "visible" as const
};

export function InlineMathComponent(props: SelectionBasedReactNodeViewProps) {
  const { editor, getPos, forwardRef } = props;
  const elementRef = useRef<HTMLDivElement>(null);
  const isActive = editor.isActive(MathInline.name);

  useEffect(() => {
    if (isActive) return;
    (async function () {
      const pos = getPos();
      const node = editor.current?.state.doc.nodeAt(pos);
      const text = node?.textContent;

      if (text && elementRef.current) {
        const katex = await loadKatex();

        elementRef.current.innerHTML = katex.renderToString(text, {
          displayMode: false,
          globalGroup: true,
          throwOnError: false
        });
      }
    })();
  }, [isActive]);

  return (
    <>
      <Text
        as="code"
        sx={{
          ...(isActive
            ? {
                ...VISIBLE_STYLES,
                ":before, :after": { content: `"$$"`, color: "fontTertiary" }
              }
            : HIDDEN_STYLES)
        }}
      >
        <Text as="span" ref={forwardRef} />
      </Text>
      <Text
        as="span"
        contentEditable={false}
        ref={elementRef}
        sx={{
          ...(!isActive ? VISIBLE_STYLES : HIDDEN_STYLES),
          ".katex": { fontSize: "1em" }
        }}
      />
    </>
  );
}
