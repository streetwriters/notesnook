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

import { RouteContainerButtons } from "../components/route-container";

export type RouteResult = {
  key: string;
  type: "notes" | "notebooks" | "reminders" | "trash" | "tags";
  title?: string | (() => Promise<string | undefined>);
  component:
    | ((props?: any) => JSX.Element | null)
    | React.ReactNode
    | React.MemoExoticComponent<React.FunctionComponent>;
  props?: any;
  buttons?: RouteContainerButtons;
  noCache?: boolean;
};

export function isRouteResult(obj: any): obj is RouteResult {
  return (
    !!obj &&
    typeof obj === "object" &&
    "key" in obj &&
    "type" in obj &&
    "component" in obj
  );
}

type IsParameter<Part> = Part extends `:${infer Parameter}?`
  ? Parameter
  : Part extends `:${infer Parameter}`
  ? Parameter
  : never;

type FilteredParts<Path> = Path extends `${infer PartA}/${infer PartB}`
  ? IsParameter<PartA> | FilteredParts<PartB>
  : IsParameter<Path>;

type ReplaceParameter<Part> = Part extends `:${string}` ? string : Part;

export type ReplaceParametersInPath<Path> =
  Path extends `${infer PartA}/${infer PartB}`
    ? `${ReplaceParameter<PartA>}/${ReplaceParametersInPath<PartB>}`
    : ReplaceParameter<Path>;

export type Params<Path> = {
  [Key in FilteredParts<Path>]: string;
};

export type Routes<T extends string> = {
  [Path in T]: (
    params: Params<Path>
  ) => boolean | React.ReactNode | RouteResult | void;
};

export function defineRoutes<T extends string>(routes: Routes<T>): Routes<T> {
  return routes;
}
