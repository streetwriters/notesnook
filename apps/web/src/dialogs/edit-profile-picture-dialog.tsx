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

import Dialog from "../components/dialog";
import { Profile } from "@notesnook/core";
import AvatarEditor from "react-avatar-editor";
import { Button, Flex, Slider } from "@theme-ui/components";
import { User } from "../components/icons";
import { useRef, useState } from "react";
import { showFilePicker } from "../utils/file-picker";
import { db } from "../common/db";
import { showToast } from "../utils/toast";
import { useStore as useSettingStore } from "../stores/setting-store";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";

export type EditProfilePictureDialogProps = BaseDialogProps<boolean> & {
  profile?: Profile;
};

export const EditProfilePictureDialog = DialogManager.register(
  function EditProfilePictureDialog(props: EditProfilePictureDialogProps) {
    const { profile } = props;
    const [profilePicture, setProfilePicture] = useState<
      File | string | undefined
    >(profile?.profilePicture);
    const profileRef = useRef<AvatarEditor>(null);
    const [scale, setScale] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [clearProfilePicture, setClearProfilePicture] = useState(false);

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
              const pic = profileRef.current
                ? profileRef.current
                    .getImageScaledToCanvas()
                    .toDataURL("image/jpeg", 0.8)
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
        <Flex
          sx={{
            flexDirection: "column"
          }}
        >
          {profilePicture ? (
            <AvatarEditor
              ref={profileRef}
              image={profilePicture}
              width={256}
              height={256}
              border={1}
              color={[255, 255, 255]}
              borderRadius={256}
              scale={scale}
              style={{
                width: 150,
                height: 150,
                alignSelf: "center"
              }}
            />
          ) : (
            <Flex
              variant="columnCenter"
              sx={{
                bg: "shade",
                mr: 2,
                size: 150,
                borderRadius: 200,
                alignSelf: "center"
              }}
            >
              <User size={60} />
            </Flex>
          )}
          <Flex sx={{ gap: 1, alignItems: "center", mt: 2 }}>
            <Button
              sx={{ flex: 1 }}
              variant="secondary"
              onClick={async () => {
                const [file] = await showFilePicker({
                  acceptedFileTypes: "image/*"
                });
                if (!file) return;
                setProfilePicture(file);
                setScale(1);
              }}
            >
              {profilePicture
                ? strings.changeProfilePicture()
                : strings.selectProfilePicture()}
            </Button>
            {profilePicture ? (
              <Button
                sx={{ flex: 1 }}
                variant="secondary"
                onClick={async () => {
                  if (typeof profilePicture === "string") {
                    setClearProfilePicture(true);
                    setProfilePicture(undefined);
                  } else setProfilePicture(profile?.profilePicture);
                  setScale(1);
                }}
              >
                {typeof profilePicture === "string"
                  ? strings.clear()
                  : strings.reset()}
              </Button>
            ) : null}
          </Flex>
          {profilePicture ? (
            <Slider
              max={5}
              min={1}
              step={0.1}
              value={scale}
              sx={{ color: "accent" }}
              onChange={(e) => setScale(e.target.valueAsNumber)}
            />
          ) : null}
        </Flex>
      </Dialog>
    );
  }
);
