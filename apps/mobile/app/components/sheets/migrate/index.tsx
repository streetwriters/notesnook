/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { EVENTS } from "@notesnook/core/dist/common";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { db } from "../../../common/database";
import { MMKV } from "../../../common/database/mmkv";
import BackupService from "../../../services/backup";
import {
  eSendEvent,
  presentSheet,
  ToastEvent
} from "../../../services/event-manager";
import SettingsService from "../../../services/settings";
import { useThemeColors } from "@notesnook/theme";
import { eCloseSheet } from "../../../utils/events";
import { sleep } from "../../../utils/time";
import { Dialog } from "../../dialog";
import DialogHeader from "../../dialog/dialog-header";
import SheetProvider from "../../sheet-provider";
import { Button } from "../../ui/button";
import Seperator from "../../ui/seperator";
import { ProgressBarComponent } from "../../ui/svg/lazy";
import Paragraph from "../../ui/typography/paragraph";
import { Issue } from "../github/issue";

export const makeError = (
  stack: string,
  component: string
) => `Please let us know what happened. What steps we can take to reproduce the issue here.

_______________________________
Stacktrace: In ${component}::${stack}`;

type Progress = {
  collection: string;
  total: number;
  current: number;
};

export default function Migrate() {
  const { colors } = useThemeColors();
  const [loading, setLoading] = useState(false);
  const [error, _setError] = useState<Error>();
  const [reset, setReset] = useState(false);
  const [progress, setProgress] = useState<Progress>();

  useEffect(() => {
    const subscription = db.eventManager.subscribe(
      EVENTS.migrationProgress,
      (progress: Progress) => {
        setProgress(progress);
      }
    );
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const reportError = React.useCallback((error: Error) => {
    _setError(error);
    presentSheet({
      context: "local",
      component: (
        <Issue
          issueTitle={"Database migration failed"}
          defaultBody={makeError(error.stack || "", "Migration")}
          defaultTitle={error.message}
        />
      )
    });
  }, []);

  const startMigration = useCallback(async () => {
    try {
      setLoading(true);
      await sleep(1000);
      const backupSaved = await BackupService.run(false, "local");
      if (!backupSaved) {
        ToastEvent.show({
          heading: "Migration failed",
          message: "You must download a backup of your data before migrating.",
          context: "local"
        });
        setLoading(false);
        return;
      }
      await db.migrations?.migrate();
      eSendEvent(eCloseSheet);
      await sleep(500);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      reportError(e as Error);
    }
  }, [reportError]);

  useEffect(() => {
    if (SettingsService.get().backupDirectoryAndroid || Platform.OS === "ios") {
      startMigration();
    }
  }, [startMigration]);

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingTop: 12
      }}
    >
      {!loading ? (
        <DialogHeader
          title="Save a backup of your notes"
          centered
          paragraph={
            "Thank you for updating Notesnook! We will be applying some minor changess for a better note taking experience."
          }
        />
      ) : null}
      <Seperator />

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
              unfilledColor={colors.secondary.background}
              color={colors.primary.accent}
              borderWidth={0}
            />

            <Paragraph
              style={{
                marginTop: 5,
                textAlign: "center"
              }}
            >
              Updating {progress ? progress?.collection : null}
              {progress ? `(${progress.current}/${progress.total}) ` : null}...
              please wait
            </Paragraph>
          </View>
        </>
      ) : error ? (
        <>
          <Paragraph
            style={{
              marginTop: 20,
              textAlign: "center"
            }}
          >
            An error occurred while migrating your data. You can logout of your
            account and try to relogin. However this is not recommended as it
            may result in some data loss if your data was not synced.
          </Paragraph>

          {reset ? (
            <Paragraph
              style={{
                marginTop: 10,
                textAlign: "center"
              }}
            >
              App data has been cleared. Kindly relaunch the app to login again.
            </Paragraph>
          ) : (
            <Button
              title="Logout & clear app data"
              type="error"
              width={250}
              onPress={async () => {
                MMKV.clearStore();
                setReset(true);
              }}
              style={{
                borderRadius: 100,
                height: 45,
                marginTop: 10
              }}
            />
          )}
        </>
      ) : (
        <Button
          title="Save & continue"
          type="accent"
          width={250}
          onPress={startMigration}
          style={{
            borderRadius: 100,
            height: 45,
            marginTop: 20
          }}
        />
      )}
      <Dialog context="local" />
      <SheetProvider context="local" />
    </View>
  );
}
