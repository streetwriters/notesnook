import React, { Suspense } from "react";
import EditorLoading from "../editor/loading";
const ReactQuill = React.lazy(() => import("../editor/react-quill"));

function SimpleEditor(props) {
  const { delta, container, id, pref } = props;

  return (
    <Suspense fallback={<EditorLoading />}>
      <ReactQuill
        ref={pref}
        id={id}
        modules={{ toolbar: [] }}
        initialContent={delta}
        onQuillInitialized={() => {
          const toolbar = document.querySelector(
            `${container} .ql-toolbar.ql-snow`
          );
          if (toolbar) toolbar.remove();
        }}
        placeholder="Type anything here"
        container={container}
      />
    </Suspense>
  );
}
export default SimpleEditor;
