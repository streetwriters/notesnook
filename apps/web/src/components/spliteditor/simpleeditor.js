import React, { useEffect } from "react";
import ReactQuill from "../editor/react-quill";

function SimpleEditor(props) {
  const { delta, container, id, pref } = props;
  useEffect(() => {
    const toolbar = document.querySelector(`${container} .ql-toolbar.ql-snow`);
    toolbar.remove();
  }, [container]);
  return (
    <ReactQuill
      ref={pref}
      id={id}
      modules={{ toolbar: [] }}
      initialContent={delta}
      placeholder="Type anything here"
      container={container}
    />
  );
}
export default SimpleEditor;
