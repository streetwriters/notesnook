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

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

export const LIBRARIES = {
  "@theme-ui/components": "theme-ui",
  "@theme-ui/core": "theme-ui",
  "theme-ui": "theme-ui",
  "@theme-ui/css": "theme-ui",
  "@theme-ui/color": "theme-ui",
  "react-virtuoso": "react-virtuoso",
  "react-modal": "react-modal",
  "@notesnook/ui": "@notesnook/ui"
};

const THEME_UI_REEXPORTS = new Set([
  "Box",
  "Button",
  "Checkbox",
  "Flex",
  "Grid",
  "Image",
  "Input",
  "Label",
  "Link",
  "Progress",
  "Radio",
  "Slider",
  "Switch",
  "Text",
  "Textarea"
]);

function libraryOf(specifier, name) {
  const lib = LIBRARIES[specifier];
  if (lib !== "@notesnook/ui") return lib;
  return THEME_UI_REEXPORTS.has(name.replace(/Props$/, "")) ? "theme-ui" : lib;
}

const SOURCE = /\.(tsx?|jsx?)$/;
const SKIP = /(\.d\.ts|\.test\.[jt]sx?|\.spec\.[jt]sx?)$/;
const EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];
const EVENT_OBJECTS = new Set([
  "target",
  "currentTarget",
  "relatedTarget",
  "nativeEvent",
  "dataTransfer",
  "clipboardData"
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith("__")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (SOURCE.test(entry.name) && !SKIP.test(entry.name)) out.push(full);
  }
  return out;
}

function resolveModule(from, specifier) {
  if (!specifier.startsWith(".")) return undefined;
  const base = path.resolve(path.dirname(from), specifier);
  const candidates = [
    base,
    ...EXTENSIONS.map((ext) => base + ext),
    ...EXTENSIONS.map((ext) => base.replace(/\.[jt]sx?$/, "") + ext),
    ...EXTENSIONS.map((ext) => path.join(base, "index" + ext))
  ];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
}

function unwrapFunction(node) {
  let typeArgs;
  while (node && ts.isCallExpression(node)) {
    typeArgs = node.typeArguments ?? typeArgs;
    node = node.arguments[0];
  }
  if (node && (ts.isArrowFunction(node) || ts.isFunctionExpression(node)))
    return { fn: node, typeArgs };
  return undefined;
}

