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

import path from "node:path";
import ts from "typescript";

export function loadContract(appDir) {
  const configPath = path.join(appDir, "tsconfig.json");
  const parsed = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
        );
      }
    }
  );
  const entry = path.resolve(
    appDir,
    "../../packages/ui/src/kit/contracts/index.ts"
  );
  const program = ts.createProgram([entry], {
    ...parsed.options,
    noEmit: true
  });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entry);
  const moduleSymbol = checker.getSymbolAtLocation(source);
  const exported = new Map(
    checker.getExportsOfModule(moduleSymbol).map((symbol) => [
      symbol.name,
      symbol.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(symbol)
        : symbol
    ])
  );

  const isDeprecated = (symbol) =>
    symbol.getJsDocTags(checker).some((tag) => tag.name === "deprecated");

  function member(type, name) {
    if (!type) return undefined;
    if (type.flags & ts.TypeFlags.Any) return { type, deprecated: false };
    const target = checker.getNonNullableType(type);
    const constituents = target.isUnion() ? target.types : [target];
    for (const constituent of constituents) {
      const property = checker.getPropertyOfType(constituent, name);
      if (property)
        return {
          type: checker.getTypeOfSymbol(property),
          deprecated: isDeprecated(property)
        };
      if (/^data-/.test(name))
        for (const info of checker.getIndexInfosOfType(constituent))
          if (info.keyType.flags & ts.TypeFlags.TemplateLiteral)
            return { type: info.type, deprecated: false };
    }
    return undefined;
  }

  function path_(type, dotted) {
    let current = { type, deprecated: false };
    for (const name of dotted.split(".")) {
      current = member(current.type, name);
      if (!current) return undefined;
    }
    return current;
  }

  function propsOf(name) {
    const symbol = exported.get(name);
    if (!symbol || !(symbol.flags & ts.SymbolFlags.Value)) return undefined;
    const type = checker.getTypeOfSymbolAtLocation(symbol, source);
    const signature = type.getCallSignatures()[0];
    const parameter = signature?.parameters[0];
    return parameter ? checker.getTypeOfSymbol(parameter) : undefined;
  }

  function eventOf(props, handler) {
    const found = member(props, handler);
    if (!found) return undefined;
    const signature = checker
      .getNonNullableType(found.type)
      .getCallSignatures()[0];
    const parameter = signature?.parameters[0];
    return parameter ? checker.getTypeOfSymbol(parameter) : undefined;
  }

  function refOf(props) {
    const found = member(props, "ref");
    if (!found) return undefined;
    const target = checker.getNonNullableType(found.type);
    for (const constituent of target.isUnion() ? target.types : [target]) {
      const current = checker.getPropertyOfType(constituent, "current");
      if (current)
        return checker.getNonNullableType(checker.getTypeOfSymbol(current));
    }
    return undefined;
  }

  function typeNamed(name) {
    const symbol = exported.get(name);
    if (!symbol || !(symbol.flags & ts.SymbolFlags.Type)) return undefined;
    return checker.getDeclaredTypeOfSymbol(symbol);
  }

  return {
    has: (name) => exported.has(name),
    isDeprecated: (name) => {
      const symbol = exported.get(name);
      return !!symbol && isDeprecated(symbol);
    },
    propsOf,
    eventOf,
    refOf,
    typeNamed,
    member: path_
  };
}
