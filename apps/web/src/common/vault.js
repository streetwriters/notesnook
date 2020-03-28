import { db } from "../common";
import { showPasswordDialog } from "../components/dialogs/passworddialog";

class Vault {
  static createVault() {
    return showPasswordDialog("create_vault", password =>
      db.vault.create(password)
    );
  }

  static unlockVault() {
    return showPasswordDialog("unlock_vault", password => {
      return db.vault
        .unlock(password)
        .then(() => true)
        .catch(() => false);
    });
  }
}
export default Vault;
