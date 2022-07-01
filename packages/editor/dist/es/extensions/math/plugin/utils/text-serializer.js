class ProseMirrorTextSerializer {
    constructor(fns, base) {
        // use base serializer as a fallback
        this.nodes = Object.assign(Object.assign({}, base === null || base === void 0 ? void 0 : base.nodes), fns.nodes);
        this.marks = Object.assign(Object.assign({}, base === null || base === void 0 ? void 0 : base.marks), fns.marks);
    }
    serializeFragment(fragment) {
        // adapted from the undocumented `Fragment.textBetween` function
        // https://github.com/ProseMirror/prosemirror-model/blob/eef20c8c6dbf841b1d70859df5d59c21b5108a4f/src/fragment.js#L46
        let blockSeparator = "\n\n";
        let leafText = undefined;
        let text = "";
        let separated = true;
        let from = 0;
        let to = fragment.size;
        fragment.nodesBetween(from, to, (node, pos) => {
            var _a;
            // check if one of our custom serializers handles this node
            let serialized = this.serializeNode(node);
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
    }
    serializeSlice(slice) {
        return this.serializeFragment(slice.content);
    }
    serializeNode(node) {
        // check if one of our custom serializers handles this node
        let nodeSerializer = this.nodes[node.type.name];
        if (nodeSerializer !== undefined) {
            return nodeSerializer(node);
        }
        else {
            return null;
        }
    }
}
export const mathSerializer = new ProseMirrorTextSerializer({
    nodes: {
        math_inline: (node) => `$${node.textContent}$`,
        math_display: (node) => `\n\n$$\n${node.textContent}\n$$`,
    },
});
