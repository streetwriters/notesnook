import { Editor } from "@tiptap/react";
import { useRef, useState } from "react";

export default function StatusBar({ editor }: { editor: Editor | null }) {
  const [status, setStatus] = useState({
    date: "",
    saved: "",
  });
  const words = editor?.storage?.characterCount?.words() + " words";
  const statusBar = useRef({
    set: setStatus,
  });
  //@ts-ignore
  globalThis.statusBar = statusBar;

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
        height: 15,
        paddingRight: 12,
        paddingLeft: 12,
      }}
    >
      <p style={paragraphStyle}>{words}</p>
      <p style={paragraphStyle}>{status.date}</p>
      <p style={paragraphStyle}>{status.saved}</p>
    </div>
  );
}
