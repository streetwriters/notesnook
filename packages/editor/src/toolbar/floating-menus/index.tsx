import { TableRowFloatingMenu, TableColumnFloatingMenu } from "./table/table";
import { SearchReplaceFloatingMenu } from "./search-replace";
import { FloatingMenuProps } from "./types";
import { DesktopOnly, MobileOnly } from "../../components/responsive";
import { ImageToolbar } from "./image";

export function EditorFloatingMenus(props: FloatingMenuProps) {
  return (
    <>
      {/* <DesktopOnly>
        <TableRowFloatingMenu {...props} />
        <TableColumnFloatingMenu {...props} />
      </DesktopOnly> */}
      <SearchReplaceFloatingMenu {...props} />
    </>
  );
}
