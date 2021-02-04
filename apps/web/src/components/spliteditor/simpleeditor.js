import React, { Suspense } from "react";
import EditorLoading from "../editor/loading";
const ReactMCE = React.lazy(() => import("../editor/tinymce"));

function SimpleEditor(props) {
  const { content, pref } = props;

  return (
    <Suspense fallback={<EditorLoading />}>
      <ReactMCE
        editorRef={pref}
        simple
        initialValue={content}
        placeholder="Type anything here"
      />
    </Suspense>
  );
}
export default SimpleEditor;
