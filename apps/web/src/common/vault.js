import { db } from "../common";
import { showPasswordDialog } from "../components/dialogs/passworddialog";
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

  static unlockVault() {
    return showPasswordDialog("unlock_vault", ({ password }) => {
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

  static unlockNote(id) {
    return new Promise((resolve) => {
      return showPasswordDialog("unlock_note", ({ password }) => {
        return db.vault
          .remove(id, password)
          .then(() => true)
          .catch((e) => {
            if (e.message === db.vault.ERRORS.wrongPassword) return false;
            else console.error(e);
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
}
export default Vault;
