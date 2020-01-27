import { askSign } from "../components/dialogs";
import * as Icon from "react-feather";

const signIn = () =>
  askSign(
    Icon.LogIn,
    "Login",
    "Are you sure you want to delete this note? It will be moved to trash and permanently deleted after 7 days."
  ).then(res => {
    if (res) {
    }
  });

export default signIn;
