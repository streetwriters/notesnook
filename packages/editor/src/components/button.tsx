import { forwardRef, useCallback, useRef, ForwardedRef } from "react";
import { useEffect } from "react";
import { Button as RebassButton, ButtonProps } from "@streetwriters/rebass";

const _Button = (
  props: ButtonProps,
  forwardedRef: ForwardedRef<HTMLButtonElement>
) => {
  const { sx, ...buttonProps } = props;

  const hoverBg =
    (sx as unknown as Record<string, never>)?.[":hover"]?.["bg"] || "hover";
  const bg = (sx as unknown as Record<string, never>)?.["bg"] || "unset";

  const buttonRef = useRef<HTMLButtonElement>();

  useEffect(() => {
    if (!buttonRef.current) return;

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

  const onMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <RebassButton
      {...buttonProps}
      sx={{
        ...sx,
        ":hover": { bg: [bg, hoverBg] },
        ":active": { bg: hoverBg }
      }}
      ref={(ref) => {
        buttonRef.current = ref;
        if (typeof forwardedRef === "function") forwardedRef(ref);
        else if (forwardedRef) forwardedRef.current = ref;
      }}
      onClick={props.onClick}
    />
  );
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(_Button);
