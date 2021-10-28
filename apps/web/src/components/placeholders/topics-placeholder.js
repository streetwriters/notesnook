import Placeholder from "./index";
import { Plus } from "../icons";
import { hashNavigate } from "../../navigation";

function TopicsPlaceholder() {
  return (
    <Placeholder
      id="topic"
      text="You have not added any topics yet."
      callToAction={{
        text: "Add a topic",
        icon: Plus,
        onClick: () => hashNavigate("/topics/create"),
      }}
    />
  );
}
export default TopicsPlaceholder;
