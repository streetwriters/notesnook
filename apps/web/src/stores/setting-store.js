import createStore from "../common/store";
import Config from "../utils/config";
import BaseStore from "./index";

class SettingStore extends BaseStore {
  encryptBackups = Config.get("encryptBackups", false);

  setEncryptBackups = (encryptBackups) => {
    this.set((state) => (state.encryptBackups = encryptBackups));
    Config.set("encryptBackups", encryptBackups);
  };

  toggleEncryptBackups = () => {
    const encryptBackups = this.get().encryptBackups;
    this.setEncryptBackups(!encryptBackups);
  };
}

/**
 * @type {[import("zustand").UseStore<SettingStore>, SettingStore]}
 */
const [useStore, store] = createStore(SettingStore);
export { useStore, store };
