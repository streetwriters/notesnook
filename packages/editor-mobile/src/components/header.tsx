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

import { ControlledMenu, MenuItem as MenuItemInner } from "@szhsin/react-menu";
import ArrowBackIcon from "mdi-react/ArrowBackIcon";
import ArrowForwardIcon from "mdi-react/ArrowForwardIcon";
import ArrowULeftTopIcon from "mdi-react/ArrowULeftTopIcon";
import ArrowURightTopIcon from "mdi-react/ArrowURightTopIcon";
import DotsHorizontalIcon from "mdi-react/DotsHorizontalIcon";
import DotsVerticalIcon from "mdi-react/DotsVerticalIcon";
import FullscreenIcon from "mdi-react/FullscreenIcon";
import MagnifyIcon from "mdi-react/MagnifyIcon";
import PlusIcon from "mdi-react/PlusIcon";

import PencilLockIcon from "mdi-react/PencilLockIcon";
import TableOfContentsIcon from "mdi-react/TableOfContentsIcon";
import React, { useRef, useState } from "react";
import { useSafeArea } from "../hooks/useSafeArea";
import { useTabContext, useTabStore } from "../hooks/useTabStore";
import { Settings } from "../utils";
import { EditorEvents } from "../utils/editor-events";
import styles from "./styles.module.css";
import { strings } from "@notesnook/intl";

const menuClassName = ({ state }: any) =>
  state === "opening"
    ? styles.menuOpening
    : state === "closing"
    ? styles.menuClosing
    : styles.menu;

const menuItemClassName = ({ hover, disabled }: any) =>
  disabled
    ? styles.menuItemDisabled
    : hover
    ? styles.menuItemHover
    : styles.menuItem;

const MenuItem = (props: any) => (
  <MenuItemInner {...props} className={menuItemClassName} />
);

const Button = ({
  onPress,
  children,
  style,
  preventDefault = true,
  fwdRef,
  onClick
}: {
  onPress?: () => void;
  onClick?: (event: any) => void;
  children: React.ReactNode;
  style: React.CSSProperties;
  preventDefault?: boolean;
  fwdRef?: any;
}) => {
  return (
    <button
      ref={fwdRef}
      className={styles.btn_header}
      style={style}
      onMouseDown={(e) => {
        if (preventDefault) e.preventDefault();
        onPress?.();
        onClick?.(e);
      }}
    >
      {children}
    </button>
  );
};

