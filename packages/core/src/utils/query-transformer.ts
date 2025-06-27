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

import dayjs from "dayjs";
import { servicesVersion } from "typescript";

type ASTNode = QueryNode | PhraseNode | OperatorNode | FieldPhraseNode;

type QueryNode = {
  type: "query";
  children: ASTNode[];
};

type PhraseNode = {
  type: "phrase";
  value: string[];
};

type FieldPhraseNode = {
  type: "field_phrase";
  field: string;
  value: QueryNode;
};

type OperatorNode = {
  type: "AND" | "OR" | "NOT";
};

const SUPPORTED_FIELDS = {
  title: (ast) => {
    const node =
      ast.find((a) => a.type === "field_phrase" && a.field === "title") ||
      ast.find((a) => a.type === "query");
    return node && serializeQuery(node);
  },
  content: (ast) => {
    const node =
      ast.find((a) => a.type === "field_phrase" && a.field === "content") ||
      ast.find((a) => a.type === "query");
    return node && serializeQuery(node);
  },

  // array
  tag: (ast) => parseArrayField("tag", ast),
  color: (ast) => parseArrayField("color", ast),

  // date
  edited_before: (ast) => parseDateField("edited_before", ast),
  edited_after: (ast) => parseDateField("edited_after", ast),
  created_before: (ast) => parseDateField("created_before", ast),
  created_after: (ast) => parseDateField("created_after", ast),

  // boolean
  pinned: (ast) => parseBooleanField("pinned", ast),
  locked: (ast) => parseBooleanField("locked", ast),
  readonly: (ast) => parseBooleanField("readonly", ast),
  local_only: (ast) => parseBooleanField("local_only", ast),
  favorite: (ast) => parseBooleanField("favorite", ast),
  archived: (ast) => parseBooleanField("archived", ast)
} satisfies Record<string, (ast: (QueryNode | FieldPhraseNode)[]) => unknown>;

function isFieldSupported(field: string) {
  return field in SUPPORTED_FIELDS;
}

function parseBooleanField(
  field: string,
  ast: (QueryNode | FieldPhraseNode)[]
): boolean | null {
  const node = ast.find(
    (a): a is FieldPhraseNode => a.type === "field_phrase" && a.field === field
  );
  const sql = node ? generateSQL(node.value) : "";
  return sql === "false" ? false : sql === "true" ? true : null;
}

function parseArrayField(
  field: string,
  ast: (QueryNode | FieldPhraseNode)[]
): string[] | null {
  const values = ast
    .filter(
      (a): a is FieldPhraseNode =>
        a.type === "field_phrase" && a.field === field
    )
    .map((a) => generateSQL(a.value));
  return values.length > 0 ? values : null;
}

function parseDateField(
  field: string,
  ast: (QueryNode | FieldPhraseNode)[]
): number | null {
  const node = ast.find(
    (a): a is FieldPhraseNode => a.type === "field_phrase" && a.field === field
  );
  const date = node ? dayjs(generateSQL(node.value)) : null;
  return date?.isValid() ? date.toDate().getTime() : null;
}

