import { ToolProps } from "../types";
import { ToolButton } from "../components/tool-button";
import { IconNames } from "../icons";
import { useRefValue } from "../../hooks/use-ref-value";

type TextDirection = "ltr" | "rtl";
type TextDirectionToolProps = ToolProps & {
  direction: TextDirection;
};
function TextDirectionTool(props: TextDirectionToolProps) {
  const { editor, direction, ...toolProps } = props;
  const directionRef = useRefValue(direction);

  return (
    <ToolButton
      {...toolProps}
      onClick={() =>
        editor.current
          ?.chain()
          .focus()
          .setTextDirection(directionRef.current)
          .run()
      }
      toggled={false}
    />
  );
}

export function TextDirection(props: ToolProps) {
  const { editor } = props;
  const { textDirection } = {
    ...editor.getAttributes("paragraph"),
    ...editor.getAttributes("heading"),
  } as { textDirection: TextDirection };

  const newTextDirection: TextDirection =
    textDirection === "ltr" ? "rtl" : "ltr";

  const icon: IconNames = textDirection === "ltr" ? "ltr" : "rtl";

  return (
    <TextDirectionTool direction={newTextDirection} {...props} icon={icon} />
  );
}
