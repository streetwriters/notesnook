import { findParentNodeClosestToPos } from '@tiptap/core';
import { isCellSelection } from './isCellSelection';
export var deleteTableWhenAllCellsSelected = function (_a) {
    var editor = _a.editor;
    var selection = editor.state.selection;
    if (!isCellSelection(selection)) {
        return false;
    }
    var cellCount = 0;
    var table = findParentNodeClosestToPos(selection.ranges[0].$from, function (node) {
        return node.type.name === 'table';
    });
    table === null || table === void 0 ? void 0 : table.node.descendants(function (node) {
        if (node.type.name === 'table') {
            return false;
        }
        if (['tableCell', 'tableHeader'].includes(node.type.name)) {
            cellCount += 1;
        }
    });
    var allCellsSelected = cellCount === selection.ranges.length;
    if (!allCellsSelected) {
        return false;
    }
    editor.commands.deleteTable();
    return true;
};
