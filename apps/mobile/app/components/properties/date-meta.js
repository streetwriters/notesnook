import { View } from "react-native";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";
import { timeConverter } from "../../utils/time";
import Paragraph from "../ui/typography/paragraph";

export const DateMeta = ({ item }) => {
  const colors = useThemeStore((state) => state.colors);

  const getNameFromKey = (key) => {
    switch (key) {
      case "dateCreated":
        return "Created at:";
      case "dateEdited":
        return "Last edited at:";
      case "dateModified":
        return "Last modified at:";
      case "dateDeleted":
        return "Deleted at:";
      case "dateUploaded":
        return "Uploaded at:";
      default:
        return key;
    }
  };

  const renderItem = (key) =>
    key.startsWith("date") ? (
      <View
        key={key}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: 3
        }}
      >
        <Paragraph size={SIZE.xs} color={colors.icon}>
          {getNameFromKey(key)}
        </Paragraph>
        <Paragraph size={SIZE.xs} color={colors.icon}>
          {timeConverter(item[key])}
        </Paragraph>
      </View>
    ) : null;

  return (
    <View
      style={{
        paddingVertical: 5,
        marginTop: 5,
        borderTopWidth: 1,
        borderTopColor: colors.nav,
        paddingHorizontal: 12
      }}
    >
      {Object.keys(item).map(renderItem)}
    </View>
  );
};
