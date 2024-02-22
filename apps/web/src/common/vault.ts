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
import { showPasswordDialog } from "./dialog-controller";
import { showToast } from "../utils/toast";
import { VAULT_ERRORS } from "@notesnook/core/dist/api/vault";

class Vault {
  static async createVault() {
    if (await db.vault.exists()) return false;
    return showPasswordDialog({
      title: "Create your vault",
      subtitle: "A vault stores your notes in a password-encrypted storage.",
      inputs: {
        password: { label: "Password", autoComplete: "new-password" }
      },
      validate: async ({ password }) => {
        await db.vault.create(password);
        showToast("success", "Vault created.");
        return true;
      }
    });
  }

  static async clearVault() {
    if (!(await db.vault.exists())) return false;

    return showPasswordDialog({
      title: "Clear your vault",
      subtitle:
        "Enter vault password to unlock and remove all notes from the vault.",
      inputs: {
        password: { label: "Password", autoComplete: "current-password" }
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
      title: "Delete your vault",
      subtitle: "Enter your account password to delete your vault.",
      inputs: {
        password: { label: "Password", autoComplete: "current-password" }
      },
      checks: {
        deleteAllLockedNotes: {
          text: "Delete all locked notes?",
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
      title: "Unlock vault",
      subtitle: "Please enter your vault password to continue.",
      inputs: {
        password: { label: "Password", autoComplete: "current-password" }
      },
      validate: ({ password }) => {
        return db.vault.unlock(password).catch(() => false);
      }
    });
  }

  static changeVaultPassword() {
    return showPasswordDialog({
      title: "Change vault password",
      subtitle: "All locked notes will be re-encrypted with the new password.",
      inputs: {
        oldPassword: {
          label: "Old password",
          autoComplete: "current-password"
        },
        newPassword: { label: "New password", autoComplete: "new-password" }
      },
      validate: async ({ oldPassword, newPassword }) => {
        await db.vault.changePassword(oldPassword, newPassword);
        showToast("success", "Vault password changed.");
        return true;
      }
    });
  }

  static unlockNote(id: string) {
    return showPasswordDialog({
      title: "Unlock note",
      subtitle: "Your note will be unencrypted and removed from the vault.",
      inputs: {
        password: { label: "Password", autoComplete: "current-password" }
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
            return Vault.createVault().then(() => Vault.lockNote(id));
          case VAULT_ERRORS.vaultLocked:
            return Vault.unlockVault().then(() => Vault.lockNote(id));
          default:
            showToast("error", message);
            console.error(message);
            return false;
        }
      });
  }

  static askPassword(action: (password: string) => Promise<boolean>) {
    return showPasswordDialog({
      title: "Unlock vault",
      subtitle: "Please enter your vault password to continue.",
      inputs: {
        password: { label: "Password", autoComplete: "current-password" }
      },
      validate: async ({ password }) => {
        return action(password);
      }
    });
  }
}
export default Vault;
