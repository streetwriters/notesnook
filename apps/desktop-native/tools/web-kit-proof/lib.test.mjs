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

import { expect, test } from "vitest";
import { nonImportChanges, switchImports } from "./lib.mjs";

test("repoints theme-ui components and virtuoso, multi-line included", () => {
  const { code, count } = switchImports(
    [
      `import { Flex, Text } from "@theme-ui/components";`,
      `import {`,
      `  Virtuoso,`,
      `  VirtuosoHandle`,
      `} from "react-virtuoso";`,
      `import { useThemeUI } from "@theme-ui/core";`
    ].join("\n")
  );
  expect(count).toBe(2);
  expect(code).toBe(
    [
      `import { Flex, Text } from "@notesnook/ui-kit";`,
      `import {`,
      `  Virtuoso,`,
      `  VirtuosoHandle`,
      `} from "@notesnook/ui-kit";`,
      `import { useThemeUI } from "@theme-ui/core";`
    ].join("\n")
  );
});

test("react-modal's default import becomes the kit's Modal", () => {
  expect(switchImports(`import ReactModal from "react-modal";`).code).toBe(
    `import { Modal as ReactModal } from "@notesnook/ui-kit";`
  );
});

test("leaves a string that only mentions a module alone", () => {
  const src = `const s = "react-modal";`;
  expect(switchImports(src)).toEqual({ code: src, count: 0 });
});

test("import edits are not changes; other edits are listed", () => {
  const before = `import { Flex } from "@theme-ui/components";\nconst a = 1;\nconst b = 2;`;
  const after = `import { Flex } from "@notesnook/ui-kit";\nconst a = 1;\nconst b = 3;`;
  expect(nonImportChanges(before, before.replace("@theme-ui/components", "x"))).toEqual([]);
  expect(nonImportChanges(before, after)).toEqual(["-const b = 2;", "+const b = 3;"]);
});
