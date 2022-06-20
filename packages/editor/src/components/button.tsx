import React, { useCallback, useRef } from "react";
import { Button as RebassButton, ButtonProps } from "rebass";

export default function Button(props: ButtonProps) {
  const touchStartTime = useRef(0);

  const onTouchEnd = useCallback((e) => {
    e.preventDefault();
    const now = Date.now();
    setTimeout(() => {
      if (touchStartTime.current === 0) return;
      if (now - touchStartTime.current > 300) return;
      //@ts-ignore
      props.onClick(e);
    }, 1);
  }, []);

  const onTouchStart = useCallback((e) => {
    touchStartTime.current = Date.now();
    e.preventDefault();
  }, []);

  return (
    <RebassButton
      {...props}
      onClick={props.onClick}
      onMouseDown={(e) => e.preventDefault()}
      onTouchEnd={onTouchEnd}
      onTouchMove={() => {
        touchStartTime.current = 0;
      }}
      onTouchStart={onTouchStart}
    />
  );
}
