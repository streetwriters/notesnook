import EventManager from "@streetwriters/notesnook-core/utils/eventmanager";

const GlobalKeyboard = {};

const KeyboardEventManager = new EventManager();

GlobalKeyboard.addEventListener = (name, handler) => {
  KeyboardEventManager.subscribe(name, handler);
};

GlobalKeyboard.removeEventListener = (name, handler) =>
  KeyboardEventManager.unsubscribe(name, handler);

// window.addEventListener("keydown", (e) => {
//   // KeyboardEventManager.publish("keydown", e);
// });

window.addEventListener("keyup", (e) => {
  KeyboardEventManager.publish("keyup", e);
});

export { GlobalKeyboard, KeyboardEventManager };
