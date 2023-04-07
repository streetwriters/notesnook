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

import { useCallback, useEffect, useMemo, useRef } from "react";

export default function useSlider(sliderId, { onSliding, onChange }) {
  const ref = useRef(document.getElementById(sliderId));
  const slides = useMemo(() => [], []);

  useEffect(() => {
    if (!ref.current) return;
    const slider = ref.current;
    let lastSlide = null;
    let lastPosition = 0;
    let last = 0;
    if (!slides.length) {
      for (let node of slider.childNodes) {
        slides.push({
          index: slides.length,
          node,
          offset: last,
          width: node.scrollWidth
        });
        last += node.scrollWidth;
      }
    }

    function onScroll(e) {
      const position = e.target.scrollLeft;
      if (onSliding) onSliding(e, { lastSlide, lastPosition, position });
      const slide = slides.find(
        (slide) => slide.offset === Math.round(position)
      );
      if (onChange && slide && lastSlide !== slide) {
        onChange(e, { position, slide, lastSlide });
        lastSlide = slide;
      }
      lastPosition = position;
    }

    slider.onscroll = onScroll;
    return () => {
      slider.onscroll = null;
    };
  }, [ref, slides, onSliding, onChange]);

  const slideToIndex = useCallback(
    (index) => {
      if (!slides || !ref.current || index >= slides.length) return;
      setTimeout(() => {
        slides[index].node.scrollIntoView();
      }, 100);
    },
    [ref, slides]
  );

  return [slideToIndex];
}
