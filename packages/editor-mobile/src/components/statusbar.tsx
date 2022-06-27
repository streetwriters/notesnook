import { Editor } from "notesnook-editor/dist/types";
import React, { RefObject, useEffect, useRef, useState } from "react";

export default function StatusBar({
  editor,
  container,
}: {
  editor: Editor | null;
  container: RefObject<HTMLDivElement>;
}) {
  const [status, setStatus] = useState({
    date: "",
    saved: "",
  });
  const [sticky, setSticky] = useState(false);
  const prevScroll = useRef(0);
  const lastStickyChangeTime = useRef(0);
  const words = editor?.storage?.characterCount?.words() + " words";
  const statusBar = useRef({
    set: setStatus,
  });
  //@ts-ignore
  globalThis.statusBar = statusBar;

  const onScroll = React.useCallback((event) => {
    //@ts-ignore
    const currentOffset = event.target.scrollTop;
    if (Date.now() - lastStickyChangeTime.current < 300) return;
    if (currentOffset > prevScroll.current) {
      setSticky(false);
    } else {
      setSticky(true);
    }
    lastStickyChangeTime.current = Date.now();
    prevScroll.current = currentOffset;
  }, []);

  useEffect(() => {
    const node = container.current;
    node?.addEventListener("scroll", onScroll);
    return () => {
      node?.removeEventListener("scroll", onScroll);
    };
  }, [onScroll, container]);

  const paragraphStyle = {
    marginTop: 0,
    marginBottom: 0,
    fontSize: "12px",
    color: "var(--nn_icon)",
    marginRight: 8,
  };

  return (
    <div
      style={{
        flexDirection: "row",
        display: "flex",
        height: sticky ? 20 : 15,
        paddingRight: 12,
        paddingLeft: 12,
        position: sticky ? "sticky" : "relative",
        top: 0,
        backgroundColor: "var(--nn_bg)",
        zIndex: 1,
      }}
    >
      <p style={paragraphStyle}>{words}</p>
      <p style={paragraphStyle}>{status.date}</p>
      <p style={paragraphStyle}>{status.saved}</p>
    </div>
  );
}