const INVALID_QUERY_REGEX = /[!"#$%&'()*+,\-./:;<>=?@[\\\]^_`{|}~§]/;
function escapeSQLString(str: string): string {
  if (str.startsWith('"') && str.endsWith('"')) {
    const innerStr = str.slice(1, -1).replace(/"/g, '""');
    return `"${innerStr}"`;
  }

  const hasInvalidSymbol = INVALID_QUERY_REGEX.test(str);
  const isWildcard =
    str.startsWith("*") ||
    str.endsWith("*") ||
    str.startsWith("%") ||
    str.endsWith("%");
  if (hasInvalidSymbol || isWildcard) {
    return `"${str}"`;
  }

  // if (isWildcard) {
  //   return str.replace(/(.+?)(\*?$)/gm, (_, text, end) => {
  //     return `${escapeSQLString(text)}${end}`;
  //   });
  // }

  // if (str.includes("-")) {
  //   return `"${str.replace(/"/g, '""')}"`;
  // }

  return str.replace(/"/g, '""');
}

function tokenizeWithFields(
  query: string
): Array<{ field?: string; token: string }> {
  const tokens: Array<{ field?: string; token: string }> = [];
  let buffer = "";
  let isQuoted = false;
  let currentField: string | undefined = undefined;

  for (let i = 0; i < query.length; ++i) {
    const char = query[i];
    if (char === '"') {
      isQuoted = !isQuoted;
    }
    if (char === " " && !isQuoted) {
      if (buffer.length > 0) {
        tokens.push({ field: currentField, token: buffer });
        buffer = "";
      }
    } else if (char === ":" && !isQuoted) {
      // Check for field
      const maybeField = buffer.trim().toLowerCase();
      if (isFieldSupported(maybeField)) {
        currentField = maybeField;
        buffer = "";
      } else {
        buffer += char;
      }
    } else {
      buffer += char;
    }
  }
  if (buffer.length > 0) tokens.push({ field: currentField, token: buffer });

  return tokens;
}

// Helper: group tokens by field
function groupTokensByField(tokens: Array<{ field?: string; token: string }>) {
  const groups: Array<{ field?: string; tokens: string[] }> = [];
  let currentField: string | undefined = undefined;
  let currentTokens: string[] = [];

  for (const { field, token } of tokens) {
    if (field !== currentField) {
      if (currentTokens.length > 0) {
        groups.push({ field: currentField, tokens: currentTokens });
        currentTokens = [];
      }
      currentField = field;
    }
    currentTokens.push(token);
  }
  if (currentTokens.length > 0) {
    groups.push({ field: currentField, tokens: currentTokens });
  }
  return groups;
}

// Parse a group of tokens into a QueryNode (handles boolean ops, etc)
function parseTokensToQueryNode(tokens: string[]): QueryNode {
  const ast: QueryNode = { type: "query", children: [] };
  let currentPhrase: string[] = [];

  for (const token of tokens) {
    if (token === "AND" || token === "OR" || token === "NOT") {
      if (currentPhrase.length > 0) {
        ast.children.push({ type: "phrase", value: currentPhrase });
        currentPhrase = [];
      }
      ast.children.push({ type: token });
    } else {
      currentPhrase.push(token);
    }
  }
  if (currentPhrase.length > 0) {
    ast.children.push({ type: "phrase", value: currentPhrase });
  }
  return ast;
}

function transformQueryNode(ast: QueryNode): QueryNode {
  const transformedAST: QueryNode = { ...ast, children: [] };
  let lastWasPhrase = false;

  for (let i = 0; i < ast.children.length; i++) {
    const child = ast.children[i];

    if (child.type === "phrase") {
      if (lastWasPhrase) {
        transformedAST.children.push({ type: "AND" });
      }
      const transformedPhrase = child.value.map(escapeSQLString);
      transformedAST.children.push({
        type: "phrase",
        value: transformedPhrase
      });
      lastWasPhrase = true;
    } else if (
      child.type === "AND" ||
      child.type === "OR" ||
      child.type === "NOT"
    ) {
      if (
        lastWasPhrase &&
        i + 1 < ast.children.length &&
        ast.children[i + 1].type === "phrase"
      ) {
        transformedAST.children.push(child);
        lastWasPhrase = false;
      }
    }
  }

  return transformedAST;
}

function generateSQL(ast: QueryNode): string {
  return ast.children
    .map((child) => {
      if (child.type === "phrase") {
        return child.value.filter((v) => v.length >= 3).join(" AND ");
      }
      if (child.type === "AND" || child.type === "OR" || child.type === "NOT") {
        return child.type;
      }
      return "";
    })
    .join(" ");
}

// Main transformer: returns (QueryNode | FieldPhraseNode)[]
export function transformQuery(query: string): {
  [K in keyof typeof SUPPORTED_FIELDS]?: ReturnType<
    (typeof SUPPORTED_FIELDS)[K]
  >;
} & { filters: number } {
  const tokens = tokenizeWithFields(query);
  const groups = groupTokensByField(tokens);

  const ast = groups.map((group) => {
    const node = parseTokensToQueryNode(group.tokens);
    const transformedNode = transformQueryNode(node);
    if (group.field) {
      return {
        type: "field_phrase",
        field: group.field,
        value: transformedNode
      } as FieldPhraseNode;
    } else {
      return transformedNode;
    }
  });

  let filters = 0;
  const fields = Object.fromEntries(
    Object.entries(SUPPORTED_FIELDS).map(([key, field]) => {
      const value = field(ast);
      if (
        value !== null &&
        value !== undefined &&
        !["content", "title"].includes(key)
      )
        filters++;
      return [key, value];
    })
  );
  return { ...fields, filters };
}

function serializeQuery(node: QueryNode | FieldPhraseNode) {
  return {
    query: generateSQL(node.type === "query" ? node : node.value),
    tokens: tokenizeAst(node.type === "query" ? node : node.value)
  };
}

export interface QueryTokens {
  andTokens: string[];
  orTokens: string[];
  notTokens: string[];
}

function tokenizeAst(ast: QueryNode): QueryTokens {
  const result: QueryTokens = {
    andTokens: [],
    orTokens: [],
    notTokens: []
  };

  let isNextNot = false;
  let isNextOr = false;

  for (let i = 0; i < ast.children.length; i++) {
    const node = ast.children[i];

    if (node.type === "NOT") {
      isNextNot = true;
      continue;
    }

    if (node.type === "OR") {
      isNextOr = true;
      continue;
    }

    if (node.type === "phrase") {
      // Handle each word in the phrase
      for (const word of node.value) {
        if (
          result.orTokens.includes(word) ||
          result.andTokens.includes(word) ||
          result.notTokens.includes(word)
        ) {
          isNextOr = false;
          isNextNot = false;
          continue;
        }
        if (isNextOr) {
          result.orTokens.push(word);
        } else if (isNextNot) {
          result.notTokens.push(word);
        } else {
          result.andTokens.push(word);
        }
      }

      isNextOr = false;
      isNextNot = false;
    }
  }

  return result;
}
