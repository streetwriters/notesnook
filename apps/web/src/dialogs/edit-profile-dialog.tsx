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

import { Perform } from "../common/dialog-controller";
import Dialog from "../components/dialog";
import { Profile } from "@notesnook/core";
import Field from "../components/field";
import AvatarEditor from "react-avatar-editor";
import { Avatar, Button, Flex, Slider } from "@theme-ui/components";
import { User } from "../components/icons";
import { useRef, useState } from "react";
import { showFilePicker } from "../utils/file-picker";
import { db } from "../common/db";
import { useStore as useUserStore } from "../stores/user-store";
import { showToast } from "../utils/toast";

export type EditProfileDialogProps = {
  onClose: Perform;
  profile?: Profile;
};

export default function EditProfileDialog(props: EditProfileDialogProps) {
  const { profile } = props;
  const [profilePicture, setProfilePicture] = useState<
    File | string | undefined
  >(profile?.profilePicture);
  const profileRef = useRef<AvatarEditor>(null);
  const [fullName, setFullName] = useState<string | undefined>(
    profile?.fullName
  );
  const [scale, setScale] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [clearProfilePicture, setClearProfilePicture] = useState(false);

  return (
    <Dialog
      isOpen={true}
      title={"Edit profile"}
      description="Your profile data is stored 100% end-to-end encrypted."
      onClose={() => props.onClose(false)}
      positiveButton={{
        loading: isLoading,
        disabled: isLoading,
        text: "Save",
        onClick: async () => {
          setIsLoading(true);
          try {
            await db.user.setProfile({
              fullName,
              profilePicture: profileRef.current
                ? profileRef.current
                    .getImageScaledToCanvas()
                    .toDataURL("image/jpeg", 1)
                : clearProfilePicture
                ? undefined
                : profile?.profilePicture
            });
            await useUserStore.getState().refreshUser();
            showToast("success", "Profile updated!");
            props.onClose(true);
          } catch (e) {
            console.error(e);
            showToast("error", (e as Error).message);
          } finally {
            setIsLoading(false);
          }
        }
      }}
      width={400}
      negativeButton={{ text: "Cancel", onClick: () => props.onClose(false) }}
    >
      <Flex sx={{ gap: 2, mt: 2 }}>
        <Flex sx={{ flexDirection: "column" }}>
          {profilePicture ? (
            <AvatarEditor
              ref={profileRef}
              image={profilePicture}
              width={150}
              height={150}
              border={0}
              color={[255, 255, 255]}
              borderRadius={100}
              scale={scale}
              style={{
                width: 150,
                height: 150
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
              onClick={async () =>
                setProfilePicture(
                  await showFilePicker({ acceptedFileTypes: "image/*" })
                )
              }
            >
              {profilePicture ? "Change" : "Set picture"}
            </Button>
            {profilePicture ? (
              <Button
                sx={{ flex: 1 }}
                variant="secondary"
                onClick={async () => {
                  if (profile?.profilePicture) setClearProfilePicture(true);
                  setProfilePicture(undefined);
                  setScale(1);
                }}
              >
                {profile?.profilePicture ? "Clear" : "Reset"}
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
        <Field
          label="Full name"
          maxLength={200}
          value={fullName}
          autoFocus
          onChange={(e) => setFullName(e.target.value)}
        />
      </Flex>
    </Dialog>
  );
}
