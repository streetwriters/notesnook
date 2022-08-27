import { useEffect, useState } from "react";
import { View } from "react-native";
import { presentSheet } from "../../../services/event-manager";
import { useThemeStore } from "../../../stores/use-theme-store";
import useSyncProgress from "../../../hooks/use-sync-progress";
import { SIZE } from "../../../utils/size";
import Seperator from "../../ui/seperator";
import { ProgressBarComponent } from "../../ui/svg/lazy";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

export const Progress = () => {
  const colors = useThemeStore((state) => state.colors);
  const { progress } = useSyncProgress();
  const [currentProgress, setCurrentProgress] = useState(0.1);

  useEffect(() => {
    const nextProgress = progress ? progress?.current / progress?.total : 0.1;

    setCurrentProgress((currentProgress) => {
      if (currentProgress > nextProgress) return currentProgress;
      return progress ? progress?.current / progress?.total : 0.1;
    });
  }, [progress]);

  return (
    <View
      style={{
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 25,
        paddingBottom: 15
      }}
    >
      <Heading size={SIZE.lg}>Syncing your data</Heading>
      <Paragraph>Please wait while we sync all your data.</Paragraph>
      <Seperator />
      <View
        style={{
          width: 200
        }}
      >
        <ProgressBarComponent
          height={5}
          width={null}
          animated={true}
          useNativeDriver
          progress={currentProgress || 0.1}
          unfilledColor={colors.nav}
          color={colors.accent}
          borderWidth={0}
        />
      </View>

      {progress ? (
        <Paragraph color={colors.icon}>
          {progress.type?.slice(0, 1).toUpperCase() + progress.type?.slice(1)}
          ing {progress?.current}/{progress?.total}
        </Paragraph>
      ) : null}
    </View>
  );
};

Progress.present = () => {
  presentSheet({
    component: <Progress />,
    disableClosing: true,
    context: "sync_progress"
  });
};
