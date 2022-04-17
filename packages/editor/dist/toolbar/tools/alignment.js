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
var AlignmentTool = /** @class */ (function () {
    function AlignmentTool(id, title, alignment, icon) {
        var _this = this;
        this.id = id;
        this.title = title;
        this.alignment = alignment;
        this.icon = icon;
        this.render = function (props) {
            var editor = props.editor;
            return (_jsx(ToolButton, { title: _this.title, id: _this.id, icon: _this.icon, onClick: function () {
                    return editor.chain().focus().setTextAlign(_this.alignment).run();
                }, toggled: editor.isActive({ textAlign: _this.alignment }) }));
        };
    }
    return AlignmentTool;
}());
var AlignCenter = /** @class */ (function (_super) {
    __extends(AlignCenter, _super);
    function AlignCenter() {
        return _super.call(this, "alignCenter", "Align center", "center", "alignCenter") || this;
    }
    return AlignCenter;
}(AlignmentTool));
export { AlignCenter };
var AlignRight = /** @class */ (function (_super) {
    __extends(AlignRight, _super);
    function AlignRight() {
        return _super.call(this, "alignRight", "Align right", "right", "alignRight") || this;
    }
    return AlignRight;
}(AlignmentTool));
export { AlignRight };
var AlignLeft = /** @class */ (function (_super) {
    __extends(AlignLeft, _super);
    function AlignLeft() {
        return _super.call(this, "alignLeft", "Align left", "left", "alignLeft") || this;
    }
    return AlignLeft;
}(AlignmentTool));
export { AlignLeft };
var AlignJustify = /** @class */ (function (_super) {
    __extends(AlignJustify, _super);
    function AlignJustify() {
        return _super.call(this, "alignJustify", "Justify", "justify", "alignJustify") || this;
    }
    return AlignJustify;
}(AlignmentTool));
export { AlignJustify };