function parse(file) {
  const text = fs.readFileSync(file, "utf8");
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    /\.[jt]sx$/.test(file) ? ts.ScriptKind.TSX : undefined
  );
  const info = {
    file,
    source,
    imports: new Map(),
    exports: new Map(),
    stars: [],
    types: new Map(),
    components: new Map(),
    functions: new Map(),
    jsx: []
  };

  const isExported = (node) =>
    ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  const isDefault = (node) =>
    ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);

  const addFunction = (name, fn, typeArgs, exported, asDefault) => {
    info.functions.set(name, fn);
    if (/^[A-Z]/.test(name)) {
      const propsType = typeArgs?.[1] ?? fn.parameters[0]?.type;
      if (propsType) info.components.set(name, propsType);
    }
    if (exported) info.exports.set(asDefault ? "default" : name, name);
  };

  const visit = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      const known = specifier in LIBRARIES;
      const target = known ? undefined : resolveModule(file, specifier);
      const clause = node.importClause;
      const add = (local, name) => {
        const lib = known ? libraryOf(specifier, name) : undefined;
        if (lib) info.imports.set(local, { lib, name });
        else if (target) info.imports.set(local, { file: target, name });
      };
      if (clause?.name) add(clause.name.text, "default");
      const bindings = clause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings))
        for (const el of bindings.elements)
          add(el.name.text, (el.propertyName ?? el.name).text);
    } else if (ts.isExportDeclaration(node)) {
      const target =
        node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)
          ? resolveModule(file, node.moduleSpecifier.text)
          : undefined;
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const el of node.exportClause.elements) {
          const local = (el.propertyName ?? el.name).text;
          if (target) {
            const alias = `__reexport_${el.name.text}`;
            info.imports.set(alias, { file: target, name: local });
            info.exports.set(el.name.text, alias);
          } else info.exports.set(el.name.text, local);
        }
      } else if (!node.exportClause && target) info.stars.push(target);
    } else if (ts.isExportAssignment(node) && ts.isIdentifier(node.expression)) {
      info.exports.set("default", node.expression.text);
    } else if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) {
      const list = info.types.get(node.name.text) ?? [];
      list.push(node);
      info.types.set(node.name.text, list);
      if (isExported(node)) info.exports.set(node.name.text, node.name.text);
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      addFunction(
        node.name.text,
        node,
        undefined,
        isExported(node),
        isDefault(node)
      );
    } else if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name) || !decl.initializer) continue;
        const unwrapped = unwrapFunction(decl.initializer);
        const fn =
          unwrapped ??
          (ts.isArrowFunction(decl.initializer) ||
          ts.isFunctionExpression(decl.initializer)
            ? { fn: decl.initializer }
            : undefined);
        if (fn)
          addFunction(decl.name.text, fn.fn, fn.typeArgs, isExported(node));
        else if (isExported(node))
          info.exports.set(decl.name.text, decl.name.text);
      }
    } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const unwrapped = node.initializer && unwrapFunction(node.initializer);
      if (unwrapped && !info.functions.has(node.name.text))
        info.functions.set(node.name.text, unwrapped.fn);
      else if (
        node.initializer &&
        (ts.isArrowFunction(node.initializer) ||
          ts.isFunctionExpression(node.initializer)) &&
        !info.functions.has(node.name.text)
      )
        info.functions.set(node.name.text, node.initializer);
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node))
      info.jsx.push(node);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return info;
}

