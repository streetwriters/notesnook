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

import { ThemeUIStyleObject } from "@theme-ui/core";

const defaultVariant: ThemeUIStyleObject = {
  color: "paragraph",
  fontFamily: "body"
};

const heading: ThemeUIStyleObject = {
  variant: "text.default",
  color: "heading",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "heading"
};

const title: ThemeUIStyleObject = {
  variant: "text.heading",
  color: "heading",
  fontSize: "title",
  fontWeight: "bold"
};

const subtitle: ThemeUIStyleObject = {
  variant: "text.heading",
  color: "heading",
  fontSize: "subtitle",
  fontWeight: "bold"
};

const body: ThemeUIStyleObject = { variant: "text.default", fontSize: "body" };

const subBody: ThemeUIStyleObject = {
  variant: "text.default",
  fontSize: "subBody",
  color: "var(--paragraph-secondary)"
};

const error: ThemeUIStyleObject = {
  variant: "text.default",
  fontSize: "subBody",
  color: "var(--paragraph-error)"
};

export const textVariants = {
  default: defaultVariant,
  heading,
  title,
  subtitle,
  body,
  subBody,
  error
};
