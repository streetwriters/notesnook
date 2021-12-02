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
          width: node.scrollWidth,
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
      if (!ref.current || index >= slides.length) return;
      slides[index].node.scrollIntoView({ behavior: "smooth" });
    },
    [ref, slides]
  );

  return [slideToIndex];
}