export function scan(webSrc) {
  const files = new Map();
  for (const file of walk(webSrc)) files.set(file, parse(file));

  const components = new Map();
  const sx = new Map();
  const style = new Map();
  const spreads = [];

  const rel = (file) => path.relative(path.dirname(webSrc), file);
  const where = (info, node) =>
    `${rel(info.file)}:${
      info.source.getLineAndCharacterOfPosition(node.getStart()).line + 1
    }`;
  const bump = (map, key, at, wrapper) => {
    const entry = map.get(key) ?? { count: 0, viaWrapper: 0, where: [] };
    entry.count++;
    if (wrapper) entry.viaWrapper++;
    if (entry.where.length < 3) entry.where.push(at);
    map.set(key, entry);
  };
  const componentEntry = (key) => {
    let entry = components.get(key);
    if (!entry) {
      entry = { props: new Map(), events: new Map(), refs: new Map() };
      components.set(key, entry);
    }
    return entry;
  };

  const typeCache = new Map();
  function resolveType(info, name, seen = new Set()) {
    const id = `${info.file}#${name}`;
    if (typeCache.has(id)) return typeCache.get(id);
    const result = { bases: new Set(), own: new Set() };
    if (seen.has(id)) return result;
    seen.add(id);
    const imported = info.imports.get(name);
    if (imported?.lib) {
      if (/Props$/.test(imported.name) && imported.name !== "ItemProps")
        result.bases.add(
          `${imported.lib}:${
            imported.lib === "react-modal"
              ? "Modal"
              : imported.name.replace(/Props$/, "")
          }`
        );
    } else if (imported?.file) {
      const other = files.get(imported.file);
      const local = other && lookupExport(other, imported.name);
      if (local) merge(result, resolveType(local.info, local.name, seen));
    } else {
      for (const decl of info.types.get(name) ?? []) {
        if (ts.isInterfaceDeclaration(decl)) {
          for (const member of decl.members)
            if (member.name) result.own.add(member.name.getText());
          for (const clause of decl.heritageClauses ?? [])
            for (const type of clause.types)
              merge(result, typeOf(info, type, seen));
        } else merge(result, typeOf(info, decl.type, seen));
      }
    }
    typeCache.set(id, result);
    return result;
  }

  function merge(into, from) {
    for (const base of from.bases) into.bases.add(base);
    for (const own of from.own) into.own.add(own);
  }

  function typeOf(info, node, seen = new Set()) {
    const result = { bases: new Set(), own: new Set() };
    if (!node) return result;
    if (ts.isParenthesizedTypeNode(node))
      return typeOf(info, node.type, seen);
    if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) {
      for (const type of node.types) merge(result, typeOf(info, type, seen));
    } else if (ts.isTypeLiteralNode(node)) {
      for (const member of node.members)
        if (member.name) result.own.add(member.name.getText());
    } else if (
      ts.isTypeReferenceNode(node) ||
      ts.isExpressionWithTypeArguments(node)
    ) {
      const nameNode = ts.isTypeReferenceNode(node)
        ? node.typeName
        : node.expression;
      const name = nameNode.getText();
      if (ts.isIdentifier(nameNode))
        merge(result, resolveType(info, name, seen));
      if (/^(React\.)?(Omit|PropsWithChildren|Partial|Pick|Required)$/.test(name))
        merge(result, typeOf(info, node.typeArguments?.[0], seen));
    }
    return result;
  }

  function lookupExport(info, name, seen = new Set()) {
    if (seen.has(info.file)) return undefined;
    seen.add(info.file);
    const local = info.exports.get(name);
    if (local) {
      const imported = info.imports.get(local);
      if (imported?.file) {
        const other = files.get(imported.file);
        return other && lookupExport(other, imported.name, seen);
      }
      return { info, name: local };
    }
    for (const star of info.stars) {
      const other = files.get(star);
      const found = other && lookupExport(other, name, seen);
      if (found) return found;
    }
    return undefined;
  }

  const componentCache = new Map();
  function resolveComponent(info, name, seen = new Set()) {
    const id = `${info.file}#${name}`;
    if (componentCache.has(id)) return componentCache.get(id);
    let result = { bases: new Set(), own: new Set() };
    if (!seen.has(id)) {
      seen.add(id);
      const imported = info.imports.get(name);
      if (imported?.lib) {
        const component =
          imported.lib === "react-modal" ? "Modal" : imported.name;
        result.bases.add(`${imported.lib}:${component}`);
      } else if (imported?.file) {
        const other = files.get(imported.file);
        const local = other && lookupExport(other, imported.name);
        if (local) result = resolveComponent(local.info, local.name, seen);
      } else if (info.components.has(name)) {
        result = { ...typeOf(info, info.components.get(name)), wrapper: name };
      }
    }
    componentCache.set(id, result);
    return result;
  }

  function eventMembers(info, fn) {
    const members = new Set();
    const param = fn.parameters?.[0];
    if (!param) return members;
    if (ts.isObjectBindingPattern(param.name)) {
      for (const el of param.name.elements)
        members.add((el.propertyName ?? el.name).getText());
      return members;
    }
    if (!ts.isIdentifier(param.name)) return members;
    const eventName = param.name.text;
    const shadows = (node) =>
      (ts.isCatchClause(node) &&
        node.variableDeclaration?.name.getText() === eventName) ||
      (ts.isFunctionLike(node) &&
        node.parameters.some(
          (parameter) => parameter.name.getText() === eventName
        ));
    const visit = (node) => {
      if (shadows(node)) return;
      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === eventName
      ) {
        const first = node.name.text;
        const parent = node.parent;
        if (
          EVENT_OBJECTS.has(first) &&
          ts.isPropertyAccessExpression(parent) &&
          parent.expression === node
        )
          members.add(`${first}.${parent.name.text}`);
        else members.add(first);
      }
      ts.forEachChild(node, visit);
    };
    if (fn.body) visit(fn.body);
    return members;
  }

  function handlerOf(info, expression) {
    if (!expression) return undefined;
    if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression))
      return expression;
    if (ts.isIdentifier(expression)) return info.functions.get(expression.text);
    return undefined;
  }

  function refMembers(info, refName) {
    const members = new Set();
    const visit = (node) => {
      if (
        ts.isPropertyAccessExpression(node) &&
        node.name.text === "current" &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === refName
      ) {
        let parent = node.parent;
        let self = node;
        while (ts.isNonNullExpression(parent) || ts.isParenthesizedExpression(parent)) {
          self = parent;
          parent = parent.parent;
        }
        if (ts.isPropertyAccessExpression(parent) && parent.expression === self)
          members.add(parent.name.text);
      }
      ts.forEachChild(node, visit);
    };
    visit(info.source);
    return members;
  }

  function sxKeys(info, object, into) {
    for (const property of object.properties) {
      if (ts.isSpreadAssignment(property)) {
        const visit = (node) => {
          if (ts.isObjectLiteralExpression(node)) sxKeys(info, node, into);
          else if (
            ts.isConditionalExpression(node) ||
            ts.isParenthesizedExpression(node) ||
            ts.isBinaryExpression(node)
          )
            ts.forEachChild(node, visit);
        };
        visit(property.expression);
        continue;
      }
      if (!property.name) continue;
      const key =
        ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
          ? property.name.text
          : property.name.getText();
      bump(into, key, where(info, property));
    }
  }

  for (const info of files.values()) {
    for (const element of info.jsx) {
      if (!ts.isIdentifier(element.tagName)) continue;
      const resolved = resolveComponent(info, element.tagName.text);
      if (!resolved.bases.size) continue;
      const wrapper = resolved.wrapper ? element.tagName.text : undefined;
      for (const base of resolved.bases) {
        const entry = componentEntry(base);
        const hasChildren =
          ts.isJsxOpeningElement(element) &&
          element.parent.children.some(
            (child) => !ts.isJsxText(child) || child.text.trim()
          );
        if (hasChildren && !resolved.own.has("children"))
          bump(entry.props, "children", where(info, element), wrapper);
        for (const attribute of element.attributes.properties) {
          if (ts.isJsxSpreadAttribute(attribute)) {
            if (spreads.length < 500)
              spreads.push({ component: base, at: where(info, attribute) });
            continue;
          }
          const name = attribute.name.getText();
          if (name === "key" || resolved.own.has(name)) continue;
          const at = where(info, attribute);
          bump(entry.props, name, at, wrapper);
          const value =
            attribute.initializer && ts.isJsxExpression(attribute.initializer)
              ? attribute.initializer.expression
              : undefined;
          if (!value) continue;
          if (/^on[A-Z]/.test(name)) {
            const handler = handlerOf(info, value);
            if (handler)
              for (const member of eventMembers(info, handler)) {
                const map = entry.events.get(name) ?? new Map();
                bump(map, member, at, wrapper);
                entry.events.set(name, map);
              }
          } else if (name === "ref" && ts.isIdentifier(value)) {
            for (const member of refMembers(info, value.text))
              bump(entry.refs, member, at, wrapper);
          } else if (
            (name === "sx" || name === "__css") &&
            ts.isObjectLiteralExpression(value)
          ) {
            sxKeys(info, value, sx);
          } else if (
            name === "style" &&
            base !== "react-modal:Modal" &&
            ts.isObjectLiteralExpression(value)
          ) {
            sxKeys(info, value, style);
          } else if (
            (name === "components" || (name === "style" && base === "react-modal:Modal")) &&
            ts.isObjectLiteralExpression(value)
          ) {
            for (const property of value.properties)
              if (property.name)
                bump(entry.props, `${name}.${property.name.getText()}`, at, wrapper);
          }
        }
      }
    }
  }

  const imports = new Map();
  for (const info of files.values())
    for (const imported of info.imports.values())
      if (imported.lib)
        bump(imports, `${imported.lib}:${imported.name}`, rel(info.file));

  return { files: files.size, components, sx, style, imports, spreads };
}

function toPlain(value) {
  if (value instanceof Map)
    return Object.fromEntries(
      [...value.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, toPlain(v)])
    );
  if (value && typeof value === "object" && !Array.isArray(value))
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, toPlain(v)])
    );
  return value;
}

export function scanToJSON(webSrc) {
  return toPlain(scan(webSrc));
}
