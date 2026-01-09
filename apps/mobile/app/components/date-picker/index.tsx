import { useThemeColors } from "@notesnook/theme";
import { useRef } from "react";
import { View } from "react-native";
import { defaultBorderRadius } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import DatePicker from "react-native-date-picker";
import dayjs from "dayjs";
import { strings } from "@notesnook/intl";
import { Button } from "../ui/button";

export default function DatePickerComponent(props: {
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}) {
  const { colors, isDark } = useThemeColors();
  const dateRef = useRef<Date>(dayjs().add(1, "day").toDate());
  return (
    <View
      style={{
        backgroundColor: colors.primary.background,
        borderRadius: defaultBorderRadius,
        padding: DefaultAppStyles.GAP,
        borderWidth: 0.5,
        borderColor: colors.primary.border,
        width: "80%",
        gap: DefaultAppStyles.GAP_VERTICAL
      }}
    >
      <DatePicker
        theme={isDark ? "dark" : "light"}
        mode="date"
        minimumDate={dayjs().add(1, "day").toDate()}
        onCancel={() => {
          close?.();
        }}
        date={dateRef.current}
        onDateChange={(date) => {
          dateRef.current = date;
        }}
      />

      <Button
        title={strings.setExpiry()}
        type="accent"
        style={{
          width: "100%"
        }}
        onPress={async () => {
          if (!dateRef.current) return;
          props.onConfirm(dateRef.current);
        }}
      />

      <Button
        title={strings.cancel()}
        type="secondary"
        style={{
          width: "100%"
        }}
        onPress={async () => {
          props.onCancel();
        }}
      />
    </View>
  );
}
