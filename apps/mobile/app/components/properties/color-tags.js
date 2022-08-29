import React, { useState } from "react";
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../e2e/test.ids";
import { db } from "../../common/database";
import { DDS } from "../../services/device-detection";
import { eSendEvent } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useMenuStore } from "../../stores/use-menu-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { dWidth } from "../../utils";
import { COLORS_NOTE } from "../../utils/color-scheme";
import { refreshNotesPage } from "../../utils/events";
import { SIZE } from "../../utils/size";
import { PressableButton } from "../ui/pressable";
export const ColorTags = ({ item }) => {
  const [note, setNote] = useState(item);
  const setColorNotes = useMenuStore((state) => state.setColorNotes);
  const dimensions = useSettingStore((state) => state.dimensions);
  let width = dimensions.width > 600 ? 600 : 500;

  const changeColor = async (color) => {
    if (note.color === color.name) {
      await db.notes.note(note.id).uncolor();
    } else {
      await db.notes.note(note.id).color(color.name);
    }
    let _note = db.notes.note(note.id).data;
    setNote({ ..._note });
    setColorNotes();
    Navigation.queueRoutesForUpdate(
      "Notes",
      "Favorites",
      "ColoredNotes",
      "TaggedNotes",
      "TopicNotes"
    );
    eSendEvent(refreshNotesPage);
  };

  const _renderColor = (c) => {
    const color = {
      name: c,
      value: COLORS_NOTE[c?.toLowerCase()]
    };

    return (
      <PressableButton
        type="accent"
        accentColor={color.name.toLowerCase()}
        testID={notesnook.ids.dialogs.actionsheet.color(c)}
        key={color.value}
        onPress={() => changeColor(color)}
        customStyle={{
          width: DDS.isTab ? width / 10 : dWidth / 9,
          height: DDS.isTab ? width / 10 : dWidth / 9,
          borderRadius: 100,
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        {note.color?.toLowerCase() === color.name ? (
          <Icon testID="icon-check" name="check" color="white" size={SIZE.lg} />
        ) : null}
      </PressableButton>
    );
  };

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 12,
        width: "100%",
        marginVertical: 10,
        marginTop: 20,
        alignItems: "center",
        justifyContent: "space-between"
      }}
    >
      {Object.keys(COLORS_NOTE).map(_renderColor)}
    </View>
  );
};
