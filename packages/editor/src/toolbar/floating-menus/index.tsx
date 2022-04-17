import { TableRowFloatingMenu, TableColumnFloatingMenu } from "./table";
import { FloatingMenuProps } from "./types";

export function EditorFloatingMenus(props: FloatingMenuProps) {
  return (
    <>
      <TableRowFloatingMenu {...props} />
      <TableColumnFloatingMenu {...props} />
    </>
  );
}
