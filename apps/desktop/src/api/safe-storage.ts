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
import { safeStorage } from "electron";
import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

export const safeStorageRouter = t.router({
  isEncryptionAvailable: t.procedure.query(() => {
    return (
      !process.env.PORTABLE_EXECUTABLE_DIR &&
      safeStorage.isEncryptionAvailable()
    );
  }),
  /**
   * Takes a string and returns an encrypted base64 string
   */
  encryptString: t.procedure.input(z.string()).query(({ input }) => {
    return safeStorage.encryptString(input).toString("base64");
  }),
  /**
   * Takes an encrypted base64 string and returns a string
   */
  decryptString: t.procedure.input(z.string()).query(({ input }) => {
    return safeStorage.decryptString(Buffer.from(input, "base64"));
  })
});
