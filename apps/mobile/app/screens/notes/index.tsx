import React, { useEffect, useRef, useState } from "react";
import { FloatingButton } from "../../components/container/floating-button";
import DelayLayout from "../../components/delay-layout";
import List from "../../components/list";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import Navigation, {
  NavigationProps,
  NotesScreenParams
} from "../../services/navigation";
import SearchService from "../../services/search";
import useNavigationStore, {
  HeaderRightButton,
  RouteName
} from "../../stores/use-navigation-store";
import { useNoteStore } from "../../stores/use-notes-store";
import { NoteType } from "../../utils/types";
import {
  getAlias,
  isSynced,
  openEditor,
  openMonographsWebpage,
  setOnFirstSave,
  toCamelCase
} from "./common";

export const WARNING_DATA = {
  title: "Some notes in this topic are not synced"
};

export const PLACEHOLDER_DATA = {
  heading: "Your notes",
  paragraph: "You have not added any notes yet.",
  button: "Add your first Note",
  action: openEditor,
  loading: "Loading your notes."
};

export const MONOGRAPH_PLACEHOLDER_DATA = {
  heading: "Your monographs",
  paragraph: "You have not published any notes as monographs yet.",
  button: "Learn more about monographs",
  action: openMonographsWebpage,
  loading: "Loading published notes.",
  type: "monographs",
  buttonIcon: "information-outline"
};

export interface RouteProps<T extends RouteName> extends NavigationProps<T> {
  get: (params: NotesScreenParams, grouped?: boolean) => NoteType[];
  placeholderData: any;
  onPressFloatingButton: () => void;
  focusControl?: boolean;
  canGoBack?: boolean;
  rightButtons?: (params: NotesScreenParams) => HeaderRightButton[];
}

function getItemType(routeName: RouteName) {
  if (routeName === "TaggedNotes") return "tag";
  if (routeName === "ColoredNotes") return "color";
  if (routeName === "TopicNotes") return "topic";
  if (routeName === "Monographs") return "monograph";
  return "note";
}

const NotesPage = ({
  route,
  navigation,
  get,
  placeholderData,
  onPressFloatingButton,
  focusControl = true,
  canGoBack,
  rightButtons
}: RouteProps<
  "NotesPage" | "TaggedNotes" | "Monographs" | "ColoredNotes" | "TopicNotes"
>) => {
  const params = useRef<NotesScreenParams>(route?.params);
  const [notes, setNotes] = useState<NoteType[]>(get(route.params, true));
  const [warning, setWarning] = useState(!isSynced(route.params));
  const loading = useNoteStore((state) => state.loading);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const alias = getAlias(params.current);
  const isMonograph = route.name === "Monographs";
  console.log(warning, "isWarning", isSynced(route.params));

  const isFocused = useNavigationFocus(navigation, {
    onFocus: (prev) => {
      Navigation.routeNeedsUpdate(route.name, onRequestUpdate);
      syncWithNavigation();
      if (focusControl) return !prev.current;
      return false;
    },
    onBlur: () => {
      setOnFirstSave(null);
      return false;
    },
    focusOnInit: !focusControl
  });

  const syncWithNavigation = () => {
    const { item, title } = params.current;
    //@ts-ignore
    let alias = getAlias(params.current);
    console.log(alias, title, "syncWithNavigation", params.current);
    useNavigationStore.getState().update(
      {
        name: route.name,
        title: alias || title,
        id: item?.id,
        type: "notes",
        //@ts-ignore
        notebookId: item?.notebookId,
        alias: route.name === "ColoredNotes" ? toCamelCase(alias) : alias,
        //@ts-ignore
        color:
          route.name === "ColoredNotes" ? item.title?.toLowerCase() : undefined
      },
      params.current.canGoBack,
      rightButtons && rightButtons(params.current)
    );
    SearchService.prepareSearch = prepareSearch;
    useNavigationStore.getState().setButtonAction(onPressFloatingButton);

    !isMonograph &&
      setOnFirstSave({
        type: getItemType(route.name),
        id: item.id,
        color: item.title,
        //@ts-ignore
        notebook: item.notebookId
      });
  };

  const onRequestUpdate = (data?: NotesScreenParams) => {
    const isNew = data && data?.item?.id !== params.current?.item?.id;
    if (data) params.current = data;
    params.current.title = params.current.title || params.current.item.title;
    const { item } = params.current;
    try {
      if (isNew) setLoadingNotes(true);
      let notes = get(params.current, true) as NoteType[];
      if (
        (item.type === "tag" || item.type === "color") &&
        (!notes || notes.length === 0)
      ) {
        return Navigation.goBack();
      }
      if (item.type === "topic") setWarning(!isSynced(params.current));
      setNotes(notes);
      syncWithNavigation();
    } catch (e) {}
  };

  useEffect(() => {
    if (loadingNotes) {
      setTimeout(() => setLoadingNotes(false), 300);
    }
  }, [notes]);

  useEffect(() => {
    eSubscribeEvent(route.name, onRequestUpdate);
    return () => {
      setOnFirstSave(null);
      eUnSubscribeEvent(route.name, onRequestUpdate);
    };
  }, []);

  const prepareSearch = () => {
    const { item } = params.current;
    SearchService.update({
      placeholder: `Search in ${alias}`,
      type: "notes",
      title: item.type === "tag" ? "#" + alias : toCamelCase(item.title),
      get: () => {
        return get(params.current, false);
      }
    });
  };

  return (
    <DelayLayout
      color={
        route.name === "ColoredNotes"
          ? params.current?.item.title.toLowerCase()
          : undefined
      }
      wait={loading || loadingNotes}
    >
      <List
        listData={notes}
        warning={warning ? WARNING_DATA : null}
        type="notes"
        refreshCallback={onRequestUpdate}
        loading={loading || !isFocused}
        screen="Notes"
        headerProps={{
          heading: params.current.title,
          color:
            route.name === "ColoredNotes"
              ? params.current?.item.title.toLowerCase()
              : null
        }}
        placeholderData={placeholderData}
      />

      {notes?.length > 0 || (isFocused && !isMonograph) ? (
        <FloatingButton title="Create a note" onPress={onPressFloatingButton} />
      ) : null}
    </DelayLayout>
  );
};

export default NotesPage;
