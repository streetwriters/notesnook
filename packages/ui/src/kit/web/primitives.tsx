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
  useMemo,
  type ForwardRefExoticComponent,
  type PropsWithoutRef,
  type Ref,
  type RefAttributes
} from "react";
import * as ThemeUI from "@theme-ui/components";
import { useTheme } from "@emotion/react";
import qrcode from "qrcode-generator";
import type * as Contract from "../contracts/primitives";
import { withKitSx } from "./kit-sx";

export { ThemeScope } from "./theme";

/**
 * On the web the kit's primitives are theme-ui's own components, drawn with
 * the kit's own handling (`kit-sx.tsx`): the kit-only `sx` shapes and props,
 * and the layout defaults the kit has always set on these components.
 */

/** The props the kit adds to a theme-ui component (see `kit-sx.tsx`). */
export interface KitProps {
  /** The name `:group-hover` in a child's `sx` selects on. */
  group?: string;
  selectable?: boolean;
  /** `false` keeps focus where it was when the element is pressed. */
  focusable?: boolean;
  selectTextOnFocus?: boolean;
  "data-test-id"?: string;
}

/**
 * A theme-ui component as the kit exports it on the web: theme-ui's own
 * props, `sx`, DOM events and DOM element ref, with the kit's props on top.
 * This is what apps/web type-checks against, so its DOM code
 * (`event.nativeEvent`, `ref.current.classList`, `React.MouseEvent` handlers)
 * and the theme-ui typed components it hands these props to keep compiling.
 * The kit-only `sx` shapes (`:group-hover`, a transition object) are drawn
 * here too (`sx.ts`), but only the contract types them.
 */
type WebProps<P> = Omit<P, keyof KitProps> & KitProps;
type WebPrimitive<P, E> = ForwardRefExoticComponent<
  PropsWithoutRef<WebProps<P>> & RefAttributes<E>
>;

export type BoxProps = WebProps<ThemeUI.BoxProps>;
export type FlexProps = WebProps<ThemeUI.FlexProps>;
export type GridProps = WebProps<ThemeUI.GridProps>;
export type TextProps = WebProps<ThemeUI.TextProps>;
export type ButtonProps = WebProps<ThemeUI.ButtonProps>;
export type LabelProps = WebProps<ThemeUI.LabelProps>;
export type LinkProps = WebProps<ThemeUI.LinkProps>;
export type ImageProps = WebProps<ThemeUI.ImageProps>;
export type InputProps = WebProps<ThemeUI.InputProps>;
export type TextareaProps = WebProps<ThemeUI.TextareaProps>;
export type CheckboxProps = WebProps<ThemeUI.CheckboxProps>;
export type RadioProps = WebProps<ThemeUI.RadioProps>;
export type SelectProps = WebProps<ThemeUI.SelectProps>;
export type SwitchProps = WebProps<ThemeUI.SwitchProps>;
export type SliderProps = WebProps<ThemeUI.SliderProps>;
export type ProgressProps = WebProps<ThemeUI.ProgressProps>;
export type DonutProps = WebProps<ThemeUI.DonutProps>;

export const Box = withKitSx<WebPrimitive<ThemeUI.BoxProps, any>>(ThemeUI.Box, {
  className: "nn-box"
});
export const Flex = withKitSx<WebPrimitive<ThemeUI.FlexProps, HTMLElement>>(
  ThemeUI.Flex,
  { className: "nn-flex" }
);
export const Grid = withKitSx<WebPrimitive<ThemeUI.GridProps, HTMLDivElement>>(
  ThemeUI.Grid
);
export const Text = withKitSx<WebPrimitive<ThemeUI.TextProps, HTMLDivElement>>(
  ThemeUI.Text,
  { className: "nn-text" }
);
export const Button = withKitSx<
  WebPrimitive<ThemeUI.ButtonProps, HTMLButtonElement>
>(ThemeUI.Button, {
  className: "nn-button",
  // theme-ui's button is `inline-block`; the kit lays its children out in a row.
  sx: { display: "flex" }
});
export const Label = withKitSx<
  WebPrimitive<ThemeUI.LabelProps, HTMLLabelElement>
>(ThemeUI.Label);
export const Link = withKitSx<
  WebPrimitive<ThemeUI.LinkProps, HTMLAnchorElement>
>(ThemeUI.Link, {
  defaults: { target: "_blank", rel: "noreferrer" }
});
export const Image = withKitSx<
  WebPrimitive<ThemeUI.ImageProps, HTMLImageElement>
>(ThemeUI.Image);
export const Input = withKitSx<
  WebPrimitive<ThemeUI.InputProps, HTMLInputElement>
