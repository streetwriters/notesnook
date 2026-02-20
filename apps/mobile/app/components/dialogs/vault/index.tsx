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

import Clipboard from "@react-native-clipboard/clipboard";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { InteractionManager, View, TextInput } from "react-native";
import Share from "react-native-share";
import { notesnook } from "../../../../e2e/test.ids";
import { db } from "../../../common/database";
import BiometricService from "../../../services/biometrics";
import { DDS } from "../../../services/device-detection";
import {
  ToastManager,
  Vault,
  VaultRequestType,
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { getElevationStyle } from "../../../utils/elevation";
import {
  eCloseActionSheet,
  eCloseVaultDialog,
  eOnLoadNote,
  eOpenVaultDialog,
  eUpdateNoteInEditor
} from "../../../utils/events";
import { deleteItems } from "../../../utils/functions";
import { fluidTabsRef } from "../../../utils/global-refs";
import { convertNoteToText } from "../../../utils/note-to-text";
import { sleep } from "../../../utils/time";
import BaseDialog from "../../dialog/base-dialog";
import DialogButtons from "../../dialog/dialog-buttons";
import DialogHeader from "../../dialog/dialog-header";
import { Toast } from "../../toast";
import { Button } from "../../ui/button";
import Input from "../../ui/input";
import Seperator from "../../ui/seperator";
import Paragraph from "../../ui/typography/paragraph";
import { strings } from "@notesnook/intl";
import { DefaultAppStyles } from "../../../utils/styles";
import { Note, NoteContent, VAULT_ERRORS } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";

export const VaultDialog: React.FC = () => {
  const { colors } = useThemeColors();

  // UI State
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(false);
  const [passwordsDontMatch, setPasswordsDontMatch] = useState(false);
  const [deleteAll, setDeleteAll] = useState(false);
  const [biometricUnlock, setBiometricUnlock] = useState(false);
  const [isBiometryAvailable, setIsBiometryAvailable] = useState(false);
  const [isBiometryEnrolled, setIsBiometryEnrolled] = useState(false);

  // Refs for non-UI state
  const requestTypeRef = useRef<VaultRequestType | null>(null);
  const noteRef = useRef<Note | undefined>(undefined);
  const titleRef = useRef<string>(strings.goToEditor());
  const descriptionRef = useRef<string | null>(null);
  const paragraphRef = useRef<string | null>(null);
  const buttonTitleRef = useRef<string | null>(null);
  const positiveButtonTypeRef = useRef<"errorShade" | "transparent" | "accent">(
    "transparent"
  );
  const customActionTitleRef = useRef<string | null>(null);
  const customActionParagraphRef = useRef<string | null>(null);
  const noteLockedRef = useRef(false);
  const onUnlockRef = useRef<
    | ((
        item: Note & {
          content?: NoteContent<false>;
        },
        password: string
      ) => void)
    | undefined
  >(undefined);

  // Input refs
  const passInputRef = useRef<TextInput>(null);
  const confirmPassRef = useRef<TextInput>(null);
  const changePassInputRef = useRef<TextInput>(null);

  // Password refs
  const passwordRef = useRef<string | null>(null);
  const confirmPasswordRef = useRef<string | null>(null);
  const newPasswordRef = useRef<string | null>(null);

  const open = useCallback(async (data: Vault) => {
    const biometry = await BiometricService.isBiometryAvailable();
    const available = !!biometry;
    const fingerprint = await BiometricService.hasInternetCredentials();
    const noteLocked = data.item
      ? await db.vaults.itemExists(data.item)
      : false;

    // Set refs
    noteRef.current = data.item;
    titleRef.current = data.title || strings.goToEditor();
    descriptionRef.current = data.description || null;
    paragraphRef.current = data.paragraph || null;
    buttonTitleRef.current = data.buttonTitle || null;
    positiveButtonTypeRef.current = data.positiveButtonType || "transparent";
    customActionTitleRef.current = data.customActionTitle || null;
    customActionParagraphRef.current = data.customActionParagraph || null;
    noteLockedRef.current = noteLocked;
    onUnlockRef.current = data.onUnlock;
    requestTypeRef.current = data.requestType;

    // Set UI state
    setIsBiometryAvailable(available);
    setIsBiometryEnrolled(fingerprint);
    setBiometricUnlock(fingerprint);
    setWrongPassword(false);
    setPasswordsDontMatch(false);
    setDeleteAll(false);
    setLoading(false);

    // Auto-unlock with fingerprint if applicable
    const canAutoUnlock =
      fingerprint &&
      data.requestType !== VaultRequestType.EnableFingerprint &&
      data.requestType !== VaultRequestType.RevokeFingerprint &&
      data.requestType !== VaultRequestType.ChangePassword &&
      data.requestType !== VaultRequestType.ClearVault &&
      data.requestType !== VaultRequestType.DeleteVault &&
      data.requestType !== VaultRequestType.CustomAction &&
      data.requestType === VaultRequestType.PermanentUnlock;

    if (canAutoUnlock) {
      await onPressFingerprintAuth(data.title, data.description);
    } else {
      setVisible(true);
    }
  }, []);

  const close = useCallback(() => {
    if (loading) {
      ToastManager.show({
        heading: titleRef.current,
        message: strings.pleaseWait() + "...",
        type: "success",
        context: "local"
      });
      return;
    }

    Navigation.queueRoutesForUpdate();

    // Reset password refs
    passwordRef.current = null;
    confirmPasswordRef.current = null;
    newPasswordRef.current = null;

    // Reset refs
    requestTypeRef.current = null;
    noteRef.current = undefined;
    titleRef.current = strings.goToEditor();
    descriptionRef.current = null;
    paragraphRef.current = null;
    buttonTitleRef.current = null;
    positiveButtonTypeRef.current = "transparent";
    customActionTitleRef.current = null;
    customActionParagraphRef.current = null;
    noteLockedRef.current = false;
    onUnlockRef.current = undefined;

    // Reset UI state
    setVisible(false);
    setLoading(false);
    setWrongPassword(false);
    setPasswordsDontMatch(false);
    setDeleteAll(false);
    setBiometricUnlock(false);
    setIsBiometryAvailable(false);
    setIsBiometryEnrolled(false);
  }, [loading]);

  const deleteVault = useCallback(async () => {
    setLoading(true);
    try {
      let verified = true;
      if (await db.user.getUser()) {
        verified = await db.user.verifyPassword(passwordRef.current || "");
      }
      if (verified) {
        let noteIds: string[] = [];
        if (deleteAll) {
          const vault = await db.vaults.default();
          const relations = await db.relations
            .from(
              {
                type: "vault",
                id: vault!.id
              },
              "note"
            )
            .get();
          noteIds = relations.map((item) => item.toId);
        }
        await db.vault.delete(deleteAll);

        if (deleteAll) {
          noteIds.forEach((id) => {
            eSendEvent(
              eUpdateNoteInEditor,
              {
                id: id,
                deleted: true
              },
              true
            );
          });
        }
        eSendEvent("vaultUpdated");
        setLoading(false);
        setTimeout(() => {
          close();
        }, 100);
      } else {
        ToastManager.show({
          heading: strings.passwordIncorrect(),
          type: "error",
          context: "local"
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [deleteAll, close]);

  const clearVault = useCallback(async () => {
    setLoading(true);
    try {
      const vault = await db.vaults.default();
      const relations = await db.relations.from(vault!, "note").get();
      const noteIds = relations.map((item) => item.toId);

      await db.vault.clear(passwordRef.current || "");

      noteIds.forEach((id) => {
        eSendEvent(
          eUpdateNoteInEditor,
          {
            id: id,
            deleted: true
          },
          true
        );
      });
      setLoading(false);
      close();
      eSendEvent("vaultUpdated");
    } catch (e) {
      ToastManager.show({
        heading: strings.passwordIncorrect(),
        type: "error",
        context: "local"
      });
    }
    setLoading(false);
  }, [close]);

  const lockNote = useCallback(async () => {
    if (!passwordRef.current || passwordRef.current.trim() === "") {
      ToastManager.show({
        heading: strings.passwordIncorrect(),
        type: "error",
        context: "local"
      });
      return;
    } else {
      await db.vault.add(noteRef.current!.id);

      eSendEvent(eUpdateNoteInEditor, noteRef.current, true);

      close();
      ToastManager.show({
        message: strings.noteLocked(),
        type: "error",
        context: "local"
      });
      setLoading(false);
    }
  }, [close]);

  const permanantUnlock = useCallback(() => {
    db.vault
      .remove(noteRef.current!.id, passwordRef.current || "")
      .then(async () => {
        ToastManager.show({
          heading: strings.noteUnlocked(),
          type: "success",
          context: "global"
        });
        eSendEvent(eUpdateNoteInEditor, noteRef.current, true);
        if (biometricUnlock && !isBiometryEnrolled) {
          await enrollFingerprint(passwordRef.current || "");
        }
        close();
      })
      .catch((e) => {
        takeErrorAction();
      });
  }, [close, biometricUnlock, isBiometryEnrolled]);

  const openInEditor = useCallback(
    (note: Note & { content?: NoteContent<false> }) => {
      close();
      InteractionManager.runAfterInteractions(async () => {
        eSendEvent(eOnLoadNote, {
          item: note
        });
        if (!DDS.isTab) {
          fluidTabsRef.current?.goToPage("editor");
        }
      });
    },
    [close]
  );

  const copyNote = useCallback(
    async (note: Note & { content?: NoteContent<false> }) => {
      Clipboard.setString((await convertNoteToText(note, true)) || "");
      ToastManager.show({
        heading: strings.noteCopied(),
        type: "success",
        context: "global"
      });
      close();
    },
    [close]
  );

  const shareNote = useCallback(
    async (note: Note & { content?: NoteContent<false> }) => {
      close();
      try {
        await Share.open({
          title: note.title,
          failOnCancel: false,
          message: (await convertNoteToText(note)) || ""
        });
      } catch (e) {
        console.error(e);
      }
    },
    [close]
  );

  const deleteNote = useCallback(async () => {
    try {
      await db.vault.remove(noteRef.current!.id, passwordRef.current || "");
      await deleteItems("note", [noteRef.current!.id]);
      close();
    } catch (e) {
      takeErrorAction();
    }
  }, [close]);

  const takeErrorAction = useCallback(() => {
    setWrongPassword(true);
    setVisible(true);
    setTimeout(() => {
      ToastManager.show({
        heading: strings.passwordIncorrect(),
        type: "error",
        context: "local"
      });
    }, 500);
  }, []);

  const openNote = useCallback(async () => {
    try {
      if (!passwordRef.current) throw new Error("Invalid password");

      const note = await db.vault.open(
        noteRef.current!.id,
        passwordRef.current
      );
      if (!note) throw new Error("Failed to unlock note.");
      if (biometricUnlock && !isBiometryEnrolled) {
        await enrollFingerprint(passwordRef.current || "");
      }

      const requestType = requestTypeRef.current;

      if (requestType === VaultRequestType.GoToEditor) {
        openInEditor(note);
      } else if (requestType === VaultRequestType.ShareNote) {
        await shareNote(note);
      } else if (requestType === VaultRequestType.DeleteNote) {
        await deleteNote();
      } else if (requestType === VaultRequestType.CopyNote) {
        await copyNote(note);
      } else if (
        requestType === VaultRequestType.CustomAction &&
        onUnlockRef.current
      ) {
        const password = passwordRef.current;
        close();
        await sleep(300);
        onUnlockRef.current(note, password);
      }
    } catch (e) {
      takeErrorAction();
    }
  }, [
    biometricUnlock,
    isBiometryEnrolled,
    openInEditor,
    shareNote,
    deleteNote,
    copyNote,
    close,
    takeErrorAction
  ]);

  const unlockNote = useCallback(async () => {
    if (!passwordRef.current || passwordRef.current.trim() === "") {
      ToastManager.show({
        heading: strings.passwordIncorrect(),
        type: "error",
        context: "local"
      });
      return;
    }
    if (requestTypeRef.current === VaultRequestType.PermanentUnlock) {
      permanantUnlock();
    } else {
      await openNote();
    }
  }, [permanantUnlock, openNote]);

  const enrollFingerprint = useCallback(
    async (password: string) => {
      setLoading(true);
      try {
        await db.vault.unlock(password);
        await BiometricService.storeCredentials(password);
        setLoading(false);
        eSendEvent("vaultUpdated");
        ToastManager.show({
          heading: strings.biometricUnlockEnabled(),
          type: "success",
          context: "global"
        });
        close();
      } catch (e) {
        close();
        ToastManager.show({
          heading: strings.passwordIncorrect(),
          type: "error",
          context: "local"
        });
        setLoading(false);
      }
    },
    [close]
  );

  const createVault = useCallback(async () => {
    await db.vault.create(passwordRef.current || "");

    if (biometricUnlock) {
      await enrollFingerprint(passwordRef.current || "");
    }
    if (noteRef.current?.id) {
      await db.vault.add(noteRef.current.id);
      eSendEvent(eUpdateNoteInEditor, noteRef.current, true);
      setLoading(false);
      ToastManager.show({
        heading: strings.noteLocked(),
        type: "success",
        context: "global"
      });
      close();
    } else {
      ToastManager.show({
        heading: strings.vaultCreated(),
        type: "success",
        context: "global"
      });
      close();
    }
    eSendEvent("vaultUpdated");
  }, [biometricUnlock, enrollFingerprint, close]);

  const revokeFingerprintAccess = useCallback(async () => {
    try {
      await BiometricService.resetCredentials();
      eSendEvent("vaultUpdated");
      ToastManager.show({
        heading: strings.biometricUnlockDisabled(),
        type: "success",
        context: "global"
      });
    } catch (e: any) {
      ToastManager.show({
        heading: e.message,
        type: "success",
        context: "global"
      });
    }
  }, []);

  const onPressFingerprintAuth = useCallback(
    async (title?: string, description?: string) => {
      try {
        const credentials = await BiometricService.getCredentials(
          title || titleRef.current,
          description || descriptionRef.current || ""
        );

        if (!credentials) throw new Error("Failed to get user credentials");

        if (credentials?.password) {
          passwordRef.current = credentials.password;
          console.log("password...");
          onPress();
        } else {
          eSendEvent(eCloseActionSheet);
          await sleep(300);
          setVisible(true);
        }
      } catch (e) {
        console.error(e);
      }
    },
    []
  );

  const onPress = useCallback(async () => {
    const requestType = requestTypeRef.current;

    if (requestType === VaultRequestType.RevokeFingerprint) {
      await revokeFingerprintAccess();
      close();
      return;
    }

    if (loading) return;

    if (!passwordRef.current) {
      ToastManager.show({
        heading: strings.passwordNotEntered(),
        type: "error",
        context: "local"
      });
      return;
    }

    if (requestType === VaultRequestType.CreateVault) {
      if (passwordRef.current !== confirmPasswordRef.current) {
        ToastManager.show({
          heading: strings.passwordNotMatched(),
          type: "error",
          context: "local"
        });
        setPasswordsDontMatch(true);
        return;
      }

      createVault();
    } else if (requestType === VaultRequestType.ChangePassword) {
      setLoading(true);

      db.vault
        .changePassword(passwordRef.current, newPasswordRef.current || "")
        .then(() => {
          setLoading(false);
          if (biometricUnlock) {
            enrollFingerprint(newPasswordRef.current || "");
          }
          ToastManager.show({
            heading: strings.passwordUpdated(),
            type: "success",
            context: "global"
          });
          close();
        })
        .catch((e) => {
          setLoading(false);
          if (e.message === VAULT_ERRORS.wrongPassword) {
            ToastManager.show({
              heading: strings.passwordIncorrect(),
              type: "error",
              context: "local"
            });
          } else {
            ToastManager.error(e);
          }
        });
    } else if (requestType === VaultRequestType.LockNote) {
      if (!passwordRef.current || passwordRef.current.trim() === "") {
        ToastManager.show({
          heading: strings.passwordIncorrect(),
          type: "error",
          context: "local"
        });
        setWrongPassword(true);
        return;
      }
      db.vault
        .unlock(passwordRef.current)
        .then(async (unlocked) => {
          if (unlocked) {
            setWrongPassword(false);
            await lockNote();
          } else {
            takeErrorAction();
          }
        })
        .catch((e) => {
          takeErrorAction();
        });
    } else if (
      requestType === VaultRequestType.UnlockNote ||
      requestType === VaultRequestType.PermanentUnlock ||
      requestType === VaultRequestType.GoToEditor ||
      requestType === VaultRequestType.ShareNote ||
      requestType === VaultRequestType.CopyNote ||
      requestType === VaultRequestType.DeleteNote ||
      requestType === VaultRequestType.CustomAction
    ) {
      if (!passwordRef.current || passwordRef.current.trim() === "") {
        ToastManager.show({
          heading: strings.passwordIncorrect(),
          type: "error",
          context: "local"
        });
        setWrongPassword(true);
        return;
      }
      if (noteLockedRef.current) {
        await unlockNote();
      } else {
        console.log("Error: Note should be locked for this operation");
      }
    } else if (requestType === VaultRequestType.EnableFingerprint) {
      enrollFingerprint(passwordRef.current);
    } else if (requestType === VaultRequestType.ClearVault) {
      await clearVault();
    } else if (requestType === VaultRequestType.DeleteVault) {
      await deleteVault();
    }
  }, [
    loading,
    biometricUnlock,
    revokeFingerprintAccess,
    close,
    createVault,
    enrollFingerprint,
    unlockNote,
    lockNote,
    takeErrorAction,
    clearVault,
    deleteVault
  ]);

  useEffect(() => {
    eSubscribeEvent(eOpenVaultDialog, open);
    eSubscribeEvent(eCloseVaultDialog, close);

    return () => {
      eUnSubscribeEvent(eOpenVaultDialog, open);
      eUnSubscribeEvent(eCloseVaultDialog, close);
    };
  }, [open, close]);

  if (!visible) return null;

  const requestType = requestTypeRef.current;
  const isCreateVault = requestType === VaultRequestType.CreateVault;
  const isChangePassword = requestType === VaultRequestType.ChangePassword;
  const isClearVault = requestType === VaultRequestType.ClearVault;
  const isDeleteVault = requestType === VaultRequestType.DeleteVault;
  const isRevokeFingerprint =
    requestType === VaultRequestType.RevokeFingerprint;
  const isEnableFingerprint =
    requestType === VaultRequestType.EnableFingerprint;
  const isCustomAction = requestType === VaultRequestType.CustomAction;
  const isDeleteNote = requestType === VaultRequestType.DeleteNote;
  const isShareNote = requestType === VaultRequestType.ShareNote;
  const isGoToEditor = requestType === VaultRequestType.GoToEditor;

  return (
    <BaseDialog
      onShow={async () => {
        await sleep(100);
        passInputRef.current?.focus();
      }}
      statusBarTranslucent={false}
      onRequestClose={close}
      visible={true}
    >
      <View
        style={{
          ...getElevationStyle(5),
          width: DDS.isTab ? 350 : "85%",
          borderRadius: 10,
          backgroundColor: colors.primary.background,
          paddingTop: 12
        }}
      >
        <DialogHeader
          title={titleRef.current}
          paragraph={
            paragraphRef.current || customActionParagraphRef.current || ""
          }
          icon="shield"
          padding={12}
        />
        <Seperator half />

        <View
          style={{
            paddingHorizontal: DefaultAppStyles.GAP
          }}
        >
          {(isChangePassword ||
            isClearVault ||
            !isCreateVault ||
            isDeleteVault ||
            isCustomAction) &&
          !isRevokeFingerprint ? (
            <>
              <Input
                fwdRef={passInputRef}
                editable={!loading}
                autoCapitalize="none"
                testID={notesnook.ids.dialogs.vault.pwd}
                onChangeText={(value) => {
                  passwordRef.current = value;
                }}
                marginBottom={
                  !biometricUnlock ||
                  !isBiometryEnrolled ||
                  isCreateVault ||
                  isChangePassword ||
                  isCustomAction
                    ? 0
                    : 10
                }
                onSubmit={() => {
                  if (isChangePassword) {
                    confirmPassRef.current?.focus();
                  } else {
                    onPress();
                  }
                }}
                autoComplete="password"
                returnKeyLabel={
                  isChangePassword ? strings.next() : titleRef.current
                }
                returnKeyType={isChangePassword ? "next" : "done"}
                secureTextEntry
                placeholder={
                  isChangePassword
                    ? strings.currentPassword()
                    : strings.password()
                }
              />

              {!biometricUnlock ||
              !isBiometryEnrolled ||
              isCreateVault ||
              isChangePassword ||
              isCustomAction ? null : (
                <Button
                  onPress={() =>
                    onPressFingerprintAuth(strings.unlockNote(), "")
                  }
                  icon="fingerprint"
                  width="100%"
                  title={strings.unlockWithBiometrics()}
                  type="transparent"
                />
              )}
            </>
          ) : null}

          {isDeleteVault && (
            <Button
              onPress={() => setDeleteAll(!deleteAll)}
              icon={
                deleteAll
                  ? "check-circle-outline"
                  : "checkbox-blank-circle-outline"
              }
              style={{
                marginTop: DefaultAppStyles.GAP_VERTICAL
              }}
              width="100%"
              title={strings.deleteAllNotes()}
              type="errorShade"
            />
          )}

          {isChangePassword ? (
            <>
              <Seperator half />
              <Input
                fwdRef={confirmPassRef}
                editable={!loading}
                testID={notesnook.ids.dialogs.vault.changePwd}
                autoCapitalize="none"
                onChangeText={(value) => {
                  newPasswordRef.current = value;
                }}
                autoComplete="password"
                onSubmit={() => {
                  onPress();
                }}
                returnKeyLabel="Change"
                returnKeyType="done"
                secureTextEntry
                placeholder={strings.newPassword()}
              />
            </>
          ) : null}

          {isCreateVault ? (
            <View>
              <Input
                fwdRef={passInputRef}
                autoCapitalize="none"
                testID={notesnook.ids.dialogs.vault.pwd}
                onChangeText={(value) => {
                  passwordRef.current = value;
                }}
                autoComplete="password"
                returnKeyLabel={strings.next()}
                returnKeyType="next"
                secureTextEntry
                onSubmit={() => {
                  confirmPassRef.current?.focus();
                }}
                placeholder={strings.password()}
              />

              <Input
                fwdRef={confirmPassRef}
                autoCapitalize="none"
                testID={notesnook.ids.dialogs.vault.pwdAlt}
                secureTextEntry
                validationType="confirmPassword"
                customValidator={() => passwordRef.current || ""}
                errorMessage="Passwords do not match."
                onErrorCheck={() => null}
                marginBottom={0}
                autoComplete="password"
                returnKeyLabel="Create"
                returnKeyType="done"
                onChangeText={(value) => {
                  confirmPasswordRef.current = value;
                  if (value !== passwordRef.current) {
                    setPasswordsDontMatch(true);
                  } else {
                    setPasswordsDontMatch(false);
                  }
                }}
                onSubmit={() => {
                  onPress();
                }}
                placeholder={strings.confirmPassword()}
              />
            </View>
          ) : null}

          {biometricUnlock && !isBiometryEnrolled && !isCreateVault ? (
            <Paragraph>{strings.vaultEnableBiometrics()}</Paragraph>
          ) : null}

          {requestType === VaultRequestType.CopyNote ||
          requestType === VaultRequestType.DeleteNote ||
          requestType === VaultRequestType.ShareNote ||
          requestType === VaultRequestType.CustomAction ||
          requestType === VaultRequestType.GoToEditor ||
          requestType === VaultRequestType.PermanentUnlock ||
          requestType === VaultRequestType.LockNote ? (
            <Button
              onPress={() => {
                setBiometricUnlock(!biometricUnlock);
              }}
              style={{
                marginTop: DefaultAppStyles.GAP_VERTICAL
              }}
              icon="fingerprint"
              width="100%"
              title={strings.unlockWithBiometrics()}
              iconColor={
                biometricUnlock ? colors.selected.accent : colors.primary.icon
              }
              type={biometricUnlock ? "transparent" : "plain"}
            />
          ) : null}
        </View>

        <DialogButtons
          onPressNegative={close}
          onPressPositive={onPress}
          loading={loading}
          positiveType={positiveButtonTypeRef.current}
          positiveTitle={buttonTitleRef.current || strings.unlock()}
        />
      </View>
      <Toast context="local" />
    </BaseDialog>
  );
};
