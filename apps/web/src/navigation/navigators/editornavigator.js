import Editor from "../../components/editor";
import SplitEditor from "../../components/spliteditor";
import Navigator from "../index";
import { createRoute } from "../routes";
import Unlock from "../../components/unlock";

const routes = {
  ...createRoute("editor", Editor),
  ...createRoute("unlock", Unlock),
  ...createRoute("split", SplitEditor),
};

const EditorNavigator = new Navigator("EditorNavigator", routes, {
  default: "editor",
  persist: false,
});
export default EditorNavigator;
