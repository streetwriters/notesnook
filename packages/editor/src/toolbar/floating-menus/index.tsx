import {
  TableRowFloatingMenu,
  TableColumnFloatingMenu,
  TableFloatingMenu,
} from "./table/table";
import { SearchReplaceFloatingMenu } from "./search-replace";
import { FloatingMenuProps } from "./types";
import { DesktopOnly, MobileOnly } from "../../components/responsive";

export function EditorFloatingMenus(props: FloatingMenuProps) {
  return (
    <>
      <DesktopOnly>
        <TableRowFloatingMenu {...props} />
        <TableColumnFloatingMenu {...props} />
      </DesktopOnly>
      <MobileOnly>
        <TableFloatingMenu {...props} />
      </MobileOnly>
      <SearchReplaceFloatingMenu {...props} />
    </>
  );
}
