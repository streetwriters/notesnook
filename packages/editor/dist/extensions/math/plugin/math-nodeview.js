/*---------------------------------------------------------
 *  Author: Benjamin R. Bray
 *  License: MIT (see LICENSE in project root for details)
 *--------------------------------------------------------*/
import { EditorState, TextSelection, } from "prosemirror-state";
import { EditorView, } from "prosemirror-view";
import { StepMap } from "prosemirror-transform";
import { keymap } from "prosemirror-keymap";
import { newlineInCode, chainCommands, deleteSelection, } from "prosemirror-commands";
import { collapseMathNode } from "./commands/collapse-math-node";
var MathView = /** @class */ (function () {
    // == Lifecycle ===================================== //
    /**
     * @param onDestroy Callback for when this NodeView is destroyed.
     *     This NodeView should unregister itself from the list of ICursorPosObservers.
     *
     * Math Views support the following options:
     * @option displayMode If TRUE, will render math in display mode, otherwise in inline mode.
     * @option tagName HTML tag name to use for this NodeView.  If none is provided,
     *     will use the node name with underscores converted to hyphens.
     */
    function MathView(node, view, getPos, options, mathPluginKey, onDestroy) {
        var _this = this;
        // store arguments
        this.options = options;
        this._node = node;
        this._outerView = view;
        this._getPos = getPos;
        this._mathPluginKey = mathPluginKey;
        // editing state
        this.cursorSide = "start";
        this._isEditing = false;
        // options
        this._tagName = options.tagName || this._node.type.name.replace("_", "-");
        // create dom representation of nodeview
        this.dom = document.createElement(this._tagName);
        if (options.className)
            this.dom.classList.add(options.className);
        this.dom.classList.add("math-node");
        this._mathRenderElt = document.createElement("span");
        this._mathRenderElt.textContent = "";
        this._mathRenderElt.classList.add("math-render");
        this.dom.appendChild(this._mathRenderElt);
        this._mathSrcElt = document.createElement("span");
        this._mathSrcElt.classList.add("math-src");
        this.dom.appendChild(this._mathSrcElt);
        // ensure
        this.dom.addEventListener("click", function () { return _this.ensureFocus(); });
        // render initial content
        this.renderMath();
    }
    MathView.prototype.destroy = function () {
        // close the inner editor without rendering
        this.closeEditor(false);
        // clean up dom elements
        if (this._mathRenderElt) {
            this._mathRenderElt.remove();
            delete this._mathRenderElt;
        }
        if (this._mathSrcElt) {
            this._mathSrcElt.remove();
            delete this._mathSrcElt;
        }
        this.dom.remove();
    };
    /**
     * Ensure focus on the inner editor whenever this node has focus.
     * This helps to prevent accidental deletions of math blocks.
     */
    MathView.prototype.ensureFocus = function () {
        if (this._innerView && this._outerView.hasFocus()) {
            this._innerView.focus();
        }
    };
    // == Updates ======================================= //
    MathView.prototype.update = function (node, _decorations, _innerDecorations) {
        if (!node.sameMarkup(this._node))
            return false;
        this._node = node;
        if (this._innerView) {
            var state = this._innerView.state;
            var start = node.content.findDiffStart(state.doc.content);
            if (start != null) {
                var diff = node.content.findDiffEnd(state.doc.content);
                if (diff) {
                    var endA = diff.a, endB = diff.b;
                    var overlap = start - Math.min(endA, endB);
                    if (overlap > 0) {
                        endA += overlap;
                        endB += overlap;
                    }
                    this._innerView.dispatch(state.tr
                        .replace(start, endB, node.slice(start, endA))
                        .setMeta("fromOutside", true));
                }
            }
        }
        if (!this._isEditing) {
            this.renderMath();
        }
        return true;
    };
    MathView.prototype.updateCursorPos = function (state) {
        var pos = this._getPos();
        var size = this._node.nodeSize;
        var inPmSelection = state.selection.from < pos + size && pos < state.selection.to;
        if (!inPmSelection) {
            this.cursorSide = pos < state.selection.from ? "end" : "start";
        }
    };
    // == Events ===================================== //
    MathView.prototype.selectNode = function () {
        if (!this._outerView.editable) {
            return;
        }
        this.dom.classList.add("ProseMirror-selectednode");
        if (!this._isEditing) {
            this.openEditor();
        }
    };
    MathView.prototype.deselectNode = function () {
        this.dom.classList.remove("ProseMirror-selectednode");
        if (this._isEditing) {
            this.closeEditor();
        }
    };
    MathView.prototype.stopEvent = function (event) {
        return (this._innerView !== undefined &&
            event.target !== undefined &&
            this._innerView.dom.contains(event.target));
    };
    MathView.prototype.ignoreMutation = function () {
        return true;
    };
    // == Rendering ===================================== //
    MathView.prototype.renderMath = function () {
        if (!this._mathRenderElt) {
            return;
        }
        // get tex string to render
        var content = this._node.content.content;
        var texString = "";
        if (content.length > 0 && content[0].textContent !== null) {
            texString = content[0].textContent.trim();
        }
        // empty math?
        if (texString.length < 1) {
            this.dom.classList.add("empty-math");
            // clear rendered math, since this node is in an invalid state
            while (this._mathRenderElt.firstChild) {
                this._mathRenderElt.firstChild.remove();
            }
            // do not render empty math
            return;
        }
        else {
            this.dom.classList.remove("empty-math");
        }
        // render katex, but fail gracefully
        try {
            this.options.renderer(texString, this._mathRenderElt);
            this._mathRenderElt.classList.remove("parse-error");
            this.dom.setAttribute("title", "");
        }
        catch (err) {
            if (err instanceof Error) {
                console.error(err);
                this._mathRenderElt.classList.add("parse-error");
                this.dom.setAttribute("title", err.toString());
            }
        }
    };
    // == Inner Editor ================================== //
    MathView.prototype.dispatchInner = function (tr) {
        if (!this._innerView) {
            return;
        }
        var _a = this._innerView.state.applyTransaction(tr), state = _a.state, transactions = _a.transactions;
        this._innerView.updateState(state);
        if (!tr.getMeta("fromOutside")) {
            var outerTr = this._outerView.state.tr, offsetMap = StepMap.offset(this._getPos() + 1);
            for (var i = 0; i < transactions.length; i++) {
                var steps = transactions[i].steps;
                for (var j = 0; j < steps.length; j++) {
                    var mapped = steps[j].map(offsetMap);
                    if (!mapped) {
                        throw Error("step discarded!");
                    }
                    outerTr.step(mapped);
                }
            }
            if (outerTr.docChanged)
                this._outerView.dispatch(outerTr);
        }
    };
    MathView.prototype.openEditor = function () {
        var _this = this;
        var _a;
        if (this._innerView) {
            throw Error("inner view should not exist!");
        }
        if (!this._mathSrcElt)
            throw new Error("_mathSrcElt does not exist!");
        // create a nested ProseMirror view
        this._innerView = new EditorView(this._mathSrcElt, {
            state: EditorState.create({
                doc: this._node,
                plugins: [
                    keymap({
                        Tab: function (state, dispatch) {
                            if (dispatch) {
                                dispatch(state.tr.insertText("\t"));
                            }
                            return true;
                        },
                        Backspace: chainCommands(deleteSelection, function (state, dispatch, tr_inner) {
                            // default backspace behavior for non-empty selections
                            if (!state.selection.empty) {
                                return false;
                            }
                            // default backspace behavior when math node is non-empty
                            if (_this._node.textContent.length > 0) {
                                return false;
                            }
                            // otherwise, we want to delete the empty math node and focus the outer view
                            _this._outerView.dispatch(_this._outerView.state.tr.insertText(""));
                            _this._outerView.focus();
                            return true;
                        }),
                        // "Ctrl-Backspace": (state, dispatch, tr_inner) => {
                        //   // delete math node and focus the outer view
                        //   this._outerView.dispatch(this._outerView.state.tr.insertText(""));
                        //   this._outerView.focus();
                        //   return true;
                        // },
                        Enter: chainCommands(newlineInCode, collapseMathNode(this._outerView, +1, false)),
                        "Ctrl-Enter": collapseMathNode(this._outerView, +1, false),
                        ArrowLeft: collapseMathNode(this._outerView, -1, true),
                        ArrowRight: collapseMathNode(this._outerView, +1, true),
                        ArrowUp: collapseMathNode(this._outerView, -1, true),
                        ArrowDown: collapseMathNode(this._outerView, +1, true),
                    }),
                ],
            }),
            dispatchTransaction: this.dispatchInner.bind(this),
        });
        // focus element
        var innerState = this._innerView.state;
        this._innerView.focus();
        // request outer cursor position before math node was selected
        var maybePos = (_a = this._mathPluginKey.getState(this._outerView.state)) === null || _a === void 0 ? void 0 : _a.prevCursorPos;
        if (maybePos === null || maybePos === undefined) {
            console.error("[prosemirror-math] Error:  Unable to fetch math plugin state from key.");
        }
        var prevCursorPos = maybePos !== null && maybePos !== void 0 ? maybePos : 0;
        // compute position that cursor should appear within the expanded math node
        var innerPos = prevCursorPos <= this._getPos() ? 0 : this._node.nodeSize - 2;
        this._innerView.dispatch(innerState.tr.setSelection(TextSelection.create(innerState.doc, innerPos)));
        this._isEditing = true;
    };
    /**
     * Called when the inner ProseMirror editor should close.
     *
     * @param render Optionally update the rendered math after closing. (which
     *    is generally what we want to do, since the user is done editing!)
     */
    MathView.prototype.closeEditor = function (render) {
        if (render === void 0) { render = true; }
        if (this._innerView) {
            this._innerView.destroy();
            this._innerView = undefined;
        }
        if (render) {
            this.renderMath();
        }
        this._isEditing = false;
    };
    return MathView;
}());
export { MathView };
