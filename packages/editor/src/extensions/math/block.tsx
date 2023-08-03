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

import { Box, Flex, Text } from "@theme-ui/components";
import { useEffect, useRef } from "react";
import { Button } from "../../components/button";
import { useTimer } from "../../hooks/use-timer";
import { SelectionBasedReactNodeViewProps } from "../react/types";
import { MathBlock, MathBlockAttributes } from "./math-block";
import { loadKatex } from "./plugin/renderers/katex";

export function MathBlockComponent(
  props: SelectionBasedReactNodeViewProps<MathBlockAttributes>
) {
  const { editor, node, forwardRef, getPos } = props;
  const { indentLength, indentType, caretPosition } = node.attrs;
  const toolbarRef = useRef<HTMLDivElement>(null);
  const { enabled, start } = useTimer(1000);
  const isActive = editor.isActive(MathBlock.name);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive) return;
    (async function () {
      const pos = getPos();
      const node = editor.current?.state.doc.nodeAt(pos);
      const text = node?.textContent;

      if (text && elementRef.current) {
        const katex = await loadKatex();

        elementRef.current.innerHTML = katex.renderToString(text, {
          displayMode: true,
          globalGroup: true,
          throwOnError: false
        });
      }
    })();
  }, [isActive]);

  return (
    <>
      <Flex
        sx={{
          flexDirection: "column",
          borderRadius: "default",
          overflow: "hidden",
          ...(isActive ? {} : { height: "1px", width: 0, visibility: "hidden" })
        }}
      >
        <Text
          ref={forwardRef}
          as="pre"
          autoCorrect="off"
          autoCapitalize="none"
          css={{}}
          sx={{
            "div, span.token, span.line-number-widget, span.line-number::before":
              {
                fontFamily: "monospace",
                fontSize: "code",
                whiteSpace: "pre", // TODO !important
                tabSize: 1
              },
            position: "relative",
            lineHeight: "20px",
            bg: "codeBg",
            color: "static",
            overflowX: "auto",
            display: "flex",
            px: 2,
            pt: 2,
            pb: 2
          }}
          spellCheck={false}
        />
        <Flex
          ref={toolbarRef}
          contentEditable={false}
          sx={{
            bg: "codeBg",
            alignItems: "center",
            justifyContent: "flex-end",
            borderTop: "1px solid var(--codeBorder)"
          }}
        >
          {caretPosition ? (
            <Text variant={"subBody"} sx={{ mr: 1, color: "codeFg" }}>
              Line {caretPosition.line}, Column {caretPosition.column}{" "}
              {caretPosition.selected
                ? `(${caretPosition.selected} selected)`
                : ""}
            </Text>
          ) : null}

          <Button
            variant={"icon"}
            sx={{
              p: 1,
              opacity: "1 !important",
              ":hover": { bg: "codeSelection" }
            }}
            title="Toggle indentation mode"
            disabled={!editor.isEditable}
            onClick={() => {
              if (!editor.isEditable) return;
              editor.commands.changeCodeBlockIndentation({
                type: indentType === "space" ? "tab" : "space",
                amount: indentLength
              });
            }}
          >
            <Text variant={"subBody"} sx={{ color: "codeFg" }}>
              {indentType === "space" ? "Spaces" : "Tabs"}: {indentLength}
            </Text>
          </Button>

          <Button
            variant={"icon"}
            sx={{
              opacity: "1 !important",
              p: 1,
              bg: "transparent",
              ":hover": { bg: "codeSelection" }
            }}
            disabled={true}
          >
            <Text
              variant={"subBody"}
              spellCheck={false}
              sx={{ color: "codeFg" }}
            >
              Latex
            </Text>
          </Button>

          {node.textContent?.length > 0 ? (
            <Button
              variant={"icon"}
              sx={{
                opacity: "1 !important",
                p: 1,
                mr: 1,
                bg: "transparent",
                ":hover": { bg: "codeSelection" }
              }}
              onClick={() => {
                editor.commands.copyToClipboard(node.textContent);
                start();
              }}
              title="Copy to clipboard"
            >
              <Text
                variant={"subBody"}
                spellCheck={false}
                sx={{ color: "codeFg" }}
              >
                {enabled ? "Copied" : "Copy"}
              </Text>
            </Button>
          ) : null}
        </Flex>
      </Flex>
      <Box contentEditable={false} ref={elementRef} />
    </>
  );
}
