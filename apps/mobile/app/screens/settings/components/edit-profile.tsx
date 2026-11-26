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

import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useRef, useState } from "react";
import { Image, TextInput, View } from "react-native";
import { openPicker } from "react-native-image-crop-picker";
import { db } from "../../../common/database";
import { Radius, Spacing } from "../../../common/design/spacing";
import AppIcon from "../../../components/ui/AppIcon";
import { Button } from "../../../components/ui/button";
import FormInput, {
  createFormRef
} from "../../../components/ui/input/form-input";
import { Pressable } from "../../../components/ui/pressable";
import { ToastManager } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { useUserStore } from "../../../stores/use-user-store";

const AVATAR_SIZE = 105;
const AVATAR_BADGE_SIZE = 32;

export const EditProfile = () => {
  const { colors } = useThemeColors();
  const profile = useUserStore((state) => state.profile);
  const formRef = useRef(
    createFormRef({
      fullName: profile?.fullName || ""
    })
  );
  const nameInputRef = useRef<TextInput>(null);
  const [name, setName] = useState(profile?.fullName || "");
  const [profilePicture, setProfilePicture] = useState(profile?.profilePicture);
  const [loading, setLoading] = useState(false);
  const isPicking = useRef(false);

  const isDirty =
    name.trim() !== (profile?.fullName || "").trim() ||
    profilePicture !== profile?.profilePicture;

  const onPickImage = async () => {
    if (isPicking.current) return;
    try {
      const image = await openPicker({
        width: 512,
        height: 512,
        cropping: true,
        cropperCircleOverlay: true,
        mediaType: "photo",
        includeBase64: true
      });
      setProfilePicture(
        image.data ? `data:${image.mime};base64,${image.data}` : image.path
      );
      isPicking.current = false;
    } catch (e) {
      isPicking.current = false;
      /* user cancelled */
    }
  };

  const onSave = async () => {
    try {
      setLoading(true);
      const fullName = formRef.current.getValue("fullName").trim();
      await db.settings.setProfile({
        fullName: fullName || undefined,
        profilePicture: profilePicture || undefined
      });
      useUserStore.setState({
        profile: db.settings.getProfile()
      });
      ToastManager.show({
        heading: strings.fullNameUpdated(),
        type: "success",
        context: "global"
      });
      Navigation.goBack();
    } catch (e) {
      ToastManager.error(e as Error, undefined, "global");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        paddingHorizontal: Spacing.LEVEL_3,
        paddingTop: Spacing.LEVEL_4,
        gap: Spacing.LEVEL_4
      }}
    >
      <View
        style={{
          gap: Spacing.LEVEL_3,
          alignItems: "center"
        }}
      >
        <Pressable
          type="transparent"
          onPress={onPickImage}
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: AVATAR_SIZE
          }}
        >
          {profilePicture ? (
            <Image
              source={{ uri: profilePicture }}
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: AVATAR_SIZE
              }}
            />
          ) : (
            <View
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: AVATAR_SIZE,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.secondary.background
              }}
            >
              <AppIcon
                name="user"
                iconFamily="notesnook"
                size={AVATAR_SIZE / 2.5}
                color={colors.secondary.icon}
              />
            </View>
          )}

          <View
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: AVATAR_BADGE_SIZE,
              height: AVATAR_BADGE_SIZE,
              borderRadius: AVATAR_BADGE_SIZE,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: colors.primary.background,
              backgroundColor: colors.secondary.background
            }}
          >
            <AppIcon
              name="mode-edit"
              iconFamily="notesnook"
              size={16}
              color={colors.primary.icon}
            />
          </View>
        </Pressable>

        <FormInput
          name="fullName"
          formRef={formRef}
          fwdRef={nameInputRef}
          label={strings.name()}
          placeholder={strings.name()}
          wrapperStyle={{ width: "100%" }}
          containerStyle={{ borderRadius: Radius.XS }}
          onChangeText={setName}
          onSubmitEditing={onSave}
        />
      </View>

      <Button
        title={strings.saveChanges()}
        type="accent"
        loading={loading}
        disabled={!isDirty}
        onPress={onSave}
        style={{ width: "100%" }}
      />
    </View>
  );
};

export default EditProfile;
