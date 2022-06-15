export function SearchReplaceFloatingMenu(props) {
    var editor = props.editor;
    var isSearching = editor.storage.searchreplace.isSearching;
    if (!isSearching)
        return null;
    return null;
    // return (
    //   <>
    //     <PopupPresenter
    //       mobile="sheet"
    //       desktop="menu"
    //       isOpen
    //       onClose={() => editor.commands.endSearch()}
    //       options={{
    //         type: "autocomplete",
    //         position: {
    //           target:
    //             document.querySelector<HTMLElement>(".editor-toolbar") || "mouse",
    //           isTargetAbsolute: true,
    //           location: "below",
    //           align: "end",
    //         },
    //       }}
    //     >
    //       <SearchReplacePopup editor={editor} />
    //     </PopupPresenter>
    //   </>
    // );
}
