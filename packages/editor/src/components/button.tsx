import { forwardRef, useCallback, useRef } from "react";
import { useEffect } from "react";
import { Button as RebassButton, ButtonProps } from "rebass";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props: ButtonProps, forwardedRef) => {
    const buttonRef = useRef<HTMLButtonElement>();

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
    }, []);

    const onMouseDown = useCallback((e: MouseEvent) => {
      e.preventDefault();
    }, []);

    return (
      <RebassButton
        {...props}
        ref={(ref) => {
          buttonRef.current = ref;
          if (typeof forwardedRef === "function") forwardedRef(ref);
          else if (forwardedRef) forwardedRef.current = ref;
        }}
        onClick={props.onClick}
        onMouseDown={() => {}}
      />
    );
  }
);
