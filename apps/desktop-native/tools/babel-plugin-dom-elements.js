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

// Raw HTML elements on desktop. apps/web writes `<strong>`, `<span>`,
// `<style>`, `<table>`… as lowercase JSX tags, which React Native would take
// for native components it does not have. This plugin rewrites each known tag
// to the kit's element of that name,
//
//   <strong>{count}</strong>   →   <_Dom.strong>{count}</_Dom.strong>
//
// and imports `Dom` from the desktop kit (packages/ui/src/kit/desktop/dom.tsx),
// so a file shared with apps/web keeps its raw tags.
//
// `document` is rewritten the same way, to the kit's `document` (the same
// module): `document.getElementById("select-plan")` finds the kit element
// with that id. Only a free `document` is: a local of that name, a property
// (`x.document`) and the operand of `typeof` (code asking whether there is a
// DOM is told there is none) stay as written.
//
// Left alone: `br`, `option` and `optgroup` (the kit's Text and Select read
// them from their children and never draw them), tags the kit has no element
// for, and tags inside an `<svg>` (`use`, `path`), which the svg element reads.

const SOURCE = "@notesnook/ui-kit/desktop/dom";

const TAGS = new Set(
  (
    "div section header footer nav main article aside form fieldset span p " +
    "time small strong b em i u s code pre h1 h2 h3 h4 h5 h6 a label button " +
    "img input textarea select hr ul ol li table thead tbody tfoot tr th td " +
    "svg style"
  ).split(" ")
);

module.exports = Object.assign(function domElementsPlugin(api) {
  return domElements(api);
}, { TAGS });

function domElements({ types: t }) {
  return {
    name: "dom-elements",
    visitor: {
      Program: {
        enter(_path, state) {
          state.domLocal = undefined;
          state.documentLocal = undefined;
        },
        exit(path, state) {
          const specifiers = [];
          if (state.domLocal)
            specifiers.push(
              t.importSpecifier(state.domLocal, t.identifier("Dom"))
            );
          if (state.documentLocal)
            specifiers.push(
              t.importSpecifier(state.documentLocal, t.identifier("document"))
            );
          if (!specifiers.length) return;
          path.unshiftContainer(
            "body",
            t.importDeclaration(specifiers, t.stringLiteral(SOURCE))
          );
        }
      },
      ReferencedIdentifier(path, state) {
        if (!path.isIdentifier({ name: "document" })) return;
        if (path.scope.hasBinding("document")) return;
        if (path.parentPath.isUnaryExpression({ operator: "typeof" })) return;
        state.documentLocal ??= path.scope
          .getProgramParent()
          .generateUidIdentifier("document");
        path.replaceWith(t.identifier(state.documentLocal.name));
      },
      JSXElement(path, state) {
        const opening = path.node.openingElement;
        const name = opening.name;
        if (!t.isJSXIdentifier(name) || !TAGS.has(name.name)) return;
        // The children of an svg are data for it, not elements to draw.
        const inSvg = path.findParent(
          (parent) =>
            parent.isJSXElement() &&
            t.isJSXIdentifier(parent.node.openingElement.name, { name: "svg" })
        );
        if (inSvg) return;
        state.domLocal ??= path.scope
          .getProgramParent()
          .generateUidIdentifier("Dom");
        const member = () =>
          t.jsxMemberExpression(
            t.jsxIdentifier(state.domLocal.name),
            t.jsxIdentifier(name.name)
          );
        opening.name = member();
        if (path.node.closingElement) path.node.closingElement.name = member();
      }
    }
  };
};
