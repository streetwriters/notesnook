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
import ArrowULeftTopIcon from "mdi-react/ArrowULeftTopIcon";
import ArrowURightTopIcon from "mdi-react/ArrowURightTopIcon";
import CrownIcon from "mdi-react/CrownIcon";
import DotsHorizontalIcon from "mdi-react/DotsHorizontalIcon";
import DotsVerticalIcon from "mdi-react/DotsVerticalIcon";
import FullscreenIcon from "mdi-react/FullscreenIcon";
import MagnifyIcon from "mdi-react/MagnifyIcon";
import TableOfContentsIcon from "mdi-react/TableOfContentsIcon";
import React, { useRef, useState } from "react";
import { useSafeArea } from "../hooks/useSafeArea";
import { useTabContext, useTabStore } from "../hooks/useTabStore";
import { EventTypes, Settings } from "../utils";
import styles from "./styles.module.css";

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
  fwdRef
}: {
  onPress: () => void;
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
        onPress();
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

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: noHeader ? `${insets.top}px` : `${50 + insets.top}px`,
        backgroundColor: "var(--nn_primary_background)",
        position: "sticky",
        width: "100vw",
        zIndex: 99999
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
                post(EventTypes.back, undefined, tab.id, tab.noteId);
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
                color="var(--nn_primary_paragraph)"
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
            {!settings.premium && (
              <Button
                onPress={() => {
                  post(EventTypes.pro);
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
                <CrownIcon
                  size={25 * settings.fontScale}
                  style={{
                    position: "absolute"
                  }}
                  color="orange"
                />
              </Button>
            )}

            {settings.deviceMode !== "mobile" && !settings.fullscreen ? (
              <Button
                onPress={() => {
                  post(EventTypes.fullscreen, undefined, tab.id, tab.noteId);
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
                  color="var(--nn_primary_paragraph)"
                />
              </Button>
            ) : null}

            <Button
              onPress={() => {
                post(EventTypes.showTabs, undefined, tab.id, tab.noteId);
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
                  border: "2.5px solid var(--nn_primary_icon)",
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
                    fontSize: 15 * settings.fontScale
                  }}
                >
                  {openedTabsCount}
                </p>
              </div>
            </Button>

            <Button
              onPress={() => {
                setOpen(!isOpen);
              }}
              fwdRef={btnRef}
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
              <DotsVerticalIcon
                size={25 * settings.fontScale}
                style={{
                  position: "absolute"
                }}
                color="var(--nn_primary_paragraph)"
              />
            </Button>

            <ControlledMenu
              align="end"
              anchorRef={btnRef}
              transition
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
                      EventTypes.toc,
                      editorControllers[tab.id]?.getTableOfContents(),
                      tab.id,
                      tab.noteId
                    );
                    break;
                  case "properties":
                    logger("info", "post properties...");
                    post(EventTypes.properties, undefined, tab.id, tab.noteId);
                    break;
                  default:
                    break;
                }
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%"
                }}
              >
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
                        : "var(--nn_primary_paragraph)"
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
                        : "var(--nn_primary_paragraph)"
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
                  <MagnifyIcon
                    size={28 * settings.fontScale}
                    style={{
                      position: "absolute"
                    }}
                    color="var(--nn_primary_paragraph)"
                  />
                </Button>
              </div>

              <MenuItem
                value="toc"
                style={{
                  display: "flex",
                  gap: 10
                }}
              >
                <TableOfContentsIcon
                  size={22 * settings.fontScale}
                  color="var(--nn_primary_paragraph)"
                />
                Table of contents
              </MenuItem>
              <MenuItem
                value="properties"
                style={{
                  display: "flex",
                  gap: 10
                }}
              >
                <DotsHorizontalIcon
                  size={22 * settings.fontScale}
                  color="var(--nn_primary_paragraph)"
                />
                Note Properties
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
