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

// A headless React renderer for the kit's desktop unit tests. Host elements
// (the strings the tests mock `react-native` and the primitives with) become
// plain nodes that keep their props, so a test can find a node, read what it
// was given and call its handlers. Nothing is laid out or drawn.

import { act, createContext, type ReactNode } from "react";
import Reconciler from "react-reconciler";
import { DefaultEventPriority } from "react-reconciler/constants";

export type TestNode = {
  type: string;
  props: Record<string, any>;
  children: (TestNode | TestText)[];
  parent?: TestNode;
};
export type TestText = { text: string; parent?: TestNode };

function isText(node: TestNode | TestText): node is TestText {
  return "text" in node;
}

function append(parent: TestNode, child: TestNode | TestText) {
  remove(parent, child);
  parent.children.push(child);
  child.parent = parent;
}

function insert(
  parent: TestNode,
  child: TestNode | TestText,
  before: TestNode | TestText
) {
  remove(parent, child);
  parent.children.splice(parent.children.indexOf(before), 0, child);
  child.parent = parent;
}

function remove(parent: TestNode, child: TestNode | TestText) {
  const index = parent.children.indexOf(child);
  if (index >= 0) parent.children.splice(index, 1);
}

let priority = 0;

const reconciler = Reconciler({
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  isPrimaryRenderer: true,
  noTimeout: -1,
  createInstance: (type: string, props: Record<string, any>): TestNode => ({
    type,
    props,
    children: []
  }),
  createTextInstance: (text: string): TestText => ({ text }),
  appendInitialChild: append,
  appendChild: append,
  appendChildToContainer: append,
  insertBefore: insert,
  insertInContainerBefore: insert,
  removeChild: remove,
  removeChildFromContainer: remove,
  commitUpdate: (
    node: TestNode,
    _type: string,
    _old: unknown,
    props: Record<string, any>
  ) => {
    node.props = props;
  },
  commitTextUpdate: (node: TestText, _old: string, text: string) => {
    node.text = text;
  },
  finalizeInitialChildren: () => false,
  shouldSetTextContent: () => false,
  getRootHostContext: () => ({}),
  getChildHostContext: (context: unknown) => context,
  getPublicInstance: (node: unknown) => node,
  prepareForCommit: () => null,
  resetAfterCommit: () => {},
  preparePortalMount: () => {},
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  getInstanceFromNode: () => null,
  beforeActiveInstanceBlur: () => {},
  afterActiveInstanceBlur: () => {},
  prepareScopeUpdate: () => {},
  getInstanceFromScope: () => null,
  detachDeletedInstance: () => {},
  clearContainer: (container: TestNode) => {
    container.children = [];
  },
  setCurrentUpdatePriority: (next: number) => {
    priority = next;
  },
  getCurrentUpdatePriority: () => priority,
  resolveUpdatePriority: () => priority || DefaultEventPriority,
  resolveEventType: () => null,
  resolveEventTimeStamp: () => -1.1,
  shouldAttemptEagerTransition: () => false,
  requestPostPaintCallback: () => {},
  maySuspendCommit: () => false,
  preloadInstance: () => true,
  startSuspendingCommit: () => {},
  suspendInstance: () => {},
  waitForCommitToBeReady: () => null,
  NotPendingTransition: null,
  HostTransitionContext: createContext(null),
  resetFormInstance: () => {},
  trackSchedulerEvent: () => {},
  hideInstance: () => {},
  unhideInstance: () => {},
  hideTextInstance: () => {},
  unhideTextInstance: () => {},
  resetTextContent: () => {}
} as any);

export type Rendered = {
  root: TestNode;
  /** Renders again with a new element, as a parent re-render would. */
  update(element: ReactNode): Promise<void>;
  unmount(): Promise<void>;
  /** Every host node that matches, in document order. */
  all(match: (node: TestNode) => boolean): TestNode[];
  /** The one host node that matches; throws when there is none or several. */
  get(match: (node: TestNode) => boolean): TestNode;
  byTestId(id: string): TestNode;
  queryByTestId(id: string): TestNode | undefined;
  /** The text under a node (the whole tree by default), in document order. */
  text(node?: TestNode): string;
};

export function textOf(node: TestNode | TestText): string {
  if (isText(node)) return node.text;
  return node.children.map(textOf).join("");
}

function walk(node: TestNode, visit: (node: TestNode) => void) {
  for (const child of node.children) {
    if (isText(child)) continue;
    visit(child);
    walk(child, visit);
  }
}

function hasTestId(node: TestNode, id: string) {
  return node.props.testID === id || node.props["data-test-id"] === id;
}

/** Runs something that updates state and waits for React to settle. */
export async function settle(run?: () => unknown) {
  await act(async () => {
    await run?.();
  });
}

const mounted = new Set<() => Promise<void>>();

/** Unmounts everything still rendered; call it after each test. */
export async function cleanup() {
  for (const unmount of [...mounted]) await unmount();
}

export async function render(element: ReactNode): Promise<Rendered> {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const root: TestNode = { type: "root", props: {}, children: [] };
  const fail = (error: unknown) => {
    throw error;
  };
  const container = (reconciler as any).createContainer(
    root,
    0,
    null,
    false,
    null,
    "",
    fail,
    fail,
    fail,
    null
  );
  const commit = (next: ReactNode) =>
    settle(() => reconciler.updateContainer(next, container, null, null));
  const unmount = async () => {
    mounted.delete(unmount);
    await commit(null);
  };
  mounted.add(unmount);
  await commit(element);

  const all = (match: (node: TestNode) => boolean) => {
    const found: TestNode[] = [];
    walk(root, (node) => {
      if (match(node)) found.push(node);
    });
    return found;
  };
  return {
    root,
    update: commit,
    unmount,
    all,
    get: (match) => {
      const found = all(match);
      if (found.length !== 1)
        throw new Error(`expected one matching node, found ${found.length}`);
      return found[0];
    },
    byTestId: (id) => {
      const found = all((node) => hasTestId(node, id));
      if (found.length !== 1)
        throw new Error(`expected one "${id}", found ${found.length}`);
      return found[0];
    },
    queryByTestId: (id) => all((node) => hasTestId(node, id))[0],
    text: (node = root) => textOf(node)
  };
}
