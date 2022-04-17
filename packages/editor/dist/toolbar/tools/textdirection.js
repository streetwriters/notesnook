var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { jsx as _jsx } from "react/jsx-runtime";
import { ToolButton } from "../components/tool-button";
var TextDirectionTool = /** @class */ (function () {
    function TextDirectionTool(id, title, icon, direction) {
        var _this = this;
        this.id = id;
        this.title = title;
        this.icon = icon;
        this.direction = direction;
        this.render = function (props) {
            var editor = props.editor;
            return (_jsx(ToolButton, { title: _this.title, id: _this.id, icon: _this.icon, onClick: function () {
                    return editor.chain().focus().setTextDirection(_this.direction).run();
                }, toggled: editor.isActive({ textDirection: _this.direction }) }));
        };
    }
    return TextDirectionTool;
}());
var LeftToRight = /** @class */ (function (_super) {
    __extends(LeftToRight, _super);
    function LeftToRight() {
        return _super.call(this, "ltr", "Left-to-right", "ltr", "ltr") || this;
    }
    return LeftToRight;
}(TextDirectionTool));
export { LeftToRight };
var RightToLeft = /** @class */ (function (_super) {
    __extends(RightToLeft, _super);
    function RightToLeft() {
        return _super.call(this, "rtl", "Right-to-left", "rtl", "rtl") || this;
    }
    return RightToLeft;
}(TextDirectionTool));
export { RightToLeft };
