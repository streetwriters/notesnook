import ArrowBackIcon from "mdi-react/ArrowBackIcon";
import CloudUploadOutlineIcon from "mdi-react/CloudUploadOutlineIcon";
import CrownIcon from "mdi-react/CrownIcon";
import DotsHorizontalIcon from "mdi-react/DotsHorizontalIcon";
import ArrowULeftTopIcon from "mdi-react/ArrowULeftTopIcon";
import ArrowURightTopIcon from "mdi-react/ArrowURightTopIcon";
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

export default React.memo(
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
  }) {
    const insets = useSafeArea();
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: noHeader ? `${insets.top}px` : `${50 + insets.top}px`,
          backgroundColor: "var(--nn_bg)",
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
          >
            <Button
              onPress={() => {
                post(EventTypes.back);
              }}
              preventDefault={false}
              style={{
                borderWidth: 0,
                borderRadius: 100,
                color: "var(--nn_icon)",
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
                size={27}
                style={{
                  position: "absolute"
                }}
                color="var(--nn_pri)"
              />
            </Button>

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
                  color: "var(--nn_icon)",
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
                  color={!hasUndo ? "var(--nn_nav)" : "var(--nn_pri)"}
                  size={25}
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
                  color: "var(--nn_icon)",
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
                  color={!hasRedo ? "var(--nn_nav)" : "var(--nn_pri)"}
                  size={25}
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
                    color: "var(--nn_icon)",
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
                    size={25}
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
                  color: "var(--nn_icon)",
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
                  size={25}
                  style={{
                    position: "absolute"
                  }}
                  color="var(--nn_pri)"
                />
              </Button>
              <Button
                onPress={() => {
                  post(EventTypes.monograph);
                }}
                preventDefault={false}
                style={{
                  borderWidth: 0,
                  borderRadius: 100,
                  color: "var(--nn_icon)",
                  marginRight: 10,
                  width: 39,
                  height: 39,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  position: "relative"
                }}
              >
                <CloudUploadOutlineIcon
                  size={25}
                  style={{
                    position: "absolute"
                  }}
                  color="var(--nn_pri)"
                />
              </Button>

              <Button
                onPress={() => {
                  post(EventTypes.properties);
                }}
                preventDefault={false}
                style={{
                  borderWidth: 0,
                  borderRadius: 100,
                  color: "var(--nn_icon)",
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
                  size={25}
                  style={{
                    position: "absolute"
                  }}
                  color="var(--nn_pri)"
                />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  },
  (prev, next) => {
    if (
      prev.noHeader !== next.noHeader ||
      prev.settings.premium !== next.settings.premium ||
      prev.hasRedo !== next.hasRedo ||
      prev.hasUndo !== next.hasUndo
    )
      return false;

    return true;
  }
);
