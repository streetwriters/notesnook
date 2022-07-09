import { Resizable } from "re-resizable";
import { PropsWithChildren } from "react";
import { Icon, Icons } from "../../toolbar";
import { Editor } from "../../types";

type ResizerProps = {
  editor: Editor;
  selected: boolean;
  width?: number;
  height?: number;
  onResize: (width: number, height: number) => void;
};
export function Resizer(props: PropsWithChildren<ResizerProps>) {
  const { editor, selected, onResize, width, height, children } = props;

  return (
    <Resizable
      enable={{
        bottom: false,
        left: false,
        right: false,
        top: false,
        bottomLeft: false,
        bottomRight: editor.isEditable && selected,
        topLeft: false,
        topRight: false,
      }}
      size={{
        height: height || "auto",
        width: width || "auto",
      }}
      maxWidth="100%"
      minWidth={150}
      minHeight={150}
      handleComponent={{
        bottomRight: (
          <Icon
            sx={{
              width: 25,
              height: 25,
              marginLeft: -17,
              marginTop: "3px",
              borderTopLeftRadius: "default",
              borderBottomRightRadius: "default",
            }}
            path={Icons.resize}
            size={25}
            color="primary"
          />
        ),
      }}
      onResizeStop={(e, direction, ref, d) => {
        try {
          onResize(ref.clientWidth, ref.clientHeight);
        } catch {
          // ignore
        }
      }}
      lockAspectRatio={true}
    >
      {children}
    </Resizable>
  );
}
