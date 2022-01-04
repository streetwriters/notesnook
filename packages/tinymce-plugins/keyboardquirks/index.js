const { addPluginToPluginManager } = require("../utils");

const ZERO_WIDTH_NOBREAK_SPACE = 65279;
/**
 * @param {import("tinymce").Editor} editor
 */
function register(editor) {
  androidBackspaceKeyQuirk(editor);
  androidGboardEnterKeyQuirk(editor);
  androidSwiftKeyFormattingQuirk(editor);
}

/**
 * => Detected & tested on:
 * Google Chrome Android with SwiftKey Keyboard
 *
 * => Quirk details:
 * On Android, when caret is at the end of the first word
 * of a new line, pressing a non alphanumeric character (e.g. space)
 * key removes the formatting of the word and moves the caret
 * back by one position.
 *
 * => Example of the bug (| = caret, _ = bold):
 *  -> Before pressing space:
 *      1) Some text
 *      2) Some text on second _line_|
 *  -> After pressing space:
 *      1) Some text
 *      2) Some text on second lin| e
 *
 * => Reason why this happens:
 * I haven't been able to figure out why this happens. I was able to reproduce
 * this same bug in other apps like Canva as well.
 *
 * However, this bug is specific to SwiftKey Keyboard. Gboard has no such issue.
 *
 * => How the fix works:
 * The fix is hacky, obviously. I found out that if we remove the ZERO_WIDTH_SPACE
 * character TinyMCE puts when you start typing with a format turned on, the issue
 * no longer occurs.
 *
 * To make that happen, we listen to SelectionChange event and watch for any tag with
 * ZERO_WIDTH_SPACE in the beginning. We can't remove the ZERO_WIDTH_SPACE immediately
 * because that would move the selection to the previous line. Instead we wait until
 * the user inputs the first character.
 *
 * As soon as the first character is inserted, we remove the ZERO_WIDTH_SPACE and move
 * selection forward by one character.
 *
 * => Interesting information:
 * I could not detect this bug in Prosemirror. No idea why.
 */
function androidSwiftKeyFormattingQuirk(editor) {
  if (!global.tinymce.Env.os.isAndroid()) return;

  editor.on("SelectionChange", () => {
    const node = editor.selection.getNode();
    if (
      node.textContent.length > 1 &&
      node.textContent.charCodeAt(0) === ZERO_WIDTH_NOBREAK_SPACE
    ) {
      const rng = editor.selection.getRng();
      node.textContent = node.textContent.substring(1);
      rng.setStart(node, rng.startOffset + 1);
      editor.selection.setRng(rng);
    }
  });
}

/**
 * => Detected & tested on:
 * Google Chrome Android with Gboard/Google Keyboard
 *
 * => Quirk details:
 * On Android, when caret is at the end of the line
 * (and also at end of the last word), pressing the Enter
 * key adds a new line but the caret does not move to the
 * newly created line. This does not happen if the caret
 * is in any other position.
 *
 * => Example of the bug (| = caret, _ = underline):
 *  -> Before pressing enter:
 *      1) Some text
 *      2) Some text on second _line_|
 *  -> After pressing enter:
 *      1) Some text
 *      2) Some text on second _line_|
 *      3) <empty line>
 *
 * => Reason why this happens:
 * This happens due to the Composition API in Google Chrome Android.
 * Normally when you press any key, a keyup & keydown events are sent
 * with various keycodes. However, on Google Chrome Android, these key codes
 * are always Unidentified/229. Because TinyMCE is based on keyup/keydown
 * events and it performs different actions based on the keycodes, these actions
 * are completely skipped because the keycode is always 229.
 *
 * However, this bug is specific to Google Keyboard due to it's spellcheker
 * overriding the Enter key when it's at the end of a "selected" word.
 *
 * => How the fix works:
 * As described above there is no way to detect which key is pressed. Thankfully,
 * the 'beforeinput' event provides some information into what is actually going
 * to happen. More specifically, event.inputType === "insertCompositionText" when
 * and insertion key is pressed. To precisely detect if Enter was pressed we check
 * the event.data property.
 *
 * Now the sequence of events is thus:
 * 1. keydown
 * 2. beforeinput
 * 3. keyup
 *
 * To move the cursor to the newly created node, we first need to detect & select
 * the node that was created. This is not a simple task.
 *
 * After the Enter key is detected in 'beforeinput' event, we set a flag (moveSelectionToNextNode)
 * to true. We cannot change selection at this point because the editor hasn't yet added the new
 * node. So in the 'keyup' event (where the new node has been inserted), we use DOM logic to
 * select the nextSibling of the currently selected node (which should be the new node). Changing
 * the selection after that is trivial.
 *
 * => Interesting information:
 * I could not detect this bug in Prosemirror. Maybe because they have a
 * custom eventing system in place? Or maybe they provide a fix for this
 * bug built in.
 */
