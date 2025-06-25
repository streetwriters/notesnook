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
  borderRadius: "default",
  border: "none",
  width: "auto",
  mx: "2px",
  outline: "1.5px solid var(--border)",
  fontFamily: "body",
  fontWeight: "body",
  fontSize: "input",
  color: "paragraph",
  ":-webkit-autofill": {
    WebkitTextFillColor: "var(--paragraph)",
    caretColor: "var(--paragraph)",
    fontSize: "inherit"
  },
  ":focus": {
    outline: "2px solid var(--accent)"
  },
  ":hover:not(:focus)": {
    outline: "1.5px solid var(--accent)"
  },
  "::placeholder": {
    color: "placeholder"
  }
};

const borderless: ThemeUIStyleObject = {
  variant: "forms.input",
  outline: "none",
  boxShadow: "none",
  ":-webkit-autofill": {
    WebkitTextFillColor: "var(--paragraph)",
    caretColor: "var(--paragraph)",
    fontSize: "inherit"
  },
  ":focus": {
    bg: "var(--background-secondary)"
  },
  ":hover:not(:focus)": {
    outline: "var(--background-secondary)"
  },
  "::placeholder": {
    color: "placeholder"
  }
};

const clean: ThemeUIStyleObject = {
  variant: "forms.input",
  outline: "none",
  boxShadow: "none",
  ":focus": {
    boxShadow: "none"
  },
  ":hover:not(:focus)": {
    boxShadow: "none"
  }
};

const error: ThemeUIStyleObject = {
  variant: "forms.input",
  outline: "1.5px solid var(--accent-error)",
  ":focus": {
    outline: "2px solid var(--accent-error)"
  },
  ":hover:not(:focus)": {
    outline: "1.5px solid var(--accent-error)"
  }
};

const radio: ThemeUIStyleObject = {
  "input:focus ~ &": {
    backgroundColor: `border-secondary`
  }
};

export const inputVariants = {
  input: defaultVariant,
  borderless,
  error,
  clean,
  radio
};