function Header({
  noHeader,
  settings,
  hasUndo,
  hasRedo
}: {
  noHeader: boolean;
  settings: Settings;
  hasUndo: boolean;
  hasRedo: boolean;
}): JSX.Element {
  const tab = useTabContext();
  const editor = editors[tab.id];
  const insets = useSafeArea();
  const openedTabsCount = useTabStore((state) => state.tabs.length);
  const [isOpen, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [canGoBack, canGoForward] = useTabStore((state) => [
    state.canGoBack,
    state.canGoForward
  ]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: noHeader ? `${insets.top}px` : `${50 + insets.top}px`,
        backgroundColor: "var(--nn_primary_background)",
        position: "sticky",
        width: "100vw",
        zIndex: 999
      }}
    >
      {noHeader ? null : (
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            flexDirection: "row",
            paddingTop: insets.top,
            height: 50,
            alignItems: "center"
          }}
          id="header"
        >
          {settings.deviceMode !== "mobile" && !settings.fullscreen ? (
            <div />
          ) : (
            <Button
              onPress={() => {
                post(EditorEvents.back, undefined, tab.id, tab.session?.noteId);
              }}
              preventDefault={false}
              style={{
                borderWidth: 0,
                borderRadius: 100,
                color: "var(--nn_primary_icon)",
                marginLeft: 6,
                width: 40,
                height: 40,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                position: "relative"
              }}
            >
              <ArrowBackIcon
                size={28 * settings.fontScale}
                style={{
                  position: "absolute"
                }}
                color="var(--nn_primary_icon)"
              />
            </Button>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexDirection: "row"
            }}
          >
            {settings.deviceMode !== "mobile" && !settings.fullscreen ? (
              <Button
                onPress={() => {
                  post(
                    EditorEvents.fullscreen,
                    undefined,
                    tab.id,
                    tab.session?.noteId
                  );
                }}
                preventDefault={false}
                style={{
                  borderWidth: 0,
                  borderRadius: 100,
                  color: "var(--nn_primary_icon)",
                  marginRight: 10,
                  width: 39,
                  height: 39,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  position: "relative"
                }}
              >
                <FullscreenIcon
                  size={25 * settings.fontScale}
                  style={{
                    position: "absolute"
                  }}
                  color="var(--nn_primary_icon)"
                />
              </Button>
            ) : null}

            {tab.session?.readonly ? (
              <Button
                onPress={() => {
                  post(
                    "editor-events:disable-readonly-mode",
                    tab.session?.noteId
                  );
                }}
                fwdRef={btnRef}
                preventDefault={false}
                style={{
                  borderWidth: 0,
                  borderRadius: 100,
                  color: "var(--nn_primary_accent)",
                  marginRight: 12,
                  width: 39,
                  height: 39,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  position: "relative"
                }}
              >
                <PencilLockIcon
                  size={25 * settings.fontScale}
                  style={{
                    position: "absolute"
                  }}
                  color="var(--nn_primary_accent)"
                />
              </Button>
            ) : null}

            <Button
              onPress={() => {
                editor?.commands.undo();
              }}
              style={{
                borderWidth: 0,
                borderRadius: 100,
                color: "var(--nn_primary_icon)",
                marginRight: 10,
                width: 39,
                height: 39,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative"
              }}
            >
              <ArrowULeftTopIcon
                color={
                  !hasUndo
                    ? "var(--nn_secondary_border)"
                    : "var(--nn_primary_icon)"
                }
                size={25 * settings.fontScale}
                style={{
                  position: "absolute"
                }}
              />
            </Button>

            <Button
              onPress={() => {
                editor?.commands.redo();
              }}
              style={{
                borderWidth: 0,
                borderRadius: 100,
                color: "var(--nn_primary_icon)",
                marginRight: 10,
                width: 39,
                height: 39,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative"
              }}
            >
              <ArrowURightTopIcon
                color={
                  !hasRedo
                    ? "var(--nn_secondary_border)"
                    : "var(--nn_primary_icon)"
                }
                size={25 * settings.fontScale}
                style={{
                  position: "absolute"
                }}
              />
            </Button>

            <Button
              onPress={() => {
                post(
                  EditorEvents.showTabs,
                  undefined,
                  tab.id,
                  tab.session?.noteId
                );
              }}
              preventDefault={false}
              style={{
                borderWidth: 0,
                borderRadius: 100,
                color: "var(--nn_primary_icon)",
                marginRight: 12,
                width: 39,
                height: 39,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative"
              }}
            >
              <div
                style={{
                  border: "2px solid var(--nn_primary_icon)",
                  width: 19 * settings.fontScale,
                  height: 19 * settings.fontScale,
                  minWidth: 19 * settings.fontScale,
                  borderRadius: 5,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                <p
                  style={{
                    fontSize:
                      openedTabsCount > 100
                        ? 10 * settings.fontScale
                        : 12 * settings.fontScale
                  }}
                >
                  {openedTabsCount}
                </p>
              </div>
            </Button>

            <Button
              fwdRef={btnRef}
              onPress={() => {
                if (tab.session?.locked) {
                  post(
                    EditorEvents.properties,
                    undefined,
                    tab.id,
                    tab.session?.noteId
                  );
                } else {
                  setOpen(!isOpen);
                }
              }}
              preventDefault={false}
              style={{
                borderWidth: 0,
                borderRadius: 100,
                color: "var(--nn_primary_icon)",
                marginRight: 12,
                width: 39,
                height: 39,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative"
              }}
            >
              {tab.session?.locked ? (
                <DotsHorizontalIcon
                  size={25 * settings.fontScale}
                  style={{
                    position: "absolute"
                  }}
                  color="var(--nn_primary_icon)"
                />
              ) : (
                <DotsVerticalIcon
                  size={25 * settings.fontScale}
                  style={{
                    position: "absolute"
                  }}
                  color="var(--nn_primary_icon)"
                />
              )}
            </Button>

            <ControlledMenu
              align="end"
              anchorPoint={{
                x: window.innerWidth - 10,
                y: 70
              }}
              state={isOpen ? "open" : "closed"}
              menuClassName={menuClassName}
              onClose={() => {
                setOpen(false);
              }}
              autoFocus={false}
              onItemClick={(e) => {
                switch (e.value) {
                  case "toc":
                    post(
                      EditorEvents.toc,
                      editorControllers[tab.id]?.getTableOfContents(),
                      tab.id,
                      tab.session?.noteId
                    );
                    break;
                  case "search":
                    editor?.commands.startSearch();
                    break;
                  case "newNote":
                    post(
                      EditorEvents.newNote,
                      undefined,
                      tab.id,
                      tab.session?.noteId
                    );
                    break;
                  case "properties":
                    post(
                      EditorEvents.properties,
                      undefined,
                      tab.id,
                      tab.session?.noteId
                    );
                    break;
                  default:
                    break;
                }
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  flex: 1,
                  paddingTop: 5
                }}
              >
                <Button
                  onPress={() => {
                    post(
                      EditorEvents.goBack,
                      undefined,
                      tab.id,
                      tab.session?.noteId
                    );
                    setOpen(false);
                  }}
                  style={{
                    borderWidth: 0,
                    borderRadius: 100,
                    color: "var(--nn_primary_icon)",
                    width: 39,
                    height: 39,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "relative"
                  }}
                >
                  <ArrowBackIcon
                    color={
                      !canGoBack
                        ? "var(--nn_secondary_border)"
                        : "var(--nn_primary_icon)"
                    }
                    size={25 * settings.fontScale}
                    style={{
                      position: "absolute"
                    }}
                  />
                </Button>

                <Button
                  onPress={() => {
                    post(
                      EditorEvents.goForward,
                      undefined,
                      tab.id,
                      tab.session?.noteId
                    );
                    setOpen(false);
                  }}
                  style={{
                    borderWidth: 0,
                    borderRadius: 100,
                    color: "var(--nn_primary_icon)",
                    width: 39,
                    height: 39,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "relative"
                  }}
                >
                  <ArrowForwardIcon
                    color={
                      !canGoForward
                        ? "var(--nn_secondary_border)"
                        : "var(--nn_primary_icon)"
                    }
                    size={25 * settings.fontScale}
                    style={{
                      position: "absolute"
                    }}
                  />
                </Button>

                <Button
                  onPress={() => {
                    editor?.commands.startSearch();
                    setOpen(false);
                  }}
                  style={{
                    borderWidth: 0,
                    borderRadius: 100,
                    color: "var(--nn_primary_icon)",
                    width: 39,
                    height: 39,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "relative"
                  }}
                >
                  <MagnifyIcon
                    size={28 * settings.fontScale}
                    style={{
                      position: "absolute"
                    }}
                    color="var(--nn_primary_icon)"
                  />
                </Button>
              </div>

              <MenuItem
                value="newNote"
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center"
                }}
              >
                <PlusIcon
                  size={22 * settings.fontScale}
                  color="var(--nn_primary_icon)"
                />
                <span
                  style={{
                    color: "var(--nn_primary_paragraph)"
                  }}
                >
                  New note
                </span>
              </MenuItem>

              <MenuItem
                value="toc"
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center"
                }}
              >
                <TableOfContentsIcon
                  size={22 * settings.fontScale}
                  color="var(--nn_primary_icon)"
                />
                <span
                  style={{
                    color: "var(--nn_primary_paragraph)"
                  }}
                >
                  {strings.toc()}
                </span>
              </MenuItem>
              <MenuItem
                value="properties"
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center"
                }}
              >
                <DotsHorizontalIcon
                  size={22 * settings.fontScale}
                  color="var(--nn_primary_icon)"
                />
                <span
                  style={{
                    color: "var(--nn_primary_paragraph)"
                  }}
                >
                  {strings.properties()}
                </span>
              </MenuItem>
            </ControlledMenu>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(Header, (prev, next) => {
  if (
    prev.settings.deviceMode !== next.settings.deviceMode ||
    prev.settings.fullscreen !== next.settings.fullscreen ||
    prev.settings.premium !== next.settings.premium ||
    prev.settings.fontScale !== next.settings.fontScale ||
    prev.noHeader !== next.noHeader ||
    prev.hasRedo !== next.hasRedo ||
    prev.hasUndo !== next.hasUndo
  )
    return false;

  return true;
});
