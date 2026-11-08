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

import type { Notebook as NotebookType } from "@notesnook/core";
import { Box, Button, Flex, Text, type PressEvent } from "@ui";
import ListItem from "../list-item";
import { CaretDown, Notebook as NotebookIcon } from "../icons";
import { navigate } from "../../navigation";
import { useStore as useNotesStore } from "../../stores/note-store";

const ICON_SIZE = 11;
const SPACING2 = 5;
const SPACING3 = 7;

type NotebookProps = {
  item: NotebookType;
  totalNotes?: number;
  isExpandable?: boolean;
  isExpanded?: boolean;
  expand?: () => void;
  collapse?: () => void;
  refresh?: () => void;
  select?: (event?: PressEvent) => void;
  depth?: number;
};

export function Notebook(props: NotebookProps) {
  const {
    item,
    totalNotes = 0,
    isExpandable = false,
    isExpanded = false,
    expand = () => {},
    collapse = () => {},
    depth = 0,
    select = () => {}
  } = props;
  const context = useNotesStore((store) => store.context);
  const isOpened = context?.type === "notebook" && context.id === item.id;
  const contextNotes = useNotesStore((store) => store.contextNotes);
  const currentContext = isOpened ? contextNotes : null;

  return (
    <ListItem
      isFocused={isOpened}
      isCompact
      item={item}
      onPress={(event) => {
        select(event);
        navigate(`/notebooks/${item.id}`, { notify: true });
      }}
      title={
        <Flex
          sx={{
            flexDirection: "row",
            alignItems: "center",
            gap: "spacing3",
            minWidth: 0
          }}
        >
          {isExpandable ? (
            <Button
              testID="notebook-expand"
              variant="secondary"
              onPress={(event) => {
                select(event);
                if (isExpanded) collapse();
                else expand();
              }}
              sx={{
                bg: "transparent",
                p: 0,
                borderRadius: "radius1",
                width: ICON_SIZE,
                height: ICON_SIZE,
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <CaretDown
                size={ICON_SIZE}
                color={isOpened ? "icon-selected" : "icon"}
                rotate={isExpanded ? undefined : -90}
              />
            </Button>
          ) : (
            <Box sx={{ width: ICON_SIZE, height: ICON_SIZE }} />
          )}
          {depth === 0 ? (
            <NotebookIcon
              size={13}
              color={isOpened ? "icon-selected" : "icon"}
            />
          ) : null}
          <Text
            testID="title"
            variant="body"
            numberOfLines={1}
            sx={{
              color: isOpened ? "paragraph-selected" : "paragraph",
              fontWeight: "normal",
              fontSize: "xs",
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
            lineHeight: 1,
            color: isOpened ? "paragraph" : "paragraph-secondary"
          }}
        >
          {currentContext ? currentContext.length : totalNotes}
        </Text>
      }
      sx={{
        pr: "spacing2",
        py: "spacing4",
        borderRadius: "radius1",
        mb: "spacing1",
        pl: `${
          depth === 0 ? SPACING2 : SPACING2 + (depth * ICON_SIZE + SPACING3)
        }px`
      }}
    />
  );
}
