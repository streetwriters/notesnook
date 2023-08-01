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

import { writeFile } from "fs/promises";
import path from "path";
import tsj from "ts-json-schema-generator";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generator = tsj.createGenerator({
  path: path.join(__dirname, "..", "src", "theme-engine", "types.ts"),
  tsconfig: path.join(__dirname, "..", "tsconfig.json"),
  type: "ThemeDefinition"
});

const schema = generator.createSchema("ThemeDefinition");

delete schema.definitions.ThemeDefinition.properties.codeBlockCSS;
const required = schema.definitions.ThemeDefinition.required;
required.splice(required.indexOf("codeBlockCSS"), 1);

await writeFile(`v1.schema.json`, JSON.stringify(schema, undefined, 2));
