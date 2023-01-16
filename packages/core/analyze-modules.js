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

/*
This is free and unencumbered software released into the public domain.
Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.
In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
For more information, please refer to <http://unlicense.org>
*/

/*
## Description
JS script to visualize ES6 circular dependencies by producing a directed graph using dot notation.
Full dependency graph is reduced to a subgraph containing only cycles.
## Prerequisites
- project using ES6 imports/exports
- node installed
  - tested with node v8.2.1
- copy this file to main directory of a project
- install analyze-es6-modules
  - with yarn : yarn add analyze-es6-modules -D
- set `configuration.cwd` to path to directory holding all JS assets
  - example : app/assets/javascripts
- adjust list of `configuration.babel.plugins` below regarding what is needed
  - for react with ES6 the list below might be excessive
  - it seems that every package that starts with babel-plugin-syntax should be listed
    - with yarn : egrep '^babel-plugin-syntax' yarn.lock
## Usage
- node analyze_modules.js
- render graph from the output
  - ex : paste produced text to http://www.webgraphviz.com/
*/

const analyzeModules = require("analyze-es6-modules");

const configuration = {
  cwd: process.cwd(),
  sources: ["**/*.js"],
  babel: {
    plugins: [
      //require("babel-plugin-syntax-jsx"),
      //require("babel-plugin-syntax-flow"),
      require("babel-plugin-syntax-async-functions"),
      require("babel-plugin-syntax-exponentiation-operator"),
      require("babel-plugin-syntax-trailing-function-commas"),
      require("babel-plugin-syntax-object-rest-spread")
    ]
  }
};

/* helpers */

const without = (firstSet, secondSet) =>
  new Set(Array.from(firstSet).filter((it) => !secondSet.has(it)));

const mergeSets = (sets) => {
  const sumSet = new Set();
  sets.forEach((set) => {
    Array.from(set.values()).forEach((value) => {
      sumSet.add(value);
    });
  });
  return sumSet;
};

/* import analysis */

const collectDependencies = (modules) => {
  const dependencySet = new Set();
  const separator = ",";

  modules.forEach(({ path, imports }) => {
    const importingPath = path;

    imports.forEach(({ exportingModule }) => {
      const exportingPath = exportingModule.resolved;
      const dependency = [importingPath, exportingPath].join(separator);

      dependencySet.add(dependency);
    });
  });

  return Array.from(dependencySet.values()).map((it) => it.split(separator));
};

/* graphs */

const buildDirectedGraphFromEdges = (edges) => {
  return edges.reduce((graph, [sourceNode, targetNode]) => {
    graph[sourceNode] = graph[sourceNode] || new Set();
    graph[sourceNode].add(targetNode);

    return graph;
  }, {});
};

const stripTerminalNodes = (graph) => {
  const allSources = new Set(Object.keys(graph));
  const allTargets = mergeSets(Object.values(graph));

  const terminalSources = without(allSources, allTargets);
  const terminalTargets = without(allTargets, allSources);

  const newGraph = Object.entries(graph).reduce(
    (smallerGraph, [source, targets]) => {
      if (!terminalSources.has(source)) {
        const nonTerminalTargets = without(targets, terminalTargets);

        if (nonTerminalTargets.size > 0) {
          smallerGraph[source] = nonTerminalTargets;
        }
      }

      return smallerGraph;
    },
    {}
  );

  return newGraph;
};

const calculateGraphSize = (graph) => mergeSets(Object.values(graph)).size;

const miminizeGraph = (graph) => {
  const smallerGraph = stripTerminalNodes(graph);

  if (calculateGraphSize(smallerGraph) < calculateGraphSize(graph)) {
    return miminizeGraph(smallerGraph);
  } else {
    return smallerGraph;
  }
};

/* rendering */

const convertDirectedGraphToDot = (graph) => {
  const stringBuilder = [];

  stringBuilder.push("digraph G {");

  Object.entries(graph).forEach(([source, targetSet]) => {
    const targets = Array.from(targetSet);
    stringBuilder.push('"' + source + '" -> { "' + targets.join('" "') + '" }');
  });

  stringBuilder.push("}");

  return stringBuilder.join("\n");
};

/* main */

const resolvedHandler = ({ modules }) => {
  const dependencies = collectDependencies(modules);
  const graph = buildDirectedGraphFromEdges(dependencies);
  const minimalGraph = miminizeGraph(graph);

  console.log(convertDirectedGraphToDot(minimalGraph));
};

const rejectedHandler = (e) => {
  console.log("rejected!", e);
};

analyzeModules(configuration).then(resolvedHandler, rejectedHandler);
