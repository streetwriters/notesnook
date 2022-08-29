import { SchemeColors } from "@notesnook/theme/dist/theme/colorscheme";
import { Resizable } from "re-resizable";
import { PropsWithChildren } from "react";
import { Icon, Icons } from "../../toolbar";
import { Editor } from "../../types";

type ResizerProps = {
  editor: Editor;
  selected: boolean;
  width?: number;
  height?: number;
  handleColor?: keyof SchemeColors;
  onResize: (width: number, height: number) => void;
};
export function Resizer(props: PropsWithChildren<ResizerProps>) {
  const { editor, selected, onResize, width, height, children, handleColor } =
    props;

  if (!editor.isEditable) return <>{children}</>;

  return (
    <Resizable
      enable={{
        bottom: false,
        left: false,
        right: false,
        top: false,
        bottomLeft: false,
        bottomRight: selected,
        topLeft: false,
        topRight: false
      }}
      size={{
        height: height || "auto",
        width: width || "auto"
      }}
      maxWidth="100%"
      minWidth={135}
      handleComponent={{
        bottomRight: (
          <Icon
            sx={{
              width: 25,
              height: 25,
              marginLeft: -20,
              marginTop: -20,
              borderTopLeftRadius: "default",
              borderBottomRightRadius: "default"
            }}
            path={Icons.resize}
            size={25}
            color={handleColor || "icon"}
          />
        )
      }}
      onResizeStop={(_e, _direction, ref) => {
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
