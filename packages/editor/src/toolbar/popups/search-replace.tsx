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
import { useCallback, useEffect, useRef, useState } from "react";
import { Flex, Text } from "@theme-ui/components";
import { SearchStorage } from "../../extensions/search-replace";
import { ToolButton } from "../components/tool-button";
import { Editor } from "../../types";

export type SearchReplacePopupProps = { editor: Editor };
export function SearchReplacePopup(props: SearchReplacePopupProps) {
  const { editor } = props;
  const { selectedText, results, selectedIndex } = editor.storage
    .searchreplace as SearchStorage;

  const [isReplacing, setIsReplacing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [enableRegex, setEnableRegex] = useState(false);
  const replaceText = useRef("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(
    (term: string) => {
      editor.current?.commands.search(term, {
        matchCase,
        enableRegex,
        matchWholeWord
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matchCase, enableRegex, matchWholeWord]
  );

  useEffect(() => {
    if (!searchInputRef.current) return;
    search(searchInputRef.current.value);
  }, [search, matchCase, matchWholeWord, enableRegex]);

  useEffect(() => {
    if (selectedText) {
      if (searchInputRef.current) {
        const input = searchInputRef.current;
        setTimeout(() => {
          input.value = selectedText;
          input.focus();
        }, 0);
      }
      search(selectedText);
    }
  }, [selectedText, search]);

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
                outlineColor: "primary",
                outlineWidth: "1.8px"
              },
              ":hover": {
                outlineColor: "primary"
              }
            }}
          >
            <Input
              id={"search-replace-input"}
              variant={"clean"}
              defaultValue={selectedText}
              ref={searchInputRef}
              autoFocus
              placeholder="Find"
              sx={{ p: 0 }}
              onChange={(e) => {
                search(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  editor.commands.moveToNextResult();
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
                title="Expand"
                id="expand"
                icon={isExpanded ? "chevronRight" : "chevronLeft"}
                onClick={() => setIsExpanded((s) => !s)}
                iconSize={"medium"}
              />
              {isExpanded && (
                <>
                  <ToolButton
                    sx={{
                      mr: 0
                    }}
                    toggled={matchCase}
                    title="Match case"
                    id="matchCase"
                    icon="caseSensitive"
                    onClick={() => setMatchCase((s) => !s)}
                    iconSize={"medium"}
                  />
                  <ToolButton
                    sx={{
                      mr: 0
                    }}
                    toggled={matchWholeWord}
                    title="Match whole word"
                    id="matchWholeWord"
                    icon="wholeWord"
                    onClick={() => setMatchWholeWord((s) => !s)}
                    iconSize={"medium"}
                  />
                  <ToolButton
                    sx={{
                      mr: 0
                    }}
                    toggled={enableRegex}
                    title="Enable regex"
                    id="enableRegex"
                    icon="regex"
                    onClick={() => setEnableRegex((s) => !s)}
                    iconSize={"medium"}
                  />
                </>
              )}
              <Text
                variant={"subBody"}
                sx={{
                  flexShrink: 0,
                  borderLeft: "1px solid var(--border)",
                  color: "fontTertiary",
                  px: 1
                }}
              >
                {results ? `${selectedIndex + 1}/${results.length}` : ""}
              </Text>
            </Flex>
          </Flex>
          {isReplacing && (
            <Input
              sx={{ mt: 1, p: "7px" }}
              placeholder="Replace"
              onChange={(e) => (replaceText.current = e.target.value)}
            />
          )}
        </Flex>
        <Flex sx={{ flexDirection: "column" }}>
          <Flex sx={{ alignItems: "center", height: "33.2px" }}>
            <ToolButton
              toggled={isReplacing}
              title="Toggle replace"
              id="toggleReplace"
              icon="replace"
              onClick={() => setIsReplacing((s) => !s)}
              sx={{ mr: 0 }}
              iconSize={"big"}
            />
            <ToolButton
              toggled={false}
              title="Previous match"
              id="previousMatch"
              icon="previousMatch"
              onClick={() => editor.commands.moveToPreviousResult()}
              sx={{ mr: 0 }}
              iconSize={"big"}
            />
            <ToolButton
              toggled={false}
              title="Next match"
              id="nextMatch"
              icon="nextMatch"
              onClick={() => editor.commands.moveToNextResult()}
              sx={{ mr: 0 }}
              iconSize={"big"}
            />
            <ToolButton
              toggled={false}
              title="Close"
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
                title="Replace"
                id="replace"
                icon="replaceOne"
                onClick={() => editor.commands.replace(replaceText.current)}
                sx={{ mr: 0 }}
                iconSize={18}
              />
              <ToolButton
                toggled={false}
                title="Replace all"
                id="replaceAll"
                icon="replaceAll"
                onClick={() => editor.commands.replaceAll(replaceText.current)}
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
