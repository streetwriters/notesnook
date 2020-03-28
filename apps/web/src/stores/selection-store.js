import createStore from "../common/store";
import BaseStore from "./index";

class SelectionStore extends BaseStore {
  selectedItems = [];
  shouldSelectAll = false;
  isSelectionMode = false;

  toggleSelectionMode = toggleState => {
    this.set(state => {
      const isSelectionMode =
        toggleState !== undefined ? toggleState : !state.isSelectionMode;
      state.isSelectionMode = isSelectionMode;
      state.shouldSelectAll = false;
      state.selectedItems = [];
    });
  };

  selectItem = item => {
    const index = this.selectedItems.findIndex(v => item.id === v.id);
    this.set(state => {
      if (index >= 0) {
        state.selectedItems.splice(index, 1);
      } else {
        state.selectedItems.push(item);
      }
    });
    if (this.selectedItems.length <= 0) {
      this.toggleSelectionMode();
    }
  };

  setSelectedItems(items) {
    this.set(state => (state.selectedItems = items));
  }

  selectAll() {
    if (!this.isSelectionMode) return;
    this.set(state => (state.shouldSelectAll = true));
  }
}

const [useStore, store] = createStore(SelectionStore);

export { useStore, store };