function androidGboardEnterKeyQuirk(editor) {
  if (!global.tinymce.Env.os.isAndroid()) return;

  const inputState = {};
  editor.on("beforeinput", (e) => {
    if (e.inputType === "insertCompositionText") {
      if (e.data && e.data.endsWith("\n") && inputState.isKeyUnidentified) {
        inputState.isKeyUnidentified = null;
        inputState.forceMoveSelectionToNextNode = true;
      }
    } else {
      inputState.isKeyUnidentified = null;
      inputState.forceMoveSelectionToNextNode = false;
    }
  });

  editor.on("keydown", (e) => {
    inputState.isKeyUnidentified = e.key === "Unidentified";
  });

  editor.on("keyup", (e) => {
    if (inputState.forceMoveSelectionToNextNode) {
      inputState.forceMoveSelectionToNextNode = false;
      e.preventDefault();

      const range = editor.selection.getRng();

      let sibling;
      let parentElement = range.startContainer.parentElement;

      while (
        parentElement.parentElement &&
        !parentElement.parentElement.classList.contains("mce-content-body")
      ) {
        parentElement = parentElement.parentElement;
      }
      sibling = parentElement.nextElementSibling;
      if (!sibling) return;
      editor.selection.setCursorLocation(sibling, 0);
    }
  });
}

/**
 * => Detected & tested on:
 * Google Chrome Android with SwiftKey Keyboard
 *
 * => Quirk details:
 * On Android, when caret is at the beginning
 * of a line (and there is content before & after the current caret position),
 * pressing backspace erases the current line but also moves
 * the caret by 1 offset.
 *
 * => Example of the bug (| = caret):
 *  -> Before pressing backspace:
 *      1) Some text
 *      2) |Some text one line no. 2
 *  -> After pressing backspace:
 *      1) Some textS|ome text one line no. 2
 *
 * => Reason why this happens:
 * This happens due to the Composition API in Google Chrome Android.
 * Normally when you press any key, a keyup & keydown events are sent
 * with various keycodes. However, on Google Chrome Android, these key codes
 * are always Unidentified/229. Because TinyMCE is based on keyup/keydown
 * events and it performs different actions based on the keycodes, these actions
 * are completely skipped because the keycode is always 229.
 *
 * => How the fix works:
 * As described above there is no way to detect which key is pressed. Thankfully,
 * the 'beforeinput' event provides some information into what is actually going
 * to happen. More specifically, event.inputType === "deleteContentBackward" when
 * the backspace key is pressed.
 *
 * Now the sequence of events is thus:
 * 1. keydown
 * 2. beforeinput
 * 3. keyup
 *
 * To make sure we preserve the caret position before and after the backspace key
 * is pressed, we store the selection offset in 'beforeinput' event. Interestingly,
 * the caret position is correct until 'keyup' is raised. The fix is simple after that:
 * we just move the caret back to where it was in the 'beforeinput' event.
 *
 * => Interesting information:
 * I could not detect this bug in Prosemirror. Maybe because they have a
 * custom eventing system in place? Or maybe they provide a fix for this
 * bug built in.
 */
function androidBackspaceKeyQuirk(editor) {
  if (!global.tinymce.Env.os.isAndroid()) return;

  const inputState = {
    previousSelection: {},
    selection: {},
    forcePreserveSelection: false,
  };

  editor.on("beforeinput", (e) => {
    if (e.inputType === "deleteContentBackward") {
      if (inputState.previousSelection.offset !== 0) return;

      const range = editor.selection.getRng();
      inputState.selection = {
        container: range.startContainer,
        offset: range.startOffset,
      };

      // Weird behavior: tinymce removes 1 (and only 1) trailing whitespace.
      // It doesn't matter if there are more than 1. So we need to account for that.
      if (range.startContainer.textContent.endsWith(" ")) {
        inputState.selection.offset -= 1;
      }

      inputState.forcePreserveSelection = true;
    } else {
      inputState.selection = {};
      inputState.forcePreserveSelection = false;
    }
  });

  editor.on("keydown", (e) => {
    const range = editor.selection.getRng();
    inputState.previousSelection = {
      offset: range.startOffset,
      container: range.startContainer,
    };
  });

  editor.on("keyup", (e) => {
    if (inputState.forcePreserveSelection) {
      inputState.forcePreserveSelection = false;
      e.preventDefault();

      const range = editor.selection.getRng();
      range.setStart(
        inputState.selection.container,
        inputState.selection.offset
      );
      range.setEnd(inputState.selection.container, inputState.selection.offset);
    }
  });
}

(function init() {
  addPluginToPluginManager("keyboardquirks", register);
})();
