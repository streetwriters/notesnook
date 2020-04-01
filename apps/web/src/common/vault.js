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

  static unlockNote(id, done) {
    showPasswordDialog("unlock_note", password => {
      return db.vault
        .remove(id, password)
        .then(() => true)
        .catch(e => {
          if (e.message === "ERR_WRNG_PWD") return false;
          else console.error(e);
        });
    }).then(res => res && done());
  }

  static openNote(id) {
    return showPasswordDialog("unlock_note", password => {
      return db.vault
        .open(id, password)
        .then(note => {
          return note.content;
        })
        .catch(e => {
          if (e.message === "ERR_WRNG_PwD") return;
          else console.error(e);
        });
    });
  }

  static lockNote(id, done) {
    db.vault
      .add(id)
      .then(done)
      .catch(({ message }) => {
        switch (message) {
          case "ERR_NO_VAULT":
            return Vault.createVault();
          case "ERR_VAULT_LOCKED":
            return Vault.unlockVault();
          default:
            return false;
        }
      })
      .then(result => result && Vault.lockNote(id));
  }
}
export default Vault;
