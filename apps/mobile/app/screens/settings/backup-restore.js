import { Platform, TouchableOpacity, View } from "react-native";
import Paragraph from "../../components/ui/typography/paragraph";
import Backup from "../../services/backup";
import PremiumService from "../../services/premium";
import SettingsService from "../../services/settings";
import { useSettingStore } from "../../stores/use-setting-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";

export const AutomaticBackupsSelector = () => {
  const colors = useThemeStore((state) => state.colors);
  const settings = useSettingStore((state) => state.settings);
  const updateAskForBackup = async () => {
    SettingsService.set({
      nextBackupRequestTime: Date.now() + 86400000 * 3
    });
  };

  return (
    <View
      style={{
        flexDirection: "row",
        borderRadius: 5,
        overflow: "hidden",
        flexShrink: 1,
        width: "100%"
      }}
    >
      {[
        {
          title: "Never",
          value: "useroff"
        },
        {
          title: "Daily",
          value: "daily"
        },
        {
          title: "Weekly",
          value: "weekly"
        },
        {
          title: "Monthly",
          value: "monthly"
        }
      ].map((item, index) => (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={async () => {
            if (item.value === "useroff") {
              await SettingsService.set({ reminder: item.value });
            } else {
              await PremiumService.verify(async () => {
                if (Platform.OS === "android") {
                  let granted = await Backup.checkBackupDirExists();
                  if (!granted) {
                    console.log("returning");
                    return;
                  }
                }
                await SettingsService.set({ reminder: item.value });
              });
            }
            updateAskForBackup();
          }}
          key={item.value}
          style={{
            backgroundColor:
              settings.reminder === item.value ? colors.accent : colors.nav,
            justifyContent: "center",
            alignItems: "center",
            width: "25%",
            height: 35,
            borderRightWidth: index !== 3 ? 1 : 0,
            borderRightColor: colors.border
          }}
        >
          <Paragraph
            color={settings.reminder === item.value ? "white" : colors.icon}
            size={SIZE.sm - 1}
          >
            {item.title}
          </Paragraph>
        </TouchableOpacity>
      ))}
    </View>
  );
};
