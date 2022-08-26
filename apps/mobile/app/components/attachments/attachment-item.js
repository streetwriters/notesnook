import React from "react";
import { TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { formatBytes } from "../../utils";
import { db } from "../../common/database";
import { useAttachmentProgress } from "../../hooks/use-attachment-progress";
import { SIZE } from "../../utils/size";
import SheetProvider from "../sheet-provider";
import { IconButton } from "../ui/icon-button";
import { ProgressCircleComponent } from "../ui/svg/lazy";
import Paragraph from "../ui/typography/paragraph";
import Actions from "./actions";

function getFileExtension(filename) {
  var ext = /^.+\.([^.]+)$/.exec(filename);
  return ext == null ? "" : ext[1];
}

export const AttachmentItem = ({ attachment, encryption, setAttachments }) => {
  const colors = useThemeStore((state) => state.colors);
  const [currentProgress, setCurrentProgress] = useAttachmentProgress(
    attachment,
    encryption
  );
  const encryptionProgress = encryption
    ? useAttachmentStore((state) => state.encryptionProgress)
    : null;

  const onPress = () => {
    Actions.present(attachment, setAttachments, attachment.metadata.hash);
  };
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        flexDirection: "row",
        marginVertical: 5,
        justifyContent: "space-between",
        padding: 12,
        paddingVertical: 6,
        borderRadius: 5,
        backgroundColor: colors.nav
      }}
      type="grayBg"
    >
      <SheetProvider context={attachment.metadata.hash} />
      <View
        style={{
          flexShrink: 1,
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            marginLeft: -5
          }}
        >
          <Icon name="file" size={SIZE.xxxl} color={colors.icon} />

          <Paragraph
            adjustsFontSizeToFit
            size={6}
            color={colors.light}
            style={{
              position: "absolute"
            }}
          >
            {getFileExtension(attachment.metadata.filename).toUpperCase()}
          </Paragraph>
        </View>

        <View
          style={{
            flexShrink: 1,
            marginLeft: 10
          }}
        >
          <Paragraph
            size={SIZE.sm - 1}
            style={{
              flexWrap: "wrap",
              marginBottom: 2.5
            }}
            numberOfLines={1}
            lineBreakMode="middle"
            color={colors.pri}
          >
            {attachment.metadata.filename}
          </Paragraph>

          <Paragraph color={colors.icon} size={SIZE.xs}>
            {formatBytes(attachment.length)}{" "}
            {currentProgress?.type
              ? "(" + currentProgress.type + "ing - tap to cancel)"
              : ""}
          </Paragraph>
        </View>
      </View>

      {currentProgress || encryptionProgress || encryption ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (encryption) return;
            db.fs.cancel(attachment.metadata.hash);
            setCurrentProgress(null);
          }}
          style={{
            justifyContent: "center",
            marginLeft: 5,
            marginTop: 5,
            marginRight: -5
          }}
        >
          <ProgressCircleComponent
            size={SIZE.xxl}
            progress={
              encryptionProgress
                ? encryptionProgress
                : currentProgress?.value
                ? currentProgress?.value / 100
                : 0
            }
            showsText
            textStyle={{
              fontSize: 10
            }}
            color={colors.accent}
            formatText={(progress) => (progress * 100).toFixed(0)}
            borderWidth={0}
            thickness={2}
          />
        </TouchableOpacity>
      ) : (
        <>
          {attachment.failed ? (
            <IconButton
              onPress={onPress}
              name="alert-circle-outline"
              color={colors.errorText}
            />
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
};
