import { Notebooks, Notes, Topics } from "../../views";
import Navigator from "../index";
import { createRoute } from "../routes";
import SelectionModeOptions from "../../common/selectionoptions";

const routes = {
  ...createRoute("notebooks", Notebooks, { title: "Notebooks" }),
  ...createRoute("topics", Topics, {
    options: SelectionModeOptions.TopicOptions
  }),
  ...createRoute("notes", Notes, { options: SelectionModeOptions.NotesOptions })
};
const NotebookNavigator = new Navigator("NotebookNavigator", routes, {
  backButtonEnabled: true
});
export default NotebookNavigator;
