/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * Moves `sx={{ ... }}` objects made only of literals to module scope, so the
 * object keeps its identity across renders and the style cache can look it up
 * by reference instead of by fingerprint.
 */
module.exports = function hoistSx({ types: t }) {
  function isStatic(node) {
    if (
      t.isStringLiteral(node) ||
      t.isNumericLiteral(node) ||
      t.isBooleanLiteral(node) ||
      t.isNullLiteral(node)
    )
      return true;
    if (t.isTemplateLiteral(node)) return node.expressions.length === 0;
    if (t.isUnaryExpression(node, { operator: "-" }))
      return t.isNumericLiteral(node.argument);
    if (t.isArrayExpression(node))
      return node.elements.every((element) => element && isStatic(element));
    if (t.isObjectExpression(node))
      return node.properties.every(
        (property) =>
          t.isObjectProperty(property) &&
          !property.computed &&
          (t.isIdentifier(property.key) || t.isStringLiteral(property.key)) &&
          isStatic(property.value)
      );
    return false;
  }

  return {
    name: "hoist-sx",
    visitor: {
      JSXAttribute(path) {
        const { name, value } = path.node;
        if (!t.isJSXIdentifier(name, { name: "sx" })) return;
        if (!t.isJSXExpressionContainer(value)) return;
        const expression = value.expression;
        if (!t.isObjectExpression(expression) || !isStatic(expression)) return;
        if (expression.properties.length === 0) return;

        const program = path.scope.getProgramParent();
        const id = path.scope.generateUidIdentifier("sx");
        program.push({ id, init: expression, kind: "const" });
        value.expression = id;
      }
    }
  };
};
