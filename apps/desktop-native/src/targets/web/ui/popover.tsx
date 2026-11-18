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
import type * as Contract from "../../../ui/overlays";
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
    props.anchorRef.current?.measureInWindow((x, y, width, height) =>
      put({ id, rect: { x, y, width, height }, props })
    );
  });

  useEffect(() => () => remove(id), [id]);
  return null;
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
        const placement = props.placement ?? "bottom-start";
        const below = placement.startsWith("bottom");
        const start = placement.endsWith("start");
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
                  top: below ? rect.y + rect.height + 5 : undefined,
                  bottom: below ? undefined : window.height - rect.y + 5,
                  left: start ? rect.x : undefined,
                  right: start ? undefined : window.width - rect.x - rect.width,
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
