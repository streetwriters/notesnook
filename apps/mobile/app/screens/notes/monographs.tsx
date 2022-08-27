import { groupArray } from "@streetwriters/notesnook-core/utils/grouping";
import NotesPage, { PLACEHOLDER_DATA } from ".";
import Navigation, {
  NavigationProps,
  NotesScreenParams
} from "../../services/navigation";
import { db } from "../../common/database";
import { MonographType } from "../../utils/types";
import { openMonographsWebpage } from "./common";

export const Monographs = ({
  navigation,
  route
}: NavigationProps<"Monographs">) => {
  return (
    <NotesPage
      navigation={navigation}
      route={route}
      get={Monographs.get}
      placeholderData={PLACEHOLDER_DATA}
      onPressFloatingButton={openMonographsWebpage}
      canGoBack={route.params.canGoBack}
      focusControl={true}
    />
  );
};

Monographs.get = (params: NotesScreenParams, grouped = true) => {
  const notes = db.monographs?.all || [];
  return grouped
    ? groupArray(notes, db.settings?.getGroupOptions("notes"))
    : notes;
};

Monographs.navigate = (item: MonographType, canGoBack: boolean) => {
  Navigation.navigate<"Monographs">(
    {
      name: "Monographs",
      type: "monograph"
    },
    {
      //@ts-ignore
      item: { type: "monograph" },
      canGoBack,
      title: "Monographs"
    }
  );
};
