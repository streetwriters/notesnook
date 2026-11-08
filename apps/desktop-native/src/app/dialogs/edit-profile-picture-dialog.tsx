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

import { useState } from "react";
import { Button, Dialog, Flex, Image, Text } from "@ui";
import { Profile } from "@notesnook/core";
import { User } from "../components/icons";
import { showFilePicker } from "../utils/file-picker";
import { db } from "../common/db";
import { showToast } from "../utils/toast";
import { useStore as useSettingStore } from "../stores/setting-store";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";

export type EditProfilePictureDialogProps = BaseDialogProps<boolean> & {
  profile?: Profile;
};

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function toBase64(bytes: Uint8Array) {
  let output = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    output += ALPHABET[a >> 2];
    output += ALPHABET[((a & 3) << 4) | ((b ?? 0) >> 4)];
    output +=
      b === undefined ? "=" : ALPHABET[((b & 15) << 2) | ((c ?? 0) >> 6)];
    output += c === undefined ? "=" : ALPHABET[c & 63];
  }
  return output;
}

export const EditProfilePictureDialog = DialogManager.register(
  function EditProfilePictureDialog(props: EditProfilePictureDialogProps) {
    const { profile } = props;
    const [original, setOriginal] = useState<string | undefined>(
      profile?.profilePicture
    );
    const [picked, setPicked] = useState<string>();
    const [isLoading, setIsLoading] = useState(false);
    const [clearProfilePicture, setClearProfilePicture] = useState(false);
    const profilePicture = picked || original;

    return (
      <Dialog
        isOpen={true}
        title={strings.editProfilePicture()}
        description={strings.editProfilePictureDesc()}
        onClose={() => props.onClose(false)}
        positiveButton={{
          loading: isLoading,
          disabled: isLoading,
          text: strings.save(),
          onClick: async () => {
            setIsLoading(true);
            try {
              const pic = picked
                ? picked
                : clearProfilePicture
                ? undefined
                : profile?.profilePicture;
              await db.settings.setProfile({
                profilePicture: pic
              });
              await useSettingStore.getState().refresh();
              showToast("success", strings.profileUpdated());
              props.onClose(true);
            } catch (e) {
              console.error(e);
              showToast("error", (e as Error).message);
            } finally {
              setIsLoading(false);
            }
          }
        }}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => props.onClose(false)
        }}
      >
        <Flex sx={{ flexDirection: "column" }}>
          {profilePicture ? (
            <Flex
              sx={{
                width: 150,
                height: 150,
                borderRadius: 150,
                overflow: "hidden",
                alignSelf: "center"
              }}
            >
              <Image
                src={profilePicture}
                resizeMode="cover"
                sx={{
                  width: 150,
                  height: 150
                }}
              />
            </Flex>
          ) : (
            <Flex
              sx={{
                bg: "shade",
                mr: 2,
                width: 150,
                height: 150,
                borderRadius: 200,
                alignSelf: "center",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <User size={60} />
            </Flex>
          )}
          <Flex
            sx={{
              gap: 1,
              flexDirection: "row",
              alignItems: "center",
              mt: 2
            }}
          >
            <Button
              sx={{ flex: 1 }}
              variant="secondary"
              onPress={async () => {
                const [file] = await showFilePicker({
                  acceptedFileTypes: "image/*"
                });
                if (!file) return;
                const bytes = await file.bytes();
                setPicked(
                  `data:${file.type || "image/jpeg"};base64,${toBase64(bytes)}`
                );
              }}
            >
              <Text>
                {profilePicture
                  ? strings.changeProfilePicture()
                  : strings.selectProfilePicture()}
              </Text>
            </Button>
            {profilePicture ? (
              <Button
                sx={{ flex: 1 }}
                variant="secondary"
                onPress={async () => {
                  if (picked) {
                    setPicked(undefined);
                  } else {
                    setClearProfilePicture(true);
                    setOriginal(undefined);
                  }
                }}
              >
                <Text>{picked ? strings.reset() : strings.clear()}</Text>
              </Button>
            ) : null}
          </Flex>
        </Flex>
      </Dialog>
    );
  }
);
