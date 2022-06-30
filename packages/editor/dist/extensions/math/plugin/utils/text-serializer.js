var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var ProseMirrorTextSerializer = /** @class */ (function () {
    function ProseMirrorTextSerializer(fns, base) {
        // use base serializer as a fallback
        this.nodes = __assign(__assign({}, base === null || base === void 0 ? void 0 : base.nodes), fns.nodes);
        this.marks = __assign(__assign({}, base === null || base === void 0 ? void 0 : base.marks), fns.marks);
    }
    ProseMirrorTextSerializer.prototype.serializeFragment = function (fragment) {
        var _this = this;
        // adapted from the undocumented `Fragment.textBetween` function
        // https://github.com/ProseMirror/prosemirror-model/blob/eef20c8c6dbf841b1d70859df5d59c21b5108a4f/src/fragment.js#L46
        var blockSeparator = "\n\n";
        var leafText = undefined;
        var text = "";
        var separated = true;
        var from = 0;
        var to = fragment.size;
        fragment.nodesBetween(from, to, function (node, pos) {
            var _a;
            // check if one of our custom serializers handles this node
            var serialized = _this.serializeNode(node);
            if (serialized !== null) {
                text += serialized;
                return false;
            }
            if (node.isText) {
                text += ((_a = node.text) === null || _a === void 0 ? void 0 : _a.slice(Math.max(from, pos) - pos, to - pos)) || "";
                separated = !blockSeparator;
            }
            else if (node.isLeaf && leafText) {
                text += leafText;
                separated = !blockSeparator;
            }
            else if (!separated && node.isBlock) {
                text += blockSeparator;
                separated = true;
            }
        }, 0);
        return text;
    };
    ProseMirrorTextSerializer.prototype.serializeSlice = function (slice) {
        return this.serializeFragment(slice.content);
    };
    ProseMirrorTextSerializer.prototype.serializeNode = function (node) {
        // check if one of our custom serializers handles this node
        var nodeSerializer = this.nodes[node.type.name];
        if (nodeSerializer !== undefined) {
            return nodeSerializer(node);
        }
        else {
            return null;
        }
    };
    return ProseMirrorTextSerializer;
}());
export var mathSerializer = new ProseMirrorTextSerializer({
    nodes: {
        math_inline: function (node) { return "$".concat(node.textContent, "$"); },
        math_display: function (node) { return "\n\n$$\n".concat(node.textContent, "\n$$"); },
    },
});
