import Placeholder from "./index";
import * as Icon from "../icons";
import { hashNavigate } from "../../navigation";

function NotesPlaceholder() {
  return (
    <Placeholder
      id="note"
      title="Your notes"
      text="You have not made any notes yet."
      callToAction={{
        text: "Make your first note",
        icon: Icon.Plus,
        onClick: () =>
          hashNavigate("/notes/create", { replace: true, addNonce: true })
      }}
    />
  );
}
export default NotesPlaceholder;
