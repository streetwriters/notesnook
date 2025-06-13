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

import { strings } from "@notesnook/intl";
import { showPasswordDialog } from "../dialogs/password-dialog";
import { useStore as useNotebookStore } from "../stores/notebook-store";
import { db } from "./db";
import { showToast } from "../utils/toast";

export class NotebookLock {
  static async lock(notebookId: string) {
    return showPasswordDialog({
      title: "Lock notebook",
      subtitle: "Set a password to lock this notebook.",
      inputs: {
        password: {
          label: strings.password(),
          autoComplete: "current-password"
        }
      },
      validate: async ({ password }) => {
        if (password === "") return false;

        await db.notebooks.lock(notebookId, password);
        useNotebookStore.getState().refresh();
        showToast("success", "Notebook locked");
        return true;
      }
    });
  }

  static async unlock(notebookId: string) {
    showPasswordDialog({
      title: "Unlock notebook",
      subtitle: "Enter account password to unlock this notebook.",
      inputs: {
        password: {
          label: strings.accountPassword(),
          autoComplete: "current-password"
        }
      },
      validate: async ({ password }) => {
        const valid = await db.user.verifyPassword(password);
        if (!valid) {
          showToast("error", "Invalid password");
          return false;
        }
        await db.notebooks.unlock(notebookId);
        useNotebookStore.getState().refresh();
        showToast("success", "Notebook unlocked");
        return true;
      }
    });
  }
}
