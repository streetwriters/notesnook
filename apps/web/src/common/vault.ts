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

import { db } from "./db";
import { showPasswordDialog } from "../dialogs/password-dialog";
import { showToast } from "../utils/toast";
import { VAULT_ERRORS } from "@notesnook/core";
import { strings } from "@notesnook/intl";

class Vault {
  static async createVault() {
    if (await db.vault.exists()) return false;
    return showPasswordDialog({
      title: strings.createVault(),
      subtitle: strings.createVaultDesc(),
      inputs: {
        password: { label: strings.password(), autoComplete: "new-password" }
      },
      validate: async ({ password }) => {
        await db.vault.create(password);
        showToast("success", strings.vaultCreated());
        return true;
      }
    });
  }

  static async clearVault() {
    if (!(await db.vault.exists())) return false;

    return showPasswordDialog({
      title: strings.clearVault(),
      subtitle: strings.clearVaultDesc(),
      inputs: {
        password: {
          label: strings.password(),
          autoComplete: "current-password"
        }
      },
      validate: async ({ password }) => {
        await db.vault.clear(password);
        return true;
      }
    });
  }

  static async deleteVault() {
    if (!(await db.vault.exists())) return false;
    const result = await showPasswordDialog({
      title: strings.deleteVault(),
      subtitle: strings.deleteVaultDesc(),
      inputs: {
        password: {
          label: strings.accountPassword(),
          autoComplete: "current-password"
        }
      },
      checks: {
        deleteAllLockedNotes: {
          text: strings.deleteAllNotes(),
          default: false
        }
      },
      validate: ({ password }) => {
        return db.user.verifyPassword(password);
      }
    });
    if (result) {
      await db.vault.delete(result.deleteAllLockedNotes);
      return true;
    }
    return false;
  }

  static unlockVault() {
    return showPasswordDialog({
      title: strings.unlockVault(),
      subtitle: strings.unlockVaultDesc(),
      inputs: {
        password: {
          label: strings.password(),
          autoComplete: "current-password"
        }
      },
      validate: ({ password }) => {
        return db.vault.unlock(password).catch(() => false);
      }
    });
  }

  static changeVaultPassword() {
    return showPasswordDialog({
      title: strings.changeVaultPassword(),
      subtitle: strings.changeVaultPasswordDesc(),
      inputs: {
        oldPassword: {
          label: strings.oldPassword(),
          autoComplete: "current-password"
        },
        newPassword: {
          label: strings.newPassword(),
          autoComplete: "new-password"
        }
      },
      validate: async ({ oldPassword, newPassword }) => {
        await db.vault.changePassword(oldPassword, newPassword);
        showToast("success", strings.passwordChangedSuccessfully());
        return true;
      }
    });
  }

  static unlockNote(id: string) {
    return showPasswordDialog({
      title: strings.unlockNote(),
      subtitle: strings.unlockNoteDesc(),
      inputs: {
        password: {
          label: strings.password(),
          autoComplete: "current-password"
        }
      },
      validate: async ({ password }) => {
        return db.vault
          .remove(id, password)
          .then(() => true)
          .catch((e) => {
            console.error(e);
            return false;
          });
      }
    });
  }

  static lockNote(id: string): Promise<boolean> {
    return db.vault
      .add(id)
      .then(() => true)
      .catch(({ message }) => {
        switch (message) {
          case VAULT_ERRORS.noVault:
            return Vault.createVault().then((result) =>
              result ? Vault.lockNote(id) : false
            );
          case VAULT_ERRORS.vaultLocked:
            return Vault.unlockVault().then((result) =>
              result ? Vault.lockNote(id) : false
            );
          default:
            showToast("error", message);
            console.error(message);
            return false;
        }
      });
  }

  static askPassword(action: (password: string) => Promise<boolean>) {
    return showPasswordDialog({
      title: strings.unlockVault(),
      subtitle: strings.unlockVaultDesc(),
      inputs: {
        password: {
          label: strings.password(),
          autoComplete: "current-password"
        }
      },
      validate: async ({ password }) => {
        return action(password);
      }
    });
  }

  static async lockVault() {
    await db.vault.lock();
    showToast("success", strings.vaultLocked());
  }
}
export default Vault;
