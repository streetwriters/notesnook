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

import { forwardRef, useRef, ForwardedRef } from "react";
import { useEffect } from "react";
import { Button as RebassButton, ButtonProps } from "@theme-ui/components";

const _Button = (
  props: ButtonProps,
  forwardedRef: ForwardedRef<HTMLButtonElement>
) => {
  const { sx, ...buttonProps } = props;

  const buttonRef = useRef<HTMLButtonElement>();

  useEffect(() => {
    if (!buttonRef.current) return;

    function onMouseDown(e: MouseEvent) {
      if (globalThis.keyboardShown) {
        e.preventDefault();
      }
    }

    buttonRef.current.addEventListener("mousedown", onMouseDown, {
      passive: false,
      capture: true
    });

    return () => {
      buttonRef.current?.removeEventListener("mousedown", onMouseDown, {
        capture: true
      });
    };
  }, []);

  return (
    <RebassButton
      {...buttonProps}
      sx={{
        ...sx
      }}
      ref={(ref) => {
        buttonRef.current = ref || undefined;
        if (typeof forwardedRef === "function") forwardedRef(ref);
        else if (forwardedRef) forwardedRef.current = ref;
      }}
      onClick={props.onClick}
    />
  );
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(_Button);
