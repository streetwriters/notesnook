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
import { Notebook, VirtualizedGrouping } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { FlatList } from "react-native-actions-sheet";
import create from "zustand";
import { db } from "../../../common/database";
import { useNotebook } from "../../../hooks/use-notebook";
import { eSendEvent, presentSheet } from "../../../services/event-manager";
import {
  useNotebookStore,
  useNotebooks
} from "../../../stores/use-notebook-store";
import { eOnNotebookUpdated } from "../../../utils/events";
import {
  findRootNotebookId,
  getParentNotebookId
} from "../../../utils/notebooks";
import { AppFontSize } from "../../../utils/size";
import { Dialog } from "../../dialog";
import DialogHeader from "../../dialog/dialog-header";
import { presentDialog } from "../../dialog/functions";
import SheetProvider from "../../sheet-provider";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import { Pressable } from "../../ui/pressable";
import Seperator from "../../ui/seperator";
import Paragraph from "../../ui/typography/paragraph";
import { AddNotebookSheet } from "../add-notebook";

const useNotebookExpandedStore = create<{
  expanded: {
    [id: string]: boolean;
  };
  setExpanded: (id: string) => void;
}>((set, get) => ({
  expanded: {},
  setExpanded(id: string) {
    set({
      expanded: {
        ...get().expanded,
        [id]: !get().expanded[id]
      }
    });
  }
}));

export const MoveNotebookSheet = ({
  selectedNotebooks,
  close
}: {
  selectedNotebooks: Notebook[];
  close?: () => void;
}) => {
  const [notebooks] = useNotebooks();
  const { colors } = useThemeColors();
  const [moveToTop, setMoveToTop] = useState(false);

  useEffect(() => {
    (async () => {
      for (const notebook of selectedNotebooks) {
        const root = await findRootNotebookId(notebook.id);
        if (root !== notebook.id) {
          setMoveToTop(true);
          return;
        }
      }
    })();
  }, [selectedNotebooks]);

  const renderItem = useCallback(
    ({ index }: { index: number }) => {
      return (
        <NotebookItem
          id={index}
          items={notebooks}
          level={0}
          selectedNotebooks={selectedNotebooks}
          onPress={async (selectedNotebook) => {
            presentDialog({
              title: strings.moveNotebooks(selectedNotebooks.length),
              paragraph: strings.moveNotebooksConfirm(
                selectedNotebooks.length,
                selectedNotebook.title
              ),
              positiveText: strings.move(),
              context: "move-notebook",
              positivePress: async () => {
                for (const notebook of selectedNotebooks) {
                  const parent = await getParentNotebookId(notebook.id);
                  const root = await findRootNotebookId(notebook.id);

                  if (selectedNotebook.id === notebook.id) continue;

                  if (root !== notebook.id) {
                    await db.relations.unlink(
                      {
                        type: "notebook",
                        id: parent
                      },
                      notebook
                    );
                  }
                  await db.relations.add(selectedNotebook, notebook);
                  if (parent) {
                    eSendEvent(eOnNotebookUpdated, parent);
                  }
                }

                if (!parent) {
                  useNotebookStore.getState().refresh();
                } else {
                  eSendEvent(eOnNotebookUpdated, selectedNotebook.id);
                }

                close?.();
              }
            });
          }}
        />
      );
    },
    [selectedNotebooks, notebooks, close]
  );

  return (
    <View>
      <SheetProvider context="move-notebook" />
      <Dialog context="move-notebook" />

      <View
        style={{
          paddingHorizontal: 12
        }}
      >
        <DialogHeader
          title={strings.moveNotebook(
            selectedNotebooks.length,
            selectedNotebooks[0].title
          )}
        />
      </View>
      <Seperator />

      <FlatList
        data={notebooks?.placeholders}
        renderItem={renderItem}
        windowSize={1}
        ListHeaderComponent={
          <View
            style={{
              paddingHorizontal: 12
            }}
          >
            {moveToTop ? (
              <Button
                title={strings.moveToTop()}
                style={{
                  alignSelf: "flex-start",
                  width: "100%",
                  justifyContent: "space-between"
                }}
                icon="arrow-up-bold"
                iconPosition="right"
                type="secondaryAccented"
                onPress={async () => {
                  for (const notebook of selectedNotebooks) {
                    const parent = await getParentNotebookId(notebook.id);
                    const root = await findRootNotebookId(notebook.id);
                    if (root !== notebook.id) {
                      await db.relations.unlink(
                        {
                          type: "notebook",
                          id: parent
                        },
                        notebook
                      );
                      eSendEvent(eOnNotebookUpdated, parent);
                      eSendEvent(eOnNotebookUpdated, notebook.id);
                    }
                  }
                  useNotebookStore.getState().refresh();
                  close?.();
                }}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              height: 200
            }}
          >
            <Text
              style={{
                color: colors.secondary.icon
              }}
            >
              No notebooks
            </Text>
          </View>
        }
      />
    </View>
  );
};

