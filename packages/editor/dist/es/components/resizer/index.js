import { jsx as _jsx } from "react/jsx-runtime";
import { Resizable } from "re-resizable";
import { Icon, Icons } from "../../toolbar";
export function Resizer(props) {
    const { editor, selected, onResize, width, height, children } = props;
    return (_jsx(Resizable, Object.assign({ enable: {
            bottom: false,
            left: false,
            right: false,
            top: false,
            bottomLeft: false,
            bottomRight: editor.isEditable && selected,
            topLeft: false,
            topRight: false,
        }, size: {
            height: height || "auto",
            width: width || "auto",
        }, maxWidth: "100%", minWidth: 150, minHeight: 150, handleComponent: {
            bottomRight: (_jsx(Icon, { sx: {
                    width: 25,
                    height: 25,
                    marginLeft: -17,
                    marginTop: "3px",
                    borderTopLeftRadius: "default",
                    borderBottomRightRadius: "default",
                }, path: Icons.resize, size: 25, color: "primary" })),
        }, onResizeStop: (e, direction, ref, d) => {
            try {
                onResize(ref.clientWidth, ref.clientHeight);
            }
            catch (_a) {
                // ignore
            }
        }, lockAspectRatio: true }, { children: children })));
}
