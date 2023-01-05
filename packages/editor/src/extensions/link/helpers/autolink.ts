/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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
import {
  combineTransactionSteps,
  findChildrenInRange,
  getChangedRanges,
  getMarksBetween,
  NodeWithPos
} from "@tiptap/core";
import { find, test } from "linkifyjs";
import { MarkType } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";

type AutolinkOptions = {
  type: MarkType;
  validate?: (url: string) => boolean;
};

export function autolink(options: AutolinkOptions): Plugin {
  return new Plugin({
    key: new PluginKey("autolink"),
    appendTransaction: (transactions, oldState, newState) => {
      const docChanges =
        transactions.some((transaction) => transaction.docChanged) &&
        !oldState.doc.eq(newState.doc);
      const preventAutolink = transactions.some((transaction) =>
        transaction.getMeta("preventAutolink")
      );

      if (!docChanges || preventAutolink) {
        return;
      }

      const { tr } = newState;
      const transform = combineTransactionSteps(oldState.doc, [
        ...transactions
      ]);
      const { mapping } = transform;
      const changes = getChangedRanges(transform);

      changes.forEach(({ oldRange, newRange }) => {
        // at first we check if we have to remove links
        getMarksBetween(oldRange.from, oldRange.to, oldState.doc)
          .filter((item) => item.mark.type === options.type)
          .forEach((oldMark) => {
            const newFrom = mapping.map(oldMark.from);
            const newTo = mapping.map(oldMark.to);
            const newMarks = getMarksBetween(
              newFrom,
              newTo,
              newState.doc
            ).filter((item) => item.mark.type === options.type);

            if (!newMarks.length) {
              return;
            }

            const newMark = newMarks[0];
            const oldLinkText = oldState.doc.textBetween(
              oldMark.from,
              oldMark.to,
              undefined,
              " "
            );
            const newLinkText = newState.doc.textBetween(
              newMark.from,
              newMark.to,
              undefined,
              " "
            );
            const wasLink = test(oldLinkText);
            const isLink = test(newLinkText);

            // remove only the link, if it was a link before too
            // because we don’t want to remove links that were set manually
            if (wasLink && !isLink) {
              tr.removeMark(newMark.from, newMark.to, options.type);
            }
          });

        // now let’s see if we can add new links
        const nodesInChangedRanges = findChildrenInRange(
          newState.doc,
          newRange,
          (node) => node.isTextblock
        );

        let textBlock: NodeWithPos | undefined;
        let textBeforeWhitespace: string | undefined;

        if (nodesInChangedRanges.length > 1) {
          // Grab the first node within the changed ranges (ex. the first of two paragraphs when hitting enter)
          textBlock = nodesInChangedRanges[0];
          textBeforeWhitespace = newState.doc.textBetween(
            textBlock.pos,
            textBlock.pos + textBlock.node.nodeSize,
            undefined,
            " "
          );
        } else if (
          nodesInChangedRanges.length &&
          // We want to make sure to include the block seperator argument to treat hard breaks like spaces
          newState.doc
            .textBetween(newRange.from, newRange.to, " ", " ")
            .endsWith(" ")
        ) {
          textBlock = nodesInChangedRanges[0];
          textBeforeWhitespace = newState.doc.textBetween(
            textBlock.pos,
            newRange.to,
            undefined,
            " "
          );
        }

        if (textBlock && textBeforeWhitespace) {
          const wordsBeforeWhitespace = textBeforeWhitespace
            .split(" ")
            .filter((s) => s !== "");

          if (wordsBeforeWhitespace.length <= 0) {
            return false;
          }

          const lastWordBeforeSpace =
            wordsBeforeWhitespace[wordsBeforeWhitespace.length - 1];
          const lastWordAndBlockOffset =
            textBlock.pos +
            textBeforeWhitespace.lastIndexOf(lastWordBeforeSpace);

          if (!lastWordBeforeSpace) {
            return false;
          }

          find(lastWordBeforeSpace)
            .filter((link) => link.isLink)
            .filter((link) => {
              if (options.validate) {
                return options.validate(link.value);
              }
              return true;
            })
            // calculate link position
            .map((link) => ({
              ...link,
              from: lastWordAndBlockOffset + link.start + 1,
              to: lastWordAndBlockOffset + link.end + 1
            }))
            // add link mark
            .forEach((link) => {
              tr.addMark(
                link.from,
                link.to,
                options.type.create({
                  href: link.href
                })
              );
            });
        }
      });

      if (!tr.steps.length) {
        return;
      }

      return tr;
    }
  });
}
