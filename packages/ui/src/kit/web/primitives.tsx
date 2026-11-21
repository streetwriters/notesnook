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

import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  type Ref
} from "react";
import qrcode from "qrcode-generator";
import type * as Contract from "../contracts/primitives";
import { useDom, useUIElement } from "./use-dom";
import { useThemeContext } from "./theme";

export { ThemeScope } from "./theme";

type Any = Record<string, any>;

const ROW = { flexDirection: "row" } as never;

function BoxElement(
  props: Contract.BoxProps,
  ref: Ref<Contract.UIElement>,
  row: boolean
) {
  const element = useRef<HTMLDivElement | null>(null);
  useUIElement(ref, element);
  const sx = props.sx as Any | undefined;
  const dom = useDom(props, {
    baseClass: "nn-box",
    variantGroup: props.variant ? "variants" : undefined,
    variant: props.variant as string | undefined,
    defaults: row || sx?.display === "flex" ? ROW : undefined
  });
  useLayoutEffect(() => {
    const node = element.current;
    if (props.testID === "list-item" && node) {
      const has = (id: string) =>
        !!node.querySelector(`:scope > [data-test-id="${id}"]`);
      node.classList.toggle("selected", has("list-item-in-selection"));
      const active = document.activeElement as HTMLElement | null;
      const typing =
        !!active &&
        (active.isContentEditable ||
          active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA");
      if (has("list-item-cursor") && active !== node && !typing)
        node.focus({ preventScroll: true });
    }
  });
  useLayoutEffect(() => {
    const node = element.current;
    if (!node) return;
    const testID = props.testID ?? "";
    if (testID === "editor-session-active" || testID === "diff-viewer") {
      node.classList.add("active");
      return () => node.classList.remove("active");
    }
    if (/^tab-(?!icon|title|close)/.test(testID)) {
      node.classList.add("tab");
      node.classList.toggle(
        "active",
        !!node.querySelector(`:scope > [data-test-id="active-tab"]`)
      );
    }
  });
  useLayoutEffect(() => {
    if (props.testID !== "routeHeader" || !element.current) return;
    const title = element.current.querySelector('[data-test-id="route-title"]');
    if (title?.textContent)
      element.current.setAttribute("data-header", title.textContent);
  });
  return (
    <div {...(dom as Any)} ref={element}>
      {props.children}
    </div>
  );
}

export const Box = forwardRef<Contract.UIElement, Contract.BoxProps>(
  function Box(props, ref) {
    return BoxElement(props, ref, false);
  }
);

export const Flex = forwardRef<Contract.UIElement, Contract.FlexProps>(
  function Flex(props, ref) {
    return BoxElement(props, ref, true);
  }
);

export const Grid = forwardRef<Contract.UIElement, Contract.GridProps>(
  function Grid(props, ref) {
    const element = useRef<HTMLDivElement | null>(null);
    useUIElement(ref, element);
    const dom = useDom(props, {
      baseClass: "nn-box",
      variantGroup: props.variant ? "variants" : undefined,
      variant: props.variant as string | undefined,
      defaults: {
        display: "grid",
        gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))`
      } as never
    });
    return (
      <div {...(dom as Any)} ref={element}>
        {props.children}
      </div>
    );
  }
);

export const Text = forwardRef<Contract.UIElement, Contract.TextProps>(
  function Text(props, ref) {
    const element = useRef<HTMLSpanElement | null>(null);
    useUIElement(ref, element);
    const lines = props.numberOfLines;
    const dom = useDom(props, {
      baseClass: lines ? "nn-text nn-lines" : "nn-text",
      variantGroup: props.variant ? "text" : undefined,
      variant: props.variant as string | undefined,
      defaults: lines
        ? ({ WebkitLineClamp: lines, overflow: "hidden" } as never)
        : undefined
    });
    return (
      <span
        {...(dom as Any)}
        ref={element}
        data-selectable={props.selectable ? "" : undefined}
      >
        {props.children}
      </span>
    );
  }
);

export const Label = forwardRef<Contract.UIElement, Contract.LabelProps>(
  function Label(props, ref) {
    const element = useRef<HTMLLabelElement | null>(null);
    useUIElement(ref, element);
    const dom = useDom(props, {
      baseClass: "nn-box",
      variantGroup: props.variant ? "forms" : undefined,
      variant: props.variant as string | undefined,
      defaults: { flexDirection: "row", alignItems: "center" } as never
    });
    return (
      <label {...(dom as Any)} ref={element}>
        {props.children}
      </label>
    );
  }
);

export const Link = forwardRef<Contract.UIElement, Contract.LinkProps>(
  function Link(props, ref) {
    const element = useRef<HTMLAnchorElement | null>(null);
    useUIElement(ref, element);
    const dom = useDom(props, {
      baseClass: "nn-text",
      defaults: { cursor: "pointer", color: "accent" } as never
    });
    return (
      <a
        {...(dom as Any)}
        ref={element}
        href={props.href}
        target="_blank"
        rel="noreferrer"
      >
        {props.children}
      </a>
    );
  }
);

export const Button = forwardRef<Contract.UIElement, Contract.ButtonProps>(
  function Button(props, ref) {
    const element = useRef<HTMLButtonElement | null>(null);
    useUIElement(ref, element);
    const dom = useDom(props, {
      baseClass: "nn-button",
      variantGroup: props.variant ? "buttons" : undefined,
      variant: props.variant as string | undefined
    });
    return (
      <button
        type="button"
        {...(dom as Any)}
        {...(props.focusable === false
          ? {
              tabIndex: -1,
              onMouseDown: (event: { preventDefault(): void }) =>
                event.preventDefault()
            }
          : undefined)}
        ref={element}
        disabled={props.disabled}
      >
        {props.children}
      </button>
    );
  }
);

export const Image = forwardRef<Contract.UIElement, Contract.ImageProps>(
  function Image(props, ref) {
    const element = useRef<HTMLImageElement | null>(null);
    useUIElement(ref, element);
    const fit =
      props.resizeMode === "contain"
        ? "contain"
        : props.resizeMode === "stretch"
        ? "fill"
        : "cover";
    const dom = useDom(props, {
      defaults: { objectFit: fit, flexShrink: 0 } as never
    });
    return (
      <img
        {...(dom as Any)}
        ref={element}
        src={props.src}
        alt={props.alt ?? ""}
        onLoad={() => props.onLoad?.()}
      />
    );
  }
);

export const Input = forwardRef<Contract.UIElement, Contract.InputProps>(
  function Input(props, ref) {
    const element = useRef<HTMLInputElement | null>(null);
    useUIElement(ref, element);
    const dom = useDom(props, {
      baseClass: "nn-input",
      variantGroup: "forms",
      variant: (props.variant as string | undefined) ?? "input",
      defaults: { p: 2 } as never
    });
    return (
      <input
        {...(dom as Any)}
        ref={element}
        type={props.type ?? "text"}
        value={props.value}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        disabled={props.disabled}
        readOnly={props.readOnly}
        autoFocus={props.autoFocus}
        maxLength={props.maxLength}
        onFocus={(event) => {
          if (props.selectTextOnFocus) event.currentTarget.select();
          (dom.onFocus as any)?.(event);
        }}
        onChange={(event) => props.onChangeText?.(event.target.value)}
        onKeyDown={(event) => {
          (dom.onKeyDown as any)?.(event);
          if (event.key === "Enter") props.onSubmit?.(event.currentTarget.value);
        }}
      />
    );
  }
);

export const Textarea = forwardRef<Contract.UIElement, Contract.TextareaProps>(
  function Textarea(props, ref) {
    const element = useRef<HTMLTextAreaElement | null>(null);
    useUIElement(ref, element);
    const dom = useDom(props, {
      baseClass: "nn-input nn-textarea",
      variantGroup: "forms",
      variant: (props.variant as string | undefined) ?? "textarea",
      defaults: { p: 2 } as never
    });
    useLayoutEffect(() => {
      const target = element.current;
      // `rows` is the minimum height; the field grows to fit its content.
      if (!target) return;
      target.style.height = "auto";
      target.style.height = `${target.scrollHeight}px`;
      target.style.overflow = "hidden";
    });
    return (
      <textarea
        {...(dom as Any)}
        ref={element}
        rows={props.rows}
        value={props.value}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        disabled={props.disabled}
        readOnly={props.readOnly}
        autoFocus={props.autoFocus}
        maxLength={props.maxLength}
        onFocus={(event) => {
          if (props.selectTextOnFocus) event.currentTarget.select();
          (dom.onFocus as any)?.(event);
        }}
        onChange={(event) => props.onChangeText?.(event.target.value)}
      />
    );
  }
);

export const Checkbox = forwardRef<Contract.UIElement, Contract.CheckboxProps>(
  function Checkbox(props, ref) {
    const element = useRef<HTMLInputElement | null>(null);
    useUIElement(ref, element);
    const dom = useDom(props, {
      variantGroup: props.variant ? "forms" : undefined,
      variant: props.variant as string | undefined
    });
    return (
      <input
        {...(dom as Any)}
        id={props.testID}
        ref={element}
        type="checkbox"
        checked={props.checked}
        defaultChecked={props.defaultChecked}
        disabled={props.disabled}
        onChange={(event) => props.onChange?.(event.target.checked)}
      />
    );
  }
);

export const Radio = forwardRef<Contract.UIElement, Contract.RadioProps>(
  function Radio(props, ref) {
    const element = useRef<HTMLInputElement | null>(null);
    useUIElement(ref, element);
    const dom = useDom(props, {
      variantGroup: props.variant ? "forms" : undefined,
      variant: props.variant as string | undefined
    });
    return (
      <input
        {...(dom as Any)}
        ref={element}
        type="radio"
        name={props.name}
        value={props.value}
        checked={props.checked}
        disabled={props.disabled}
        onChange={(event) => props.onChange?.(event.target.checked)}
      />
    );
  }
);

export const Select = forwardRef<Contract.UIElement, Contract.SelectProps>(
  function Select(props, ref) {
    const element = useRef<HTMLSelectElement | null>(null);
    useUIElement(ref, element);
    const dom = useDom(props, {});
    return (
      <select
        {...(dom as Any)}
        ref={element}
        value={props.value}
        onChange={(event) => props.onChange?.(event.target.value)}
      >
        {props.options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.title}
          </option>
        ))}
      </select>
    );
  }
);

export const Switch = forwardRef<Contract.UIElement, Contract.SwitchProps>(
  function Switch(props, ref) {
    const element = useRef<HTMLButtonElement | null>(null);
    useUIElement(ref, element);
    const dom = useDom(props, {
      baseClass: "nn-button",
      variantGroup: props.variant ? "forms" : undefined,
      variant: props.variant as string | undefined
    });
    const { colors } = useThemeContext();
    const checked = !!props.checked;
    return (
      <label
        style={{ display: "inline-flex", flexShrink: 0, position: "relative" }}
      >
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          {...(dom as Any)}
          ref={element}
          disabled={props.disabled}
          onClick={() => props.onChange?.(!checked)}
          style={{
            position: "relative",
            width: 34,
            height: 18,
            padding: 0,
            margin: 0,
            border: "none",
            borderRadius: 18,
            flexShrink: 0,
            cursor: props.disabled ? "default" : "pointer",
            opacity: props.disabled ? 0.5 : 1,
            backgroundColor: checked
              ? colors.accent
              : colors["icon-disabled"]
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 4,
              left: checked ? 20 : 4,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#ffffff",
              pointerEvents: "none"
            }}
          />
        </button>
        <input
          type="checkbox"
          checked={checked}
          data-checked={checked}
          readOnly
          tabIndex={-1}
          aria-hidden
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            margin: 0,
            opacity: 0,
            pointerEvents: "none"
          }}
        />
      </label>
    );
  }
);

export const Slider = forwardRef<Contract.UIElement, Contract.SliderProps>(
  function Slider(props, ref) {
    const element = useRef<HTMLInputElement | null>(null);
    useUIElement(ref, element);
    const { colors } = useThemeContext();
    const dom = useDom(props, {
      baseClass: "nn-slider",
      variantGroup: props.variant ? "forms" : undefined,
      variant: props.variant as string | undefined
    });
    return (
      <input
        {...(dom as Any)}
        ref={element}
        style={{ accentColor: colors.accent }}
        type="range"
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step}
        disabled={props.disabled}
        onChange={(event) => props.onChange?.(Number(event.target.value))}
      />
    );
  }
);

export const Progress = forwardRef<Contract.UIElement, Contract.ProgressProps>(
  function Progress(props, ref) {
    const element = useRef<HTMLProgressElement | null>(null);
    useUIElement(ref, element);
    const dom = useDom(props, {});
    return (
      <progress
        {...(dom as Any)}
        ref={element}
        value={props.value}
        max={props.max ?? 100}
      />
    );
  }
);

export const Icon = forwardRef<Contract.UIElement, Contract.IconProps>(
  function Icon(props, ref) {
    const element = useRef<HTMLDivElement | null>(null);
    useUIElement(ref, element);
    const { theme, colors } = useThemeContext();
    const sizeToken = props.size ?? "medium";
    const size =
      typeof sizeToken === "number"
        ? sizeToken
        : (theme.iconSizes as unknown as Record<string, number>)[
            sizeToken as string
          ] ?? 18;
    const color = props.color ? colors[props.color] ?? props.color : undefined;
    const dom = useDom(props, {
      baseClass: "nn-box nn-icon",
      defaults: {
        flexShrink: 0,
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        ...(props.rotate ? { transform: `rotate(${props.rotate}deg)` } : {})
      } as never
    });
    return (
      <div
        {...(dom as Any)}
        ref={element}
        style={{ color, display: "inline-flex" }}
      >
        {props.path ? (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d={props.path} />
          </svg>
        ) : props.svg ? (
          <div
            style={{ width: size, height: size, display: "inline-flex" }}
            dangerouslySetInnerHTML={{ __html: props.svg }}
          />
        ) : null}
      </div>
    );
  }
);

export const ColorPicker = forwardRef<
  Contract.UIElement,
  Contract.ColorPickerProps
>(function ColorPicker(props, ref) {
  const element = useRef<HTMLInputElement | null>(null);
  useUIElement(ref, element);
  const dom = useDom(props, {});
  return (
    <input
      {...(dom as Any)}
      ref={element}
      type="color"
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
    />
  );
});

export const QRCode = forwardRef<
  Contract.QRCodeHandle,
  Contract.QRCodeProps
>(function QRCode(props, ref: Ref<Contract.QRCodeHandle>) {
  const { colors } = useThemeContext();
  const svg = useMemo(() => {
    const code = qrcode(0, props.ecLevel ?? "M");
    code.addData(props.value);
    code.make();
    return code.createSvgTag({ cellSize: 1, margin: 0, scalable: true });
  }, [props.value, props.ecLevel]);
  useImperativeHandle(
    ref,
    () => ({
      toSVG: () => svg,
      toPNG: async () => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = props.size;
        const context = canvas.getContext("2d")!;
        const image = new window.Image();
        image.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
        await image.decode();
        context.drawImage(image, 0, 0, props.size, props.size);
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve)
        );
        return new Uint8Array(await blob!.arrayBuffer());
      }
    }),
    [svg, props.size]
  );
  const dom = useDom(props, {
    baseClass: "nn-box",
    defaults: {
      width: props.size,
      height: props.size,
      backgroundColor: colors.background ?? "#fff"
    } as never
  });
  return <div {...(dom as Any)} dangerouslySetInnerHTML={{ __html: svg }} />;
});
