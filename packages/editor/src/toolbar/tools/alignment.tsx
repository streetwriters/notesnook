import { ToolProps } from "../types";
import { ToolButton } from "../components/tool-button";
import { useRefValue } from "../../hooks/use-ref-value";
import { IconNames } from "../icons";

type Alignment = "left" | "right" | "center" | "justify";
type AlignmentToolProps = ToolProps & {
  alignment: Alignment;
};
function AlignmentTool(props: AlignmentToolProps) {
  const { editor, alignment, ...toolProps } = props;
  const alignmentRef = useRefValue(alignment);

  return (
    <ToolButton
      {...toolProps}
      onClick={() => {
        editor.current
          ?.chain()
          .focus()
          .setTextAlign(alignmentRef.current)
          .run();
      }}
      toggled={false}
    />
  );
}

export function Alignment(props: ToolProps) {
  const { editor } = props;
  const { textAlign } = {
    ...editor.getAttributes("paragraph"),
    ...editor.getAttributes("heading"),
  } as { textAlign: Alignment };

  const newAlignment: Alignment =
    textAlign === "left"
      ? "center"
      : textAlign === "center"
      ? "right"
      : textAlign === "right"
      ? "justify"
      : textAlign === "justify"
      ? "left"
      : "left";

  const icon: IconNames =
    textAlign === "center"
      ? "alignCenter"
      : textAlign === "justify"
      ? "alignJustify"
      : textAlign === "right"
      ? "alignRight"
      : "alignLeft";

  return <AlignmentTool alignment={newAlignment} {...props} icon={icon} />;
}
