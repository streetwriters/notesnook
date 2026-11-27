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

// Rewrites the React Native props that the kit still accepts as deprecated
// names (docs/ui-kit-web-api.md, "Deprecated names") to their web API names.
// Text edits on the TypeScript syntax tree, so formatting is kept.
//
//   onPress                  -> onClick
//   onHoverIn / onHoverOut   -> onMouseEnter / onMouseLeave
//   testID                   -> data-test-id
//   onChangeText (Input, Textarea)
//                            -> onChange; an inline handler's parameter becomes
//                               `{ target: { value } }`, any other handler is
//                               wrapped: `(e) => (handler)(e.target.value)`
//   numberOfLines (Text)     -> sx.lineClamp
//   resizeMode (Image)       -> sx.objectFit (cover, contain, stretch -> fill,
//                               center -> none)
//
// Whatever it cannot rewrite safely stays as it is and is reported in `manual`.

import ts from "typescript";

const RENAMES = {
  onPress: "onClick",
  onHoverIn: "onMouseEnter",
  onHoverOut: "onMouseLeave",
  testID: "data-test-id"
};
const TEXT_INPUTS = new Set(["Input", "Textarea"]);
const OBJECT_FIT = {
  cover: "cover",
  contain: "contain",
  stretch: "fill",
  center: "none"
};

/** @returns {{ code: string, changed: boolean, manual: {line: number, message: string}[] }} */
export function transform(source, fileName = "file.tsx") {
  const kind = /\.(ts|mts|cts)$/.test(fileName)
    ? ts.ScriptKind.TS
    : ts.ScriptKind.TSX;
  const sf = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    kind
  );
  /** @type {{start: number, end: number, text: string, order: number}[]} */
  const edits = [];
  const manual = [];
  let order = 0;
  const edit = (start, end, text) =>
    edits.push({ start, end, text, order: order++ });
  const note = (node, message) =>
    manual.push({
      line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
      message
    });

  const attrName = (a) => a.name.getText(sf);
  const exprOf = (a) =>
    a.initializer && ts.isJsxExpression(a.initializer)
      ? a.initializer.expression
      : undefined;

  function visitElement(node) {
    const tag = node.tagName.getText(sf);
    const named = new Map();
    for (const a of node.attributes.properties)
      if (ts.isJsxAttribute(a)) named.set(attrName(a), a);
    /** props to place in `sx`: [key, valueText] */
    const sxProps = [];
    const sxAttrs = [];

    for (const [name, a] of named) {
      if (name in RENAMES) {
        const to = RENAMES[name];
        if (named.has(to)) {
          note(a, `${tag}: ${name} left, the element already has ${to}`);
          continue;
        }
        edit(a.name.getStart(sf), a.name.end, to);
      } else if (name === "onChangeText" && TEXT_INPUTS.has(tag)) {
        if (named.has("onChange")) {
          note(a, `${tag}: onChangeText left, it already has onChange`);
          continue;
        }
        const expr = exprOf(a);
        if (!expr) {
          note(a, `${tag}: onChangeText left, its value is not an expression`);
          continue;
        }
        const fn = ts.isParenthesizedExpression(expr) ? expr.expression : expr;
        if (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) {
          const p = fn.parameters[0];
          if (p && (!ts.isIdentifier(p.name) || fn.parameters.length > 1)) {
            note(p, `${tag}: onChangeText handler needs a manual change`);
            continue;
          }
          edit(a.name.getStart(sf), a.name.end, "onChange");
          if (!p) continue;
          const pattern = `{ target: { value: ${p.name.text} } }`;
          // `text => x` needs parentheses around a pattern.
          const bare =
            ts.isArrowFunction(fn) &&
            !fn.getChildren(sf).some((c) => c.kind === ts.SyntaxKind.OpenParenToken);
          edit(p.getStart(sf), p.end, bare ? `(${pattern})` : pattern);
        } else {
          edit(a.name.getStart(sf), a.name.end, "onChange");
          edit(expr.getStart(sf), expr.getStart(sf), "(e) => (");
          edit(expr.end, expr.end, ")(e.target.value)");
        }
      } else if (name === "numberOfLines" && tag === "Text") {
        const expr = exprOf(a);
        if (!expr) {
          note(a, `${tag}: numberOfLines left, its value is not an expression`);
          continue;
        }
        sxProps.push(["lineClamp", expr.getText(sf)]);
        sxAttrs.push(a);
      } else if (name === "resizeMode" && tag === "Image") {
        const init = a.initializer;
        const inner = exprOf(a);
        const lit =
          init && ts.isStringLiteral(init)
            ? init
            : inner && ts.isStringLiteralLike(inner)
              ? inner
              : undefined;
        const fit = lit && OBJECT_FIT[lit.text];
        if (!fit) {
          note(a, `${tag}: resizeMode left, its value has no objectFit equivalent`);
          continue;
        }
        sxProps.push(["objectFit", JSON.stringify(fit)]);
        sxAttrs.push(a);
      } else if (name === "numberOfLines" || name === "resizeMode") {
        const only = name === "numberOfLines" ? "Text" : "Image";
        note(a, `${tag}: ${name} left, only ${only} is rewritten`);
      }
    }

    if (!sxProps.length) return;
    const keys = sxProps.map(([k]) => k).join("/");
    const props = sxProps.map(([k, v]) => `${k}: ${v}`).join(", ");
    const sx = named.get("sx");
    const sxExpr = sx && exprOf(sx);
    if (!sx) {
      // The first moved attribute becomes `sx`, the others go.
      const [first, ...rest] = sxAttrs;
      edit(first.getStart(sf), first.end, `sx={{ ${props} }}`);
      for (const a of rest) edit(a.getFullStart(), a.end, "");
    } else if (sxExpr && ts.isObjectLiteralExpression(sxExpr)) {
      const dup = sxExpr.properties.some(
        (p) => p.name && sxProps.some(([k]) => k === p.name.getText(sf))
      );
      if (dup) {
        note(sx, `${tag}: sx already sets ${keys}, props left`);
        return;
      }
      const open = sxExpr.getStart(sf) + 1;
      edit(open, open, ` ${props}${sxExpr.properties.length ? "," : " "}`);
      for (const a of sxAttrs) edit(a.getFullStart(), a.end, "");
    } else {
      note(sx, `${tag}: sx is not an object literal, ${keys} left`);
    }
  }

  (function walk(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node))
      visitElement(node);
    ts.forEachChild(node, walk);
  })(sf);

  // Apply from the end; edits at one position keep their creation order.
  edits.sort((a, b) => b.start - a.start || b.order - a.order);
  let code = source;
  for (const e of edits)
    code = code.slice(0, e.start) + e.text + code.slice(e.end);
  return { code, changed: code !== source, manual };
}
