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

import ArrowBackIcon from "mdi-react/ArrowBackIcon";
import CrownIcon from "mdi-react/CrownIcon";
import DotsHorizontalIcon from "mdi-react/DotsHorizontalIcon";
import ArrowULeftTopIcon from "mdi-react/ArrowULeftTopIcon";
import ArrowURightTopIcon from "mdi-react/ArrowURightTopIcon";
import FullscreenIcon from "mdi-react/FullscreenIcon";
import MagnifyIcon from "mdi-react/MagnifyIcon";
import React from "react";
import { useSafeArea } from "../hooks/useSafeArea";
import { EventTypes, Settings } from "../utils";
import styles from "./styles.module.css";

const Button = ({
  onPress,
  children,
  style,
  preventDefault = true
}: {
  onPress: () => void;
  children: React.ReactNode;
  style: React.CSSProperties;
  preventDefault?: boolean;
}) => {
  return (
    <button
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
  const insets = useSafeArea();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: noHeader ? `${insets.top}px` : `${50 + insets.top}px`,
        backgroundColor: "var(--nn_primary_background)",
        position: "sticky",
        width: "100vw"
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
                post(EventTypes.back);
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
                size={27 * settings.fontScale}
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
                    ? "var(--nn_secondary_background)"
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
                    ? "var(--nn_secondary_background)"
                    : "var(--nn_primary_paragraph)"
                }
                size={25 * settings.fontScale}
                style={{
                  position: "absolute"
                }}
              />
            </Button>
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
                size={25 * settings.fontScale}
                style={{
                  position: "absolute"
                }}
                color="var(--nn_primary_paragraph)"
              />
            </Button>

            {settings.deviceMode !== "mobile" && !settings.fullscreen ? (
              <Button
                onPress={() => {
                  post(EventTypes.fullscreen);
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
                post(EventTypes.properties);
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
              <DotsHorizontalIcon
                size={25 * settings.fontScale}
                style={{
                  position: "absolute"
                }}
                color="var(--nn_primary_paragraph)"
              />
            </Button>
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
