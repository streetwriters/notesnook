import React, { RefObject, useEffect, useRef, useState } from "react";

function StatusBar({ container }: { container: RefObject<HTMLDivElement> }) {
  const [status, setStatus] = useState({
    date: "",
    saved: ""
  });
  const [sticky, setSticky] = useState(false);
  const stickyRef = useRef(false);
  const prevScroll = useRef(0);
  const lastStickyChangeTime = useRef(0);
  const [words, setWords] = useState("0 words");
  const currentWords = useRef(words);
  const interval = useRef(0);
  const statusBar = useRef({
    set: setStatus
  });
  globalThis.statusBar = statusBar;

  const onScroll = React.useCallback((event) => {
    const currentOffset = event.target.scrollTop;
    if (currentOffset < 200) {
      if (stickyRef.current) {
        stickyRef.current = false;
        setSticky(false);
        lastStickyChangeTime.current = Date.now();
        prevScroll.current = currentOffset;
      }
      return;
    }
    if (Date.now() - lastStickyChangeTime.current < 300) return;
    if (currentOffset > prevScroll.current) {
      setSticky(false);
      stickyRef.current = false;
    } else {
      setSticky(true);
      stickyRef.current = true;
    }
    lastStickyChangeTime.current = Date.now();
    prevScroll.current = currentOffset;
  }, []);

  useEffect(() => {
    currentWords.current = words;
  }, [words]);

  useEffect(() => {
    clearInterval(interval.current);
    interval.current = setInterval(() => {
      const words = editor?.storage?.characterCount?.words() + " words";
      if (currentWords.current === words) return;
      setWords(words);
    }, 3000) as unknown as number;
    return () => {
      clearInterval(interval.current);
    };
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
    paddingBottom: 0
  };

  return (
    <div
      style={{
        flexDirection: "row",
        display: "flex",
        paddingRight: 12,
        paddingLeft: 12,
        position: sticky ? "sticky" : "relative",
        top: -3,
        backgroundColor: "var(--nn_bg)",
        zIndex: 1,
        justifyContent: sticky ? "center" : "flex-start",
        paddingTop: 2,
        paddingBottom: 2
      }}
    >
      <p style={paragraphStyle}>{words}</p>
      <p style={paragraphStyle}>{status.date}</p>
      <p style={paragraphStyle}>{status.saved}</p>
    </div>
  );
}

export default React.memo(StatusBar, () => true);
