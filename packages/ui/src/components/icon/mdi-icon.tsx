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

import * as React from "react";
import { CSSProperties } from "react";

export interface IconProps {
  className?: string;
  id?: string;
  path: string;
  title?: string | null;
  description?: string | null;
  size?: number | string | null;
  color?: string | null;
  horizontal?: boolean;
  vertical?: boolean;
  rotate?: number;
  spin?: boolean | number;
  style?: CSSProperties;
  inStack?: boolean;
}

let idCounter = 0;

export const MDIIcon = React.forwardRef<SVGSVGElement, IconProps>(
  function MDIIcon(
    {
      path,
      id = ++idCounter,
      title = null,
      description = null,
      size = null,
      color = "currentColor",
      horizontal = false,
      vertical = false,
      rotate = 0,
      spin = false,
      style = {} as CSSProperties,
      inStack = false,
      ...rest
    },
    ref
  ) {
    const pathStyle: any = {};
    const transform = [];
    if (size !== null) {
      if (inStack) {
        transform.push(`scale(${size})`);
      } else {
        style.width = typeof size === "string" ? size : `${size * 1.5}rem`;
        style.height = style.width;
      }
    }
    if (horizontal) {
      transform.push("scaleX(-1)");
    }
    if (vertical) {
      transform.push("scaleY(-1)");
    }
    if (rotate !== 0) {
      transform.push(`rotate(${rotate}deg)`);
    }
    if (color !== null) {
      pathStyle.fill = color;
    }
    const pathElement = (
      <path d={path} style={pathStyle} {...((inStack ? rest : {}) as any)} />
    );
    let transformElement = pathElement;
    if (transform.length > 0) {
      style.transform = transform.join(" ");
      style.transformOrigin = "center";
      if (inStack) {
        transformElement = (
          <g style={style}>
            {pathElement}
            <rect width="24" height="24" fill="transparent" />
          </g>
        );
      }
    }
    let spinElement = transformElement;
    const spinSec = spin === true || typeof spin !== "number" ? 2 : spin;
    let inverse = !inStack && (horizontal || vertical);
    if (spinSec < 0) {
      inverse = !inverse;
    }
    if (spin) {
      spinElement = (
        <g
          style={{
            animation: `spin${inverse ? "-inverse" : ""} linear ${Math.abs(
              spinSec
            )}s infinite`,
            transformOrigin: "center"
          }}
        >
          {transformElement}
          {!(horizontal || vertical || rotate !== 0) && (
            <rect width="24" height="24" fill="transparent" />
          )}
        </g>
      );
    }
    if (inStack) {
      return spinElement;
    }
    let ariaLabelledby;
    const labelledById = `icon_labelledby_${id}`;
    const describedById = `icon_describedby_${id}`;
    let role;
    if (title) {
      ariaLabelledby = description
        ? `${labelledById} ${describedById}`
        : labelledById;
    } else {
      role = "presentation";
      if (description) {
        throw new Error("title attribute required when description is set");
      }
    }
    return (
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        style={style}
        role={role}
        aria-labelledby={ariaLabelledby}
        {...rest}
      >
        {title && <title id={labelledById}>{title}</title>}
        {description && <desc id={describedById}>{description}</desc>}
        {!inStack &&
          spin &&
          (inverse ? (
            <style>
              {
                "@keyframes spin-inverse { from { transform: rotate(0deg) } to { transform: rotate(-360deg) } }"
              }
            </style>
          ) : (
            <style>
              {
                "@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }"
              }
            </style>
          ))}
        {spinElement}
      </svg>
    );
  }
);
