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
import { Button, Flex, Slider, Text } from "@theme-ui/components";
import { Camera, Minus, Plus, User } from "../components/icons";
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

    const zoomPercent = ((scale - 1) / (5 - 1)) * 100;
    const initial = profile?.fullName?.trim().charAt(0).toUpperCase();

    const pickPicture = async () => {
      const [file] = await showFilePicker({
        acceptedFileTypes: "image/*"
      });
      if (!file) return;
      setProfilePicture(file);
      setScale(1);
    };

    return (
      <Dialog
        isOpen={true}
        width={440}
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
            flexDirection: "column",
            mt: "spacing6",
            gap: "spacing6",
            mb: "spacing7"
          }}
        >
          <Flex
            variant="columnCenter"
            sx={{
              position: "relative",
              alignSelf: "center",
              size: 139,
              borderRadius: "50%",
              border: "1px solid",
              borderColor: "border",
              flexShrink: 0
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
                  width: 119,
                  height: 119
                }}
              />
            ) : (
              <Flex
                variant="columnCenter"
                sx={{
                  bg: "background-selected",
                  size: 119,
                  borderRadius: "50%"
                }}
              >
                {initial ? (
                  <Text
                    sx={{ fontSize: "3xl", lineHeight: 1, color: "heading" }}
                  >
                    {initial}
                  </Text>
                ) : (
                  <User size={60} />
                )}
              </Flex>
            )}
            {profilePicture ? (
              <Flex
                variant="columnCenter"
                sx={{
                  position: "absolute",
                  left: "113.5px",
                  top: "83px",
                  size: 30,
                  borderRadius: "50%",
                  bg: "background",
                  boxShadow: "0 4px 17px 0 rgba(0, 0, 0, 0.10)",
                  cursor: "pointer"
                }}
                title={strings.changeProfilePicture()}
                onClick={pickPicture}
              >
                <Camera size={15} />
              </Flex>
            ) : null}
          </Flex>
          {profilePicture ? (
            <Flex sx={{ alignItems: "center", gap: "spacing4" }}>
              <Flex
                variant="columnCenter"
                sx={{
                  size: 20,
                  flexShrink: 0,
                  bg: "background-secondary",
                  borderRadius: "3px",
                  cursor: "pointer"
                }}
                onClick={() =>
                  setScale((s) => Math.max(1, +(s - 0.1).toFixed(1)))
                }
              >
                <Minus size={15} />
              </Flex>
              <Slider
                max={5}
                min={1}
                step={0.1}
                value={scale}
                sx={{
                  flex: 1,
                  color: "accent",
                  bg: "transparent",
                  background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${zoomPercent}%, var(--background-tertiary) ${zoomPercent}%, var(--background-tertiary) 100%)`,
                  height: 6,
                  "::-webkit-slider-thumb": { width: 12, height: 12 }
                }}
                onChange={(e) => setScale(e.target.valueAsNumber)}
              />
              <Flex
                variant="columnCenter"
                sx={{
                  size: 20,
                  flexShrink: 0,
                  bg: "background-secondary",
                  borderRadius: "3px",
                  cursor: "pointer"
                }}
                onClick={() =>
                  setScale((s) => Math.min(5, +(s + 0.1).toFixed(1)))
                }
              >
                <Plus size={15} />
              </Flex>
            </Flex>
          ) : null}
          <Flex sx={{ gap: "spacing6", alignItems: "center" }}>
            <Button
              sx={{
                flex: 1,
                px: "spacing4",
                fontSize: "sm",
                fontWeight: 400
              }}
              variant="new_bordered"
              onClick={pickPicture}
            >
              {profilePicture
                ? strings.changeProfilePicture()
                : strings.selectProfilePicture()}
            </Button>
            {profilePicture ? (
              <Button
                sx={{
                  flex: 1,
                  px: "spacing4",
                  fontSize: "sm",
                  fontWeight: 400
                }}
                variant="new_bordered"
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
        </Flex>
      </Dialog>
    );
  }
);
