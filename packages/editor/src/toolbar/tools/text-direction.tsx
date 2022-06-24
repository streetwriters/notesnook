import { ToolProps } from "../types";
import { ToolButton } from "../components/tool-button";

type TextDirectionToolProps = ToolProps & {
  direction: "ltr" | "rtl";
};
function TextDirectionTool(props: TextDirectionToolProps) {
  const { editor, direction, ...toolProps } = props;

  return (
    <ToolButton
      {...toolProps}
      onClick={() =>
        editor.current?.chain().focus().setTextDirection(direction).run()
      }
      toggled={editor.isActive({ textDirection: direction })}
    />
  );
}

export function RightToLeft(props: ToolProps) {
  return <TextDirectionTool direction="rtl" {...props} />;
}

export function LeftToRight(props: ToolProps) {
  return <TextDirectionTool direction="ltr" {...props} />;
}
