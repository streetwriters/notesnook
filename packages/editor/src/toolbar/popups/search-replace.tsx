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

import { Input } from "@theme-ui/components";
import { useCallback, useEffect, useRef } from "react";
import { Flex, Text } from "@theme-ui/components";
import { SearchStorage } from "../../extensions/search-replace/index.js";
import { ToolButton } from "../components/tool-button.js";
import { Editor } from "../../types.js";
import { useEditorSearchStore } from "../stores/search-store.js";
import { strings } from "@notesnook/intl";

export type SearchReplacePopupProps = { editor: Editor };
export function SearchReplacePopup(props: SearchReplacePopupProps) {
  const { editor } = props;
  const {
    enableRegex,
    focusNonce,
    isExpanded,
    isReplacing,
    matchCase,
    matchWholeWord,
    searchTerm,
    replaceTerm
  } = useEditorSearchStore();
  const { results, selectedIndex } = editor.storage
    .searchreplace as SearchStorage;
  const searchInputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(
    (term: string) => {
      editor.commands.search(term, useEditorSearchStore.getState());
    },
    [editor.commands]
  );

  useEffect(() => {
    setTimeout(() => searchInputRef.current?.focus(), 0);
  }, [focusNonce]);

  return (
    <Flex
      sx={{
        p: 1,
        bg: "background",
        flexDirection: "column",
        boxShadow: ["none", "menu"],
        borderRadius: [0, "default"]
      }}
    >
      <Flex>
        <Flex
          sx={{ flexDirection: "column", flex: 1, width: ["auto", 300], mr: 1 }}
        >
          <Flex
            sx={{
              flex: 1,
              position: "relative",
              alignItems: "center",
              outline: "1px solid var(--border)",
              borderRadius: "default",
              p: 1,
              py: 0,
              ":focus-within": {
                outlineColor: "accent",
                outlineWidth: "1.8px"
              },
              ":hover": {
                outlineColor: "accent"
              }
            }}
          >
            <Input
              variant={"clean"}
              ref={searchInputRef}
              autoFocus
              placeholder={strings.search()}
              sx={{ p: 0, fontFamily: "monospace" }}
              value={searchTerm}
              onChange={(e) => {
                search(e.target.value);
                useEditorSearchStore.setState({ searchTerm: e.target.value });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (e.shiftKey) editor.commands.moveToPreviousResult();
                  else editor.commands.moveToNextResult();
                }
              }}
            />
            <Flex
              sx={{
                flexShrink: 0,
                mr: 0,
                alignItems: "center"
              }}
            >
              <ToolButton
                sx={{
                  mr: 0
                }}
                toggled={isExpanded}
                title={strings.expand()}
                id="expand"
                icon={isExpanded ? "chevronRight" : "chevronLeft"}
                onClick={() =>
                  useEditorSearchStore.setState({ isExpanded: !isExpanded })
                }
                iconSize={"medium"}
              />
              {isExpanded && (
                <>
                  <ToolButton
                    sx={{
                      mr: 0
                    }}
                    toggled={matchCase}
                    title={strings.matchCase()}
                    id="matchCase"
                    icon="caseSensitive"
                    onClick={() => {
                      useEditorSearchStore.setState({ matchCase: !matchCase });
                      search(useEditorSearchStore.getState().searchTerm);
                    }}
                    iconSize={"medium"}
                  />
                  <ToolButton
                    sx={{
                      mr: 0
                    }}
                    toggled={matchWholeWord}
                    title={strings.matchWholeWord()}
                    id="matchWholeWord"
                    icon="wholeWord"
                    onClick={() => {
                      useEditorSearchStore.setState({
                        matchWholeWord: !matchWholeWord
                      });
                      search(useEditorSearchStore.getState().searchTerm);
                    }}
                    iconSize={"medium"}
                  />
                  <ToolButton
                    sx={{
                      mr: 0
                    }}
                    toggled={enableRegex}
                    title={strings.enableRegex()}
                    id="enableRegex"
                    icon="regex"
                    onClick={() => {
                      useEditorSearchStore.setState({
                        enableRegex: !enableRegex
                      });
                      search(useEditorSearchStore.getState().searchTerm);
                    }}
                    iconSize={"medium"}
                  />
                </>
              )}
              <Text
                variant={"subBody"}
                sx={{
                  flexShrink: 0,
                  borderLeft: "1px solid var(--border)",
                  color: "paragraph",
                  px: 1
                }}
              >
                {results?.length
                  ? `${selectedIndex + 1}/${results.length}`
                  : "0/0"}
              </Text>
            </Flex>
          </Flex>
          {isReplacing && (
            <Input
              sx={{ mt: 1, p: "7px", fontFamily: "monospace" }}
              placeholder={strings.replace()}
              value={replaceTerm}
              onChange={(e) =>
                useEditorSearchStore.setState({ replaceTerm: e.target.value })
              }
            />
          )}
        </Flex>
        <Flex sx={{ flexDirection: "column" }}>
          <Flex sx={{ alignItems: "center", height: "33.2px" }}>
            {editor.isEditable && (
              <ToolButton
                toggled={isReplacing}
                title={strings.toggleReplace()}
                id="toggleReplace"
                icon="replace"
                onClick={() =>
                  useEditorSearchStore.setState({
                    isReplacing: !isReplacing
                  })
                }
                sx={{ mr: 0 }}
                iconSize={"big"}
              />
            )}
            <ToolButton
              toggled={false}
              title={strings.previousMatch()}
              id="previousMatch"
              icon="previousMatch"
              onClick={() => editor.commands.moveToPreviousResult()}
              sx={{ mr: 0 }}
              iconSize={"big"}
            />
            <ToolButton
              toggled={false}
              title={strings.nextMatch()}
              id="nextMatch"
              icon="nextMatch"
              onClick={() => editor.commands.moveToNextResult()}
              sx={{ mr: 0 }}
              iconSize={"big"}
            />
            <ToolButton
              toggled={false}
              title={strings.close()}
              id="close"
              icon="close"
              onClick={() => editor.chain().focus().endSearch().run()}
              sx={{ mr: 0 }}
              iconSize={"big"}
            />
          </Flex>
          {isReplacing && (
            <Flex sx={{ alignItems: "center", height: "33.2px", mt: 1 }}>
              <ToolButton
                toggled={false}
                title={strings.replace()}
                id="replace"
                icon="replaceOne"
                onClick={() =>
                  editor.commands.replace(
                    useEditorSearchStore.getState().replaceTerm
                  )
                }
                sx={{ mr: 0 }}
                iconSize={18}
              />
              <ToolButton
                toggled={false}
                title={strings.replaceAll()}
                id="replaceAll"
                icon="replaceAll"
                onClick={() =>
                  editor.commands.replaceAll(
                    useEditorSearchStore.getState().replaceTerm
                  )
                }
                sx={{ mr: 0 }}
                iconSize={18}
              />
            </Flex>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}
