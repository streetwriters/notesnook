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
import { useRef, useState } from "react";
import { classNames, sashClassName } from "./base";
import { ISashProps } from "./types";

export default function Sash({
  className,
  render,
  onDragStart,
  onDragging,
  onDragEnd,
  sashRef,
  ...others
}: ISashProps) {
  const timeout = useRef<number | null>(null);
  const [active, setActive] = useState(false);
  const [draging, setDrag] = useState(false);

  const handleMouseMove = function (e: MouseEvent) {
    onDragging(e as any);
  };

  const handleMouseUp = function (e: MouseEvent) {
    setDrag(false);
    onDragEnd(e as any);
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={sashRef}
      role="Resizer"
      className={classNames(sashClassName, className)}
      onMouseEnter={() => {
        timeout.current = setTimeout(() => {
          setActive(true);
        }, 150) as unknown as number;
      }}
      onMouseLeave={() => {
        if (timeout.current) {
          setActive(false);
          clearTimeout(timeout.current);
        }
      }}
      onMouseDown={(e) => {
        setDrag(true);
        onDragStart(e);

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
      }}
      {...others}
    >
      {render(draging || active)}
    </div>
  );
}
