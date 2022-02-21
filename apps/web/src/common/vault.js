import { db } from "../common/db";
import { showPasswordDialog } from "../common/dialog-controller";
import { showToast } from "../utils/toast";

class Vault {
  static async createVault() {
    if (await db.vault.exists()) return false;
    return await showPasswordDialog("create_vault", async ({ password }) => {
      await db.vault.create(password);
      showToast("success", "Vault created.");
      return true;
    });
  }

  static async clearVault() {
    if (!(await db.vault.exists())) return false;
    return await showPasswordDialog("clear_vault", async ({ password }) => {
      try {
        await db.vault.clear(password);
        return true;
      } catch {
        return false;
      }
    });
  }

  static async deleteVault() {
    if (!(await db.vault.exists())) return false;
    return await showPasswordDialog(
      "delete_vault",
      async ({ password, deleteAllLockedNotes }) => {
        if (!(await db.user.verifyPassword(password))) return false;
        await db.vault.delete(!!deleteAllLockedNotes);
        return true;
      }
    );
  }

  static unlockVault() {
    return showPasswordDialog("lock_note", ({ password }) => {
      return db.vault
        .unlock(password)
        .then(() => true)
        .catch(() => false);
    });
  }

  static changeVaultPassword() {
    return showPasswordDialog(
      "change_password",
      async ({ oldPassword, newPassword }) => {
        await db.vault.changePassword(oldPassword, newPassword);
        showToast("success", "Vault password changed.");
        return true;
      }
    );
  }

  static unlockNote(id, type = "unlock_note") {
    return new Promise((resolve) => {
      return showPasswordDialog(type, ({ password }) => {
        return db.vault
          .remove(id, password)
          .then(() => true)
          .catch((e) => {
            console.error(e);
            return false;
          });
      }).then(resolve);
    });
  }

  static lockNote(id) {
    return new Promise(function lock(resolve) {
      db.vault
        .add(id)
        .then(resolve)
        .catch(({ message }) => {
          switch (message) {
            case db.vault.ERRORS.noVault:
              return Vault.createVault();
            case db.vault.ERRORS.vaultLocked:
              return Vault.unlockVault();
            default:
              return false;
          }
        })
        .then((result) => result && lock(resolve));
    });
  }

  static askPassword(action) {
    return showPasswordDialog("ask_vault_password", ({ password }) => {
      return action(password);
    });
  }
}
export default Vault;
