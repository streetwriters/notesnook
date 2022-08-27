import { useRef, useState } from "react";
import { View } from "react-native";
import { useThemeStore } from "../../../stores/use-theme-store";
import { useMenuStore } from "../../../stores/use-menu-store";
import { ToastEvent } from "../../../services/event-manager";
import { getTotalNotes } from "../../../utils";
import { db } from "../../../common/database";
import { SIZE } from "../../../utils/size";
import { IconButton } from "../../ui/icon-button";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

export const NotebookHeader = ({ notebook, onEditNotebook }) => {
  const colors = useThemeStore((state) => state.colors);
  const [isPinnedToMenu, setIsPinnedToMenu] = useState(
    db.settings.isPinned(notebook.id)
  );
  const setMenuPins = useMenuStore((state) => state.setMenuPins);
  const totalNotes = getTotalNotes(notebook);
  const shortcutRef = useRef();

  const onPinNotebook = async () => {
    try {
      if (isPinnedToMenu) {
        await db.settings.unpin(notebook.id);
      } else {
        await db.settings.pin(notebook.type, { id: notebook.id });
        ToastEvent.show({
          heading: "Shortcut created",
          type: "success"
        });
      }
      setIsPinnedToMenu(db.settings.isPinned(notebook.id));
      setMenuPins();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View
      style={{
        marginBottom: 5,
        padding: 0,
        width: "100%",
        paddingVertical: 15,
        paddingHorizontal: 12,
        alignSelf: "center",
        borderRadius: 10,
        paddingTop: 25
      }}
    >
      <Paragraph color={colors.icon} size={SIZE.xs}>
        {new Date(notebook.dateEdited).toLocaleString()}
      </Paragraph>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Heading size={SIZE.xxl}>{notebook.title}</Heading>

        <View
          style={{
            flexDirection: "row"
          }}
        >
          <IconButton
            name={isPinnedToMenu ? "link-variant-off" : "link-variant"}
            onPress={onPinNotebook}
            tooltipText={"Create shortcut in side menu"}
            fwdRef={shortcutRef}
            customStyle={{
              marginRight: 15,
              width: 40,
              height: 40
            }}
            type={isPinnedToMenu ? "grayBg" : "grayBg"}
            color={isPinnedToMenu ? colors.accent : colors.icon}
            size={SIZE.lg}
          />
          <IconButton
            size={SIZE.lg}
            onPress={onEditNotebook}
            tooltipText="Edit this notebook"
            name="pencil"
            type="grayBg"
            color={colors.icon}
            customStyle={{
              width: 40,
              height: 40
            }}
          />
        </View>
      </View>

      {notebook.description ? (
        <Paragraph size={SIZE.md} color={colors.pri}>
          {notebook.description}
        </Paragraph>
      ) : null}

      <Paragraph
        style={{
          marginTop: 10,
          fontStyle: "italic",
          fontFamily: null
        }}
        size={SIZE.xs}
        color={colors.icon}
      >
        {notebook.topics.length === 1
          ? "1 topic"
          : `${notebook.topics.length} topics`}
        ,{" "}
        {notebook && totalNotes > 1
          ? totalNotes + " notes"
          : totalNotes === 1
          ? totalNotes + " note"
          : "0 notes"}
      </Paragraph>
    </View>
  );
};
