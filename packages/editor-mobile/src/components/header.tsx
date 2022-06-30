import ArrowBackIcon from "mdi-react/ArrowBackIcon";
import CloudUploadOutlineIcon from "mdi-react/CloudUploadOutlineIcon";
import CrownIcon from "mdi-react/CrownIcon";
import DotsHorizontalIcon from "mdi-react/DotsHorizontalIcon";
import MagnifyIcon from "mdi-react/MagnifyIcon";
import React, { useEffect } from "react";
import { useSafeArea } from "../hooks/useSafeArea";
import { useSettings } from "../hooks/useSettings";
import { EventTypes } from "../utils";
import styles from "./styles.module.css";

const Button = ({
  onPress,
  children,
  style,
}: {
  onPress: () => void;
  children: React.ReactNode;
  style: React.CSSProperties;
}) => {
  return (
    <button
      className={styles.btn_header}
      style={style}
      onMouseUp={(e) => {
        e.preventDefault();
      }}
      onMouseDown={(e) => e.preventDefault()}
      onTouchEnd={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPress();
      }}
      onTouchStart={(e) => {
        editor?.commands.blur();
        e.preventDefault();
      }}
    >
      {children}
    </button>
  );
};

export default React.memo(
  function Header({ noHeader }: { noHeader: boolean }) {
    const insets = useSafeArea();
    const settings = useSettings();
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: noHeader ? `${insets.top}px` : `${50 + insets.top}px`,
          backgroundColor: "var(--nn_bg)",
          position: "sticky",
          width: "100vw",
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
            }}
          >
            <Button
              onPress={() => {
                post(EventTypes.back);
              }}
              style={{
                borderWidth: 0,
                borderRadius: 100,
                color: "var(--nn_icon)",
                marginLeft: 6,
                width: 40,
                height: 40,
                display: "flex",
                justifyContent: "center",
                alignItems: "start",
                flexDirection: "column",
              }}
            >
              <ArrowBackIcon size={28} color="var(--nn_pri)" />
            </Button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexDirection: "row",
              }}
            >
              {!settings.premium && (
                <Button
                  onPress={() => {
                    post(EventTypes.pro);
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
                  }}
                >
                  <CrownIcon size={28} color="orange" />
                </Button>
              )}
              <Button
                onPress={() => {
                  //
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
                }}
              >
                <MagnifyIcon size={28} color="var(--nn_pri)" />
              </Button>
              <Button
                onPress={() => {
                  post(EventTypes.monograph);
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
                }}
              >
                <CloudUploadOutlineIcon size={28} color="var(--nn_pri)" />
              </Button>

              <Button
                onPress={() => {
                  post(EventTypes.properties);
                }}
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
                }}
              >
                <DotsHorizontalIcon size={28} color="var(--nn_pri)" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  },
  (prev, next) => prev.noHeader !== next.noHeader
);
