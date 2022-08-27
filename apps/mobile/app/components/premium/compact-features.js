import { ScrollView } from "react-native";
import { FeatureBlock } from "./feature";

export const CompactFeatures = ({
  vertical,
  features = [],
  maxHeight = 500,
  scrollRef
}) => {
  let data = vertical
    ? features
    : [
        {
          highlight: "Everything",
          content: "in basic",
          icon: "emoticon-wink"
        },
        {
          highlight: "Unlimited",
          content: "notebooks",
          icon: "notebook"
        },
        {
          highlight: "File & image",
          content: "attachments",
          icon: "attachment"
        },
        {
          highlight: "Instant",
          content: "syncing",
          icon: "sync"
        },
        {
          highlight: "Private",
          content: "vault",
          icon: "shield"
        },
        {
          highlight: "Rich text",
          content: "editing",
          icon: "square-edit-outline"
        },
        {
          highlight: "PDF & markdown",
          content: "exports",
          icon: "file"
        },
        {
          highlight: "Encrypted",
          content: "backups",
          icon: "backup-restore"
        }
      ];

  return (
    <ScrollView
      horizontal={!vertical}
      nestedScrollEnabled
      onMomentumScrollEnd={() => {
        scrollRef?.current?.handleChildScrollEnd();
      }}
      showsHorizontalScrollIndicator={false}
      style={{
        width: "100%",
        maxHeight: maxHeight
      }}
    >
      {data.map((item) => (
        <FeatureBlock key={item.highlight} vertical={vertical} {...item} />
      ))}
    </ScrollView>
  );
};
