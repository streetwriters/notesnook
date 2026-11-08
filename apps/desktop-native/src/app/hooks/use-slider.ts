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

import { useCallback, useEffect, useRef, useState } from "react";

type SliderOptions = {
  slideCount?: number;
  initialIndex?: number;
  onChange?: (index: number, lastIndex: number | undefined) => void;
};

export default function useSlider(options: SliderOptions = {}) {
  const { slideCount = 3, initialIndex = 1, onChange } = options;
  const [index, setIndex] = useState(initialIndex);
  const last = useRef<number | undefined>(undefined);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current?.(index, last.current);
    last.current = index;
  }, [index]);

  const slideToIndex = useCallback(
    (next: number) => setIndex(Math.max(0, Math.min(slideCount - 1, next))),
    [slideCount]
  );

  return { index, slideToIndex };
}
