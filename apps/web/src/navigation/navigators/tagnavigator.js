import { Notes, Tags } from "../../views";
import Navigator from "../index";
import { createRoute } from "../routes";
import SelectionModeOptions from "../../common/selectionoptions";

const routes = {
  ...createRoute("tags", Tags, { title: "Tags" }),
  ...createRoute("notes", Notes, { options: SelectionModeOptions.NotesOptions })
};
const TagNavigator = new Navigator("TagNavigator", routes, {
  backButtonEnabled: true
});
export default TagNavigator;
