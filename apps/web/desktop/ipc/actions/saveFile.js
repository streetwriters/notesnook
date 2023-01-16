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

import { mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";
import { logger } from "../../logger";
import { resolvePath } from "../utils";

export default (args) => {
  try {
    const { data, filePath } = args;
    if (!data || !filePath) return;

    const resolvedPath = resolvePath(filePath);

    logger.info("Saving file to", resolvedPath);

    mkdirSync(dirname(resolvedPath), { recursive: true });
    writeFileSync(resolvedPath, data);

    logger.info("File saved to", resolvedPath);
  } catch (e) {
    logger.error("Could not save file.", e);
  }
};
