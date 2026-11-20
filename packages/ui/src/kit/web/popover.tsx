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

import { useEffect, useState } from "react";
import { create } from "zustand";
import type * as Contract from "../contracts/overlays";
import { popoverPosition } from "../shared/popover-position";
import { useWindowSize } from "./hooks";
import { Box, Flex } from "./primitives";
import { ThemeScope } from "./theme";

type Entry = {
  id: number;
  rect: { x: number; y: number; width: number; height: number };
  props: Contract.PopoverProps;
};

const useStore = create<{ entries: Entry[] }>(() => ({ entries: [] }));

let counter = 0;

function put(entry: Entry) {
  useStore.setState((state) => ({
    entries: [...state.entries.filter((e) => e.id !== entry.id), entry]
  }));
}

function remove(id: number) {
  useStore.setState((state) => ({
    entries: state.entries.filter((e) => e.id !== id)
  }));
}

export function Popover(props: Contract.PopoverProps) {
  const [id] = useStable();

  useEffect(() => {
    if (!props.isOpen) {
      remove(id);
      return;
    }
    if (props.anchorRect) {
      put({ id, rect: props.anchorRect, props });
      return;
    }
    props.anchorRef?.current?.measureInWindow((x, y, width, height) =>
      put({ id, rect: { x, y, width, height }, props })
    );
  });

  useEffect(() => () => remove(id), [id]);
  return null;
}

const DEFAULT_SHEET_BREAKPOINT = 600;

export function ResponsivePresenter(props: Contract.ResponsivePresenterProps) {
  const { sheetBreakpoint = DEFAULT_SHEET_BREAKPOINT, ...popover } = props;
  const window = useWindowSize();
  if (window.width >= sheetBreakpoint) return <Popover {...popover} />;

  // Sheet: a full-width panel pinned to the bottom edge of the window.
  return (
    <Popover
      {...popover}
      anchorRect={{ x: 0, y: window.height, width: window.width, height: 0 }}
      placement="top-start"
      sx={{
        ...popover.sx,
        width: window.width,
        borderRadius: "radius2"
      }}
    />
  );
}

function useStable() {
  return useState(() => ++counter);
}

export function PopoverHost() {
  const entries = useStore((state) => state.entries);
  const window = useWindowSize();
  return (
    <>
      {entries.map(({ id, rect, props }) => {
        const position = popoverPosition(
          rect,
          props.placement ?? "bottom-start",
          window
        );
        return (
          <ThemeScope key={id} scope="contextMenu">
            <Box
              onPress={props.onClose}
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000
              }}
            >
              <Flex
                onPress={(event) => event.stopPropagation()}
                sx={{
                  position: "absolute",
                  ...position,
                  bg: "background",
                  borderRadius: "radius2",
                  boxShadow: "menu",
                  ...props.sx
                }}
              >
                {props.children}
              </Flex>
            </Box>
          </ThemeScope>
        );
      })}
    </>
  );
}