const NotebookItem = ({
  id,
  onPress,
  items,
  level = 0,
  selectedNotebooks
}: {
  id: string | number;
  level?: number;
  items?: VirtualizedGrouping<Notebook>;
  onPress: (item: Notebook) => void;
  selectedNotebooks: Notebook[];
}) => {
  const { nestedNotebooks, notebook } = useNotebook(id, items, true);

  const isExpanded = useNotebookExpandedStore((state) =>
    !notebook ? false : state.expanded[notebook.id]
  );
  const { colors } = useThemeColors();

  return selectedNotebooks.find(
    (n) => n.id === notebook?.id
  ) ? null : !notebook ? (
    <View
      style={{
        height: 45
      }}
    />
  ) : (
    <View
      style={{
        minHeight: 45,
        borderRadius: 0
      }}
    >
      <Pressable
        onPress={() => onPress(notebook)}
        style={{
          flexDirection: "row",
          paddingHorizontal: 12,
          height: 45
        }}
      >
        {nestedNotebooks?.placeholders.length ? (
          <IconButton
            name={isExpanded ? "chevron-down" : "chevron-right"}
            color={colors.primary.icon}
            size={20}
            onPress={() => {
              if (!notebook) return;
              useNotebookExpandedStore.getState().setExpanded(notebook.id);
            }}
          />
        ) : (
          <View
            style={{
              width: 35,
              height: 30,
              justifyContent: "center",
              alignItems: "center"
            }}
          />
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            flexGrow: 1,
            alignItems: "center"
          }}
        >
          <Paragraph
            numberOfLines={1}
            style={{
              color: colors.primary.paragraph,
              fontSize: 15
            }}
          >
            {notebook.title}
          </Paragraph>

          <IconButton
            name="plus"
            onPress={() => {
              if (!notebook) return;
              AddNotebookSheet.present(
                undefined,
                notebook,
                "move-notebooks",
                undefined,
                false
              );
            }}
            size={AppFontSize.lg}
          />
        </View>
      </Pressable>

      {nestedNotebooks?.placeholders?.length && isExpanded ? (
        <View
          style={{
            paddingLeft: level + 1 > 0 && level + 1 < 5 ? 15 : 0,
            marginTop: 5
          }}
        >
          {nestedNotebooks.placeholders.map((item, index) => (
            <NotebookItem
              key={notebook?.id + index}
              id={index}
              onPress={onPress}
              level={level + 1}
              items={nestedNotebooks}
              selectedNotebooks={selectedNotebooks}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};

MoveNotebookSheet.present = async (notebooks: Notebook[]) => {
  presentSheet({
    component: (ref, close) => (
      <MoveNotebookSheet selectedNotebooks={notebooks} close={close} />
    ),
    keyboardHandlerDisabled: true
  });
};
