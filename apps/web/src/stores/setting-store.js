import createStore from "../common/store";
import Config from "../utils/config";
import BaseStore from "./index";

class SettingStore extends BaseStore {
  encryptBackups = Config.get("encryptBackups", false);
  doubleSpacedLines = Config.get("doubleSpacedLines", true);

  setEncryptBackups = (encryptBackups) => {
    this.set((state) => (state.encryptBackups = encryptBackups));
    Config.set("encryptBackups", encryptBackups);
  };

  toggleEncryptBackups = () => {
    const encryptBackups = this.get().encryptBackups;
    this.setEncryptBackups(!encryptBackups);
  };

  toggleDoubleSpacedLines = () => {
    const doubleSpacedLines = this.get().doubleSpacedLines;
    this.set((state) => (state.doubleSpacedLines = !doubleSpacedLines));
    Config.set("doubleSpacedLines", !doubleSpacedLines);
  };
}

/**
 * @type {[import("zustand").UseStore<SettingStore>, SettingStore]}
 */
const [useStore, store] = createStore(SettingStore);
export { useStore, store };
