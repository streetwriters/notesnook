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

type Slide = {
  index: number;
  node: HTMLElement;
  offset: number;
  width: number;
};

export default function useSlider({
  onSliding,
  onChange
}: {
  onSliding?: (
    e: Event,
    options: {
      lastSlide: Slide | null;
      lastPosition: number;
      position: number;
    }
  ) => void;
  onChange?: (
    e: Event,
    options: { position: number; slide: Slide; lastSlide: Slide | null }
  ) => void;
} = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const slides: Slide[] = useMemo(() => [], []);

  useEffect(() => {
    if (!ref.current) return;
    const slider = ref.current;
    let lastSlide: Slide | null = null;
    let lastPosition = 0;
    let last = 0;
    if (!slides.length) {
      for (const node of slider.childNodes) {
        if (
          !(node instanceof HTMLElement) ||
          node.classList.contains("ms-track-box")
        )
          continue;
        slides.push({
          index: slides.length,
          node,
          offset: last,
          width: node.scrollWidth
        });
        last += node.scrollWidth;
      }
    }

    function onScroll(e: Event) {
      const position =
        e.target && e.target instanceof HTMLElement ? e.target.scrollLeft : -1;
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
    (index: number) => {
      if (!slides || !ref.current || index >= slides.length) return;
      const slider = ref.current;
      setTimeout(() => {
        slider.scrollTo({
          left: slides[index].offset,
          behavior: "smooth"
        });
      }, 100);
    },
    [ref, slides]
  );

  return { ref, slideToIndex };
}
