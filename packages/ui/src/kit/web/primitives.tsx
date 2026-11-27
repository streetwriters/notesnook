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
  type Ref
} from "react";
import * as ThemeUI from "@theme-ui/components";
import { useTheme } from "@emotion/react";
import qrcode from "qrcode-generator";
import type * as Contract from "../contracts/primitives";
import { legacy } from "./legacy";

export { ThemeScope } from "./theme";

/**
 * On the web the kit's primitives are theme-ui's own components. `legacy`
 * adds nothing to them but the deprecated React Native style prop names,
 * until the last call site has moved off those (plan item 5.1).
 */
export const Box = legacy<typeof Contract.Box>(ThemeUI.Box, {
  className: "nn-box"
});
export const Flex = legacy<typeof Contract.Flex>(ThemeUI.Flex, {
  className: "nn-flex"
});
export const Grid = legacy<typeof Contract.Grid>(ThemeUI.Grid);
export const Text = legacy<typeof Contract.Text>(ThemeUI.Text, {
  className: "nn-text"
});
export const Button = legacy<typeof Contract.Button>(ThemeUI.Button);
export const Label = legacy<typeof Contract.Label>(ThemeUI.Label);
export const Link = legacy<typeof Contract.Link>(ThemeUI.Link, {
  defaults: { target: "_blank", rel: "noreferrer" }
});
export const Image = legacy<typeof Contract.Image>(ThemeUI.Image);
export const Input = legacy<typeof Contract.Input>(ThemeUI.Input);
export const Textarea = legacy<typeof Contract.Textarea>(ThemeUI.Textarea);
export const Checkbox = legacy<typeof Contract.Checkbox>(ThemeUI.Checkbox);
export const Radio = legacy<typeof Contract.Radio>(ThemeUI.Radio);
export const Select = legacy<typeof Contract.Select>(ThemeUI.Select);
export const Switch = legacy<typeof Contract.Switch>(ThemeUI.Switch);
export const Slider = legacy<typeof Contract.Slider>(ThemeUI.Slider, {
  value: "number"
});
export const Progress = legacy<typeof Contract.Progress>(ThemeUI.Progress);
export const Donut = legacy<typeof Contract.Donut>(ThemeUI.Donut);

// Kit-only components: theme-ui has no equivalent, so these keep a web
// version of their own, built on the primitives above.

type Any = Record<string, any>;

export const Icon = forwardRef<Contract.UIElement, Contract.IconProps>(
  function Icon(props, ref) {
    const { path, svg, size: sizeToken = "medium", color, rotate, sx, ...rest } =
      props;
    const theme = useTheme() as Any;
    const size =
      typeof sizeToken === "number"
        ? sizeToken
        : theme.iconSizes?.[sizeToken] ?? 18;
    return (
      <Flex
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
      </Flex>
    );
  }
);

export const ColorPicker = forwardRef<
  Contract.UIElement,
  Contract.ColorPickerProps
>(function ColorPicker(props, ref) {
  const { value, onChange, ...rest } = props;
  return (
    <Input
      {...(rest as Any)}
      ref={ref as never}
      type="color"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
});

export const QRCode = forwardRef<
  Contract.QRCodeHandle,
  Contract.QRCodeProps
>(function QRCode(props, ref: Ref<Contract.QRCodeHandle>) {
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
    <Box
      {...(rest as Any)}
      {...({ dangerouslySetInnerHTML: { __html: svg } } as Any)}
      sx={{ width: size, height: size, bg: "background", ...sx }}
    />
  );
});
