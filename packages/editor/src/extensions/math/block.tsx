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
import { useThemeEngineStore } from "@notesnook/theme";
import SimpleBar from "simplebar-react";
import { strings } from "@notesnook/intl";

export function MathBlockComponent(
  props: SelectionBasedReactNodeViewProps<MathBlockAttributes>
) {
  const { editor, node, forwardRef, getPos } = props;
  const { indentLength, indentType, caretPosition } = node.attrs;

  const isActive = editor.isActive(MathBlock.name);
  const elementRef = useRef<HTMLElement>();
  const codeElementRef = useRef<HTMLElement>();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const theme = useThemeEngineStore((store) => store.theme);
  const { enabled, start } = useTimer(1000);

  console.log("Rerendering MathBlockComponent", isActive);
  useEffect(() => {
    if (isActive) return;
    (async function () {
      const pos = getPos();
      const node = editor.state.doc.nodeAt(pos);
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
        <SimpleBar
          style={{
            backgroundColor: "var(--background-secondary)"
          }}
        >
          <div>
            <Text
              ref={(ref) => {
                codeElementRef.current = ref ?? undefined;
                forwardRef?.(ref);
              }}
              autoCorrect="off"
              autoCapitalize="none"
              css={theme.codeBlockCSS}
              sx={{
                pre: {
                  fontFamily: "inherit !important",
                  tabSize: "inherit !important",
                  // background: "transparent !important",
                  padding: "10px !important",
                  margin: "0px !important",
                  width: "100%",
                  borderRadius: `0px !important`,

                  "::selection,*::selection": {
                    bg: "background-selected",
                    color: "inherit"
                  },
                  "::-moz-selection,*::-moz-selection": {
                    bg: "background-selected",
                    color: "inherit"
                  }
                },
                fontFamily: "monospace",
                whiteSpace: "pre", // TODO !important
                tabSize: 1,
                position: "relative",
                lineHeight: "20px",
                // bg: "var(--background-secondary)",
                // color: "white",
                // overflowX: "hidden",
                display: "flex"
              }}
              spellCheck={false}
            />
          </div>
        </SimpleBar>
        <Flex
          ref={toolbarRef}
          contentEditable={false}
          sx={{
            bg: "var(--background-secondary)",
            alignItems: "center",
            justifyContent: "flex-end",
            borderTop: "1px solid var(--border-secondary)"
          }}
        >
          {caretPosition ? (
            <Text variant={"subBody"} sx={{ mr: 1, mt: "2px" }}>
              {strings.lineColumn(caretPosition.line, caretPosition.column)}{" "}
              {caretPosition.selected
                ? `(${strings.selectedCode(caretPosition.selected)})`
                : ""}
            </Text>
          ) : null}

          <Button
            variant={"icon"}
            sx={{
              p: 1,
              opacity: "1 !important"
            }}
            title={strings.toggleIndentationMode()}
            disabled={!editor.isEditable}
            onClick={() => {
              if (!editor.isEditable) return;
              editor.commands.changeCodeBlockIndentation({
                type: indentType === "space" ? "tab" : "space",
                amount: indentLength
              });
            }}
          >
            <Text variant={"subBody"}>
              {indentType === "space" ? strings.spaces() : strings.tabs()}:{" "}
              {indentLength}
            </Text>
          </Button>

          <Button
            variant={"icon"}
            sx={{
              opacity: "1 !important",
              p: 1,
              mr: 1,
              bg: "transparent"
            }}
            disabled
            title={strings.changeLanguage()}
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
                bg: "transparent"
              }}
              onClick={() => {
                editor.storage.copyToClipboard?.(
                  node.textContent,
                  codeElementRef?.current?.innerHTML
                );
                start();
              }}
              title={strings.copyToClipboard()}
            >
              <Text
                variant={"subBody"}
                spellCheck={false}
                sx={{ color: "codeFg" }}
              >
                {enabled ? strings.copied() : strings.copy()}
              </Text>
            </Button>
          ) : null}
        </Flex>
      </Flex>
      <Box contentEditable={false} ref={elementRef} />
    </>
  );
}
