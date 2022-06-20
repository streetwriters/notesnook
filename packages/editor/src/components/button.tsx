import React, { useCallback, useRef } from "react";
import { useEffect } from "react";
import { Button as RebassButton, ButtonProps } from "rebass";

export function Button(props: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>();
  const touchStartTime = useRef(0);

  useEffect(() => {
    if (!buttonRef.current) return;

    buttonRef.current.addEventListener("mousedown", onMouseDown, {
      passive: false,
      capture: true,
    });

    return () => {
      buttonRef.current?.removeEventListener("mousedown", onMouseDown, {
        capture: true,
      });
    };
  }, [buttonRef.current]);

  const onMouseDown = useCallback((e: MouseEvent) => {
    console.log("Preventing");
    e.preventDefault();
  }, []);

  // const onTouchEnd = useCallback((e) => {
  //   e.preventDefault();
  //   const now = Date.now();
  //   setTimeout(() => {
  //     if (touchStartTime.current === 0) return;
  //     if (now - touchStartTime.current > 300) return;
  //     //@ts-ignore
  //     props.onClick(e);
  //   }, 1);
  // }, []);

  // const onTouchStart = useCallback((e) => {
  //   touchStartTime.current = Date.now();
  //   e.preventDefault();
  // }, []);

  return (
    <RebassButton
      {...props}
      ref={(ref) => {
        buttonRef.current = ref;
        // props.ref = ref;
      }}
      onClick={props.onClick}
      onMouseDown={() => {}}
      // onTouchEnd={() => {}}
      // onTouchMove={() => {}}
      // //  {
      // //   touchStartTime.current = 0;
      // // }}
      // onTouchStart={() => {}}
    />
  );
}
