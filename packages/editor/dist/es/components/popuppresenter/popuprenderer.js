import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useContext } from "react";
export const PopupRendererContext = React.createContext(null);
export const EditorContext = React.createContext(null);
export class PopupRenderer extends React.Component {
    constructor() {
        super(...arguments);
        this.popupContainer = null;
        this.state = {
            popups: [],
        };
        this.openPopup = (id, popup) => {
            if (!popup)
                return;
            this.setState((prev) => {
                return {
                    popups: [...prev.popups, { id, popup }],
                };
            });
        };
        this.closePopup = (id) => {
            this.setState((prev) => {
                const index = prev.popups.findIndex((p) => p.id === id);
                if (index <= -1)
                    return prev;
                const clone = prev.popups.slice();
                clone.splice(index, 1);
                return {
                    popups: clone,
                };
            });
        };
    }
    render() {
        return (_jsxs(PopupRendererContext.Provider, Object.assign({ value: this }, { children: [this.props.children, _jsxs(EditorContext.Provider, Object.assign({ value: this.props.editor }, { children: [this.state.popups.map(({ id, popup: Popup }) => {
                            return _jsx(Popup, { id: id }, id);
                        }), _jsx("div", { id: "popup-container" })] }))] })));
    }
}
export function usePopupRenderer() {
    return useContext(PopupRendererContext);
}
export function useEditorContext() {
    return useContext(EditorContext);
}
