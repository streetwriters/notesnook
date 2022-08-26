import React from "react";
import { FloatingButton } from "../../components/container/floating-button";
import DelayLayout from "../../components/delay-layout";
import { presentDialog } from "../../components/dialog/functions";
import List from "../../components/list";
import { ToastEvent } from "../../services/event-manager";
import Navigation, { NavigationProps } from "../../services/navigation";
import SearchService from "../../services/search";
import SettingsService from "../../services/settings";
import useNavigationStore from "../../stores/use-navigation-store";
import { useSelectionStore } from "../../stores/use-selection-store";
import { useTrashStore } from "../../stores/use-trash-store";
import { db } from "../../common/database";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";

const prepareSearch = () => {
  SearchService.update({
    placeholder: "Search in trash",
    type: "trash",
    title: "Trash",
    get: () => db.trash?.all
  });
};

const onPressFloatingButton = () => {
  presentDialog({
    title: "Clear trash",
    paragraph: "Are you sure you want to clear the trash?",
    positiveText: "Clear",
    negativeText: "Cancel",
    positivePress: async () => {
      await db.trash?.clear();
      useTrashStore.getState().setTrash();
      useSelectionStore.getState().clearSelection(true);
      ToastEvent.show({
        heading: "Trash cleared",
        message:
          "All notes and notebooks in the trash have been removed permanantly.",
        type: "success",
        context: "local"
      });
    },
    positiveType: "errorShade"
  });
};

const PLACEHOLDER_DATA = {
  heading: "Trash",
  paragraph: "Items in the trash will be permanently deleted after 7 days.",
  button: null,
  loading: "Loading trash items"
};

export const Trash = ({ navigation, route }: NavigationProps<"Trash">) => {
  const trash = useTrashStore((state) => state.trash);
  const isFocused = useNavigationFocus(navigation, {
    onFocus: (prev) => {
      Navigation.routeNeedsUpdate(
        route.name,
        Navigation.routeUpdateFunctions[route.name]
      );
      useNavigationStore.getState().update({
        name: route.name
      });
      if (useTrashStore.getState().trash.length === 0) {
        useTrashStore.getState().setTrash();
      }
      SearchService.prepareSearch = prepareSearch;
      return false;
    },
    onBlur: () => false
  });

  return (
    <DelayLayout>
      <List
        listData={trash}
        type="trash"
        screen="Trash"
        loading={!isFocused}
        placeholderData={PLACEHOLDER_DATA}
        headerProps={{
          heading: "Trash"
        }}
      />

      {trash && trash.length !== 0 ? (
        <FloatingButton
          title="Clear all trash"
          onPress={onPressFloatingButton}
          shouldShow={true}
        />
      ) : null}
    </DelayLayout>
  );
};

export default Trash;
