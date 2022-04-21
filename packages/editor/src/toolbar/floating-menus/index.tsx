import { TableRowFloatingMenu, TableColumnFloatingMenu } from "./table";
import { SearchReplaceFloatingMenu } from "./search-replace";
import { FloatingMenuProps } from "./types";

export function EditorFloatingMenus(props: FloatingMenuProps) {
  return (
    <>
      <TableRowFloatingMenu {...props} />
      <TableColumnFloatingMenu {...props} />
      <SearchReplaceFloatingMenu {...props} />
    </>
  );
}
