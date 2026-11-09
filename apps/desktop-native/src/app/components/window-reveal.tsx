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

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type PropsWithChildren
} from "react";
import { windowControls } from "@platform";

const REVEAL_TIMEOUT = 1500;

const Context = createContext<() => void>(() => undefined);

export function WindowRevealProvider(
  props: PropsWithChildren<{ failed?: boolean }>
) {
  const revealed = useRef(false);
  const requested = useRef(false);
  const mounted = useRef(false);
  const perform = useRef<() => void>(() => undefined);

  const request = useCallback(() => {
    requested.current = true;
    if (mounted.current) perform.current();
  }, []);

  useEffect(() => {
    if (windowControls.startedHidden()) return;
    const timer = setTimeout(() => perform.current(), REVEAL_TIMEOUT);
    let frame: ReturnType<typeof requestAnimationFrame> | undefined;
    perform.current = () => {
      if (revealed.current) return;
      revealed.current = true;
      clearTimeout(timer);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          windowControls.show().catch(console.error);
        });
      });
    };
    mounted.current = true;
    if (requested.current) perform.current();
    return () => {
      mounted.current = false;
      clearTimeout(timer);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (props.failed) request();
  }, [props.failed, request]);

  return <Context.Provider value={request}>{props.children}</Context.Provider>;
}

export function useWindowReveal() {
  return useContext(Context);
}
