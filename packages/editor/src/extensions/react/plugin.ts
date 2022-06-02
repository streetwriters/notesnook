import { Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

export type StateChangeHandler = (fromPos: number, toPos: number) => any;

export class ReactNodeViewState {
  private changeHandlers: StateChangeHandler[] = [];

  constructor() {
    this.changeHandlers = [];
  }

  subscribe(cb: StateChangeHandler) {
    this.changeHandlers.push(cb);
  }

  unsubscribe(cb: StateChangeHandler) {
    this.changeHandlers = this.changeHandlers.filter((ch) => ch !== cb);
  }

  notifyNewSelection(fromPos: number, toPos: number) {
    this.changeHandlers.forEach((cb) => cb(fromPos, toPos));
  }
}

export const stateKey = new PluginKey("reactNodeView");

export const plugin = new Plugin({
  state: {
    init() {
      return new ReactNodeViewState();
    },
    apply(_tr, pluginState: ReactNodeViewState) {
      return pluginState;
    },
  },
  key: stateKey,
  view: (view: EditorView) => {
    const pluginState: ReactNodeViewState = stateKey.getState(view.state);

    return {
      update: (view: EditorView) => {
        const { from, to } = view.state.selection;
        pluginState.notifyNewSelection(from, to);
      },
    };
  },
});

const plugins = () => [plugin];

export default plugins;
