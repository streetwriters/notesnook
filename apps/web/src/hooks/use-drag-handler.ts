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

import { useCallback, useRef } from "react";

export function useDragHandler(id: string) {
  const isDraggingOver = useRef(false);
  const bounds = useRef<DOMRect>();

  const isDragLeaving = useCallback((e: React.DragEvent) => {
    if (
      !isDraggingOver.current ||
      !bounds.current ||
      (e.clientX >= bounds.current.x &&
        e.clientX <= bounds.current.right &&
        e.clientY >= bounds.current.y &&
        e.clientY <= bounds.current.bottom)
    )
      return false;

    isDraggingOver.current = false;
    bounds.current = undefined;
    return true;
  }, []);

  const isDragEntering = useCallback(
    (e: React.DragEvent) => {
      if (
        isDraggingOver.current ||
        !(e.target instanceof HTMLElement) ||
        (e.target.id !== id && !e.target.closest(`#${id}`))
      )
        return false;
      isDraggingOver.current = true;
      bounds.current = e.target.closest(`#${id}`)!.getBoundingClientRect();
      return true;
    },
    [id]
  );

  return { isDragEntering, isDragLeaving };
}
