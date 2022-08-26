import React from "react";
import DelayLayout from "../../components/delay-layout";
import List from "../../components/list";
import Navigation, { NavigationProps } from "../../services/navigation";
import SearchService from "../../services/search";
import SettingsService from "../../services/settings";
import useNavigationStore from "../../stores/use-navigation-store";
import { useTagStore } from "../../stores/use-tag-store";
import { db } from "../../common/database";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";

const prepareSearch = () => {
  SearchService.update({
    placeholder: "Search in tags",
    type: "tags",
    title: "Tags",
    get: () => db.tags?.all
  });
};

const PLACEHOLDER_DATA = {
  heading: "Your tags",
  paragraph: "You have not created any tags for your notes yet.",
  button: null,
  loading: "Loading your tags."
};

export const Tags = ({ navigation, route }: NavigationProps<"Tags">) => {
  const tags = useTagStore((state) => state.tags);
  const isFocused = useNavigationFocus(navigation, {
    onFocus: (prev) => {
      Navigation.routeNeedsUpdate(
        route.name,
        Navigation.routeUpdateFunctions[route.name]
      );
      useNavigationStore.getState().update({
        name: route.name
      });

      SearchService.prepareSearch = prepareSearch;
      return !prev?.current;
    },
    onBlur: () => false,
    delay: SettingsService.get().homepage === route.name ? 1 : -1
  });

  return (
    <DelayLayout>
      <List
        listData={tags}
        type="tags"
        headerProps={{
          heading: "Tags"
        }}
        loading={!isFocused}
        screen="Tags"
        placeholderData={PLACEHOLDER_DATA}
      />
    </DelayLayout>
  );
};

export default Tags;
