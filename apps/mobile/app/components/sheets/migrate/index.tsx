import React, { useState } from "react";
import { View } from "react-native";
import BackupService from "../../../services/backup";
import { eSendEvent, ToastEvent } from "../../../services/event-manager";
import { useThemeStore } from "../../../stores/use-theme-store";
import { db } from "../../../common/database";
import {
  eCloseProgressDialog,
  eCloseSimpleDialog
} from "../../../utils/events";
import { sleep } from "../../../utils/time";
import { Dialog } from "../../dialog";
import DialogHeader from "../../dialog/dialog-header";
import { Button } from "../../ui/button";
import { Notice } from "../../ui/notice";
import Seperator from "../../ui/seperator";
import { ProgressBarComponent } from "../../ui/svg/lazy";
import Paragraph from "../../ui/typography/paragraph";
import { presentDialog } from "../../dialog/functions";

export default function Migrate() {
  const colors = useThemeStore((state) => state.colors);
  const [loading, setLoading] = useState(false);

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingTop: 12
      }}
    >
      <DialogHeader
        title="Database migration required"
        paragraph={
          "Due to new features we need to migrate your data to a newer version. This is NOT a destructive operation."
        }
      />
      <Seperator />
      <Notice
        type="alert"
        selectable={true}
        text={`Read before continuing:

It is required that you download and save a backup of your data.

Some merge conflicts in your notes after a migration are expected. It is recommended that you resolve them carefully. But if you are feeling reckless and want to risk losing some data, you can logout log back in.

If you face any other issues or are unsure about what to do, feel free to reach out to us via https://discord.com/invite/zQBK97EE22 or email us at support@streetwriters.co`}
      />

      {loading ? (
        <>
          <View
            style={{
              width: 200,
              height: 100,
              alignSelf: "center",
              justifyContent: "center"
            }}
          >
            <ProgressBarComponent
              height={5}
              width={200}
              animated={true}
              useNativeDriver
              indeterminate
              unfilledColor={colors.nav}
              color={colors.accent}
              borderWidth={0}
            />

            <Paragraph
              style={{
                marginTop: 5,
                textAlign: "center"
              }}
            >
              Migration in progress... please wait
            </Paragraph>
          </View>
        </>
      ) : (
        <Button
          title="Start migration"
          type="accent"
          width={250}
          onPress={async () => {
            setLoading(true);
            const backupSaved = await BackupService.run(false, "local");
            if (!backupSaved) {
              ToastEvent.show({
                heading: "Migration failed",
                message:
                  "You must download a backup of your data before migrating.",
                context: "local"
              });
              setLoading(false);
            }
            await db.migrations?.migrate();
            eSendEvent(eCloseProgressDialog);
            setLoading(false);
            await sleep(500);
            presentDialog({
              title: "Migration successful",
              paragraph:
                "Your data has been migrated. If you face any issues after the migration please reach out to us via email or Discord.",
              context: "global",
              negativeText: "Ok"
            });
          }}
          style={{
            borderRadius: 100,
            height: 45,
            marginTop: 20
          }}
        />
      )}
      <Dialog context="local" />
    </View>
  );
}