>(ThemeUI.Input, {
  className: "nn-input"
});
export const Textarea = withKitSx<
  WebPrimitive<ThemeUI.TextareaProps, HTMLTextAreaElement>
>(ThemeUI.Textarea, {
  className: "nn-input nn-textarea"
});
export const Checkbox = withKitSx<
  WebPrimitive<ThemeUI.CheckboxProps, HTMLInputElement>
>(ThemeUI.Checkbox);
export const Radio = withKitSx<
  WebPrimitive<ThemeUI.RadioProps, HTMLInputElement>
>(ThemeUI.Radio);
export const Select = withKitSx<
  WebPrimitive<ThemeUI.SelectProps, HTMLSelectElement>
>(ThemeUI.Select);
export const Switch = withKitSx<
  WebPrimitive<ThemeUI.SwitchProps, HTMLInputElement>
>(ThemeUI.Switch);
export const Slider = withKitSx<
  WebPrimitive<ThemeUI.SliderProps, HTMLInputElement>
>(ThemeUI.Slider);
export const Progress = withKitSx<
  WebPrimitive<ThemeUI.ProgressProps, HTMLProgressElement>
>(ThemeUI.Progress);
export const Donut = withKitSx<WebPrimitive<ThemeUI.DonutProps, SVGSVGElement>>(
  ThemeUI.Donut
);

// Kit-only components: theme-ui has no equivalent, so these keep a web
// version of their own, built on the primitives above. They are written
// against the contract (its `sx` shapes and events), as the same components
// are on desktop, so they take the elements typed that way.
export const KitBox = Box as unknown as typeof Contract.Box;
export const KitFlex = Flex as unknown as typeof Contract.Flex;
export const KitInput = Input as unknown as typeof Contract.Input;

type Any = Record<string, any>;

export const Icon = forwardRef<Contract.UIElement, Contract.IconProps>(
  function Icon(props, ref) {
    const {
      path: pathOrDocument,
      svg: svgDocument,
      size: sizeToken = "medium",
      color,
      rotate,
      sx,
      ...rest
    } = props;
    // An icon's `.path` is a whole SVG document for icons drawn from SVG files.
    const isDocument =
      !!pathOrDocument && pathOrDocument.trimStart().startsWith("<");
    const path = isDocument ? undefined : pathOrDocument;
    const svg = svgDocument ?? (isDocument ? pathOrDocument : undefined);
    const theme = useTheme() as Any;
    const size =
      typeof sizeToken === "number"
        ? sizeToken
        : theme.iconSizes?.[sizeToken] ?? 18;
    return (
      <KitFlex
        {...rest}
        ref={ref}
        className="nn-icon"
        sx={
          {
            display: "inline-flex",
            flexShrink: 0,
            width: size,
            height: size,
            alignItems: "center",
            justifyContent: "center",
            color,
            transform: rotate ? `rotate(${rotate}deg)` : undefined,
            svg: { display: "block", flexShrink: 0, maxWidth: "none" },
            "> div": { display: "flex", flexShrink: 0 },
            "> div > svg": { width: "100%", height: "100%" },
            ...sx
          } as never
        }
      >
        {path ? (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d={path} />
          </svg>
        ) : svg ? (
          <div
            style={{ width: size, height: size }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : null}
      </KitFlex>
    );
  }
);

export const ColorPicker = forwardRef<
  Contract.UIElement,
  Contract.ColorPickerProps
>(function ColorPicker(props, ref) {
  const { value, onChange, ...rest } = props;
  return (
    <KitInput
      {...(rest as Any)}
      ref={ref as never}
      type="color"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
});

export const QRCode = forwardRef<Contract.QRCodeHandle, Contract.QRCodeProps>(
  function QRCode(props, ref: Ref<Contract.QRCodeHandle>) {
    const { value, size, ecLevel, logo: _logo, sx, ...rest } = props;
    const svg = useMemo(() => {
      const code = qrcode(0, ecLevel ?? "M");
      code.addData(value);
      code.make();
      return code.createSvgTag({ cellSize: 1, margin: 0, scalable: true });
    }, [value, ecLevel]);
    useImperativeHandle(
      ref,
      () => ({
        toSVG: () => svg,
        toPNG: async () => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = size;
          const context = canvas.getContext("2d")!;
          const image = new window.Image();
          image.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
          await image.decode();
          context.drawImage(image, 0, 0, size, size);
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve)
          );
          return new Uint8Array(await blob!.arrayBuffer());
        }
      }),
      [svg, size]
    );
    return (
      <KitBox
        {...(rest as Any)}
        {...({ dangerouslySetInnerHTML: { __html: svg } } as Any)}
        sx={{ width: size, height: size, bg: "background", ...sx }}
      />
    );
  }
);

/** The browser's own FormData. */
export const FormData = globalThis.FormData;
