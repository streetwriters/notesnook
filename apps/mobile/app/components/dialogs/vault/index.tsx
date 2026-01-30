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

type VaultDialogData = {
  item: Note;
} & Partial<Omit<Vault, "item">>;

interface VaultDialogState {
  visible: boolean;
  wrongPassword: boolean;
  loading: boolean;
  note?: Note;
  vault: boolean;
  locked: boolean;
  permanant: boolean;
  goToEditor: boolean;
  share: boolean;
  passwordsDontMatch: boolean;
  deleteNote: boolean;
  focusIndex: number | null;
  biometricUnlock: boolean;
  isBiometryEnrolled: boolean;
  isBiometryAvailable: boolean;
  fingerprintAccess: boolean;
  changePassword: boolean;
  copyNote: boolean;
  revokeFingerprintAccess: boolean;
  title: string;
  description: string | null;
  clearVault: boolean;
  deleteVault: boolean;
  deleteAll: boolean;
  noteLocked: boolean;
  novault: boolean;
  customActionTitle: string | null;
  customActionParagraph: string | null;
  customAction: boolean;
  onUnlock?: (
    item: Note & {
      content?: NoteContent<false>;
    },
    password: string
  ) => void;
}

export const VaultDialog: React.FC = () => {
  const { colors } = useThemeColors();

  const [state, setState] = useState<VaultDialogState>({
    visible: false,
    wrongPassword: false,
    loading: false,
    note: undefined,
    vault: false,
    locked: true,
    permanant: false,
    goToEditor: false,
    share: false,
    passwordsDontMatch: false,
    deleteNote: false,
    focusIndex: null,
    biometricUnlock: false,
    isBiometryEnrolled: false,
    isBiometryAvailable: false,
    fingerprintAccess: false,
    changePassword: false,
    copyNote: false,
    revokeFingerprintAccess: false,
    title: strings.goToEditor(),
    description: null,
    clearVault: false,
    deleteVault: false,
    deleteAll: false,
    noteLocked: false,
    novault: false,
    customActionTitle: null,
    customActionParagraph: null,
    customAction: false,
    onUnlock: undefined
  });

  const passInputRef = useRef<TextInput>(null);
  const confirmPassRef = useRef<TextInput>(null);
  const changePassInputRef = useRef<TextInput>(null);

  const passwordRef = useRef<string | null>(null);
  const confirmPasswordRef = useRef<string | null>(null);
  const newPasswordRef = useRef<string | null>(null);

  const open = useCallback(async (data: VaultDialogData) => {
    const biometry = await BiometricService.isBiometryAvailable();
    const available = !!biometry;
    const fingerprint = await BiometricService.hasInternetCredentials();

    const noteLocked = data.item
      ? await db.vaults.itemExists(data.item)
      : false;

    setState((prev) => ({
      ...prev,
      note: data.item,
      novault: data.novault || false,
      locked: data.locked || false,
      permanant: data.permanant || false,
      goToEditor: data.goToEditor || false,
      share: data.share || false,
      deleteNote: data.deleteNote || false,
      copyNote: data.copyNote || false,
      isBiometryAvailable: available,
      biometricUnlock: fingerprint,
      isBiometryEnrolled: fingerprint,
      fingerprintAccess: data.fingerprintAccess || false,
      changePassword: data.changePassword || false,
      revokeFingerprintAccess: data.revokeFingerprintAccess || false,
      title: data.title || strings.goToEditor(),
      description: data.description || null,
      clearVault: data.clearVault || false,
      deleteVault: data.deleteVault || false,
      noteLocked,
      customActionTitle: data.customActionTitle || null,
      customActionParagraph: data.customActionParagraph || null,
      customAction: !!(data.customActionTitle && data.customActionParagraph),
      onUnlock: data.onUnlock
    }));

    if (
      fingerprint &&
      data.novault &&
      !data.fingerprintAccess &&
      !data.revokeFingerprintAccess &&
      !data.changePassword &&
      !data.clearVault &&
      !data.deleteVault &&
      !data.customActionTitle
    ) {
      await onPressFingerprintAuth(data.title, data.description);
    } else {
      setState((prev) => ({ ...prev, visible: true }));
    }
  }, []);

  const close = useCallback(() => {
    if (state.loading) {
      ToastManager.show({
        heading: state.title,
        message: strings.pleaseWait() + "...",
        type: "success",
        context: "local"
      });
      return;
    }

    Navigation.queueRoutesForUpdate();

    passwordRef.current = null;
    confirmPasswordRef.current = null;
    newPasswordRef.current = null;

    setState({
      visible: false,
      wrongPassword: false,
      loading: false,
      note: undefined,
      vault: false,
      locked: false,
      permanant: false,
      goToEditor: false,
      share: false,
      passwordsDontMatch: false,
      deleteNote: false,
      focusIndex: null,
      biometricUnlock: false,
      isBiometryEnrolled: false,
      isBiometryAvailable: false,
      fingerprintAccess: false,
      changePassword: false,
      copyNote: false,
      revokeFingerprintAccess: false,
      title: strings.goToEditor(),
      description: null,
      clearVault: false,
      deleteVault: false,
      deleteAll: false,
      noteLocked: false,
      novault: false,
      customActionTitle: null,
      customActionParagraph: null,
      customAction: false,
      onUnlock: undefined
    });
  }, [state.loading, state.title]);

  const deleteVault = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      let verified = true;
      if (await db.user.getUser()) {
        verified = await db.user.verifyPassword(passwordRef.current || "");
      }
      if (verified) {
        let noteIds: string[] = [];
        if (state.deleteAll) {
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
        await db.vault.delete(state.deleteAll);

        if (state.deleteAll) {
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
        setState((prev) => ({ ...prev, loading: false }));
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
  }, [state.deleteAll, close]);

  const clearVault = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
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
      setState((prev) => ({ ...prev, loading: false }));
      close();
      eSendEvent("vaultUpdated");
    } catch (e) {
      ToastManager.show({
        heading: strings.passwordIncorrect(),
        type: "error",
        context: "local"
      });
    }
    setState((prev) => ({ ...prev, loading: false }));
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
      await db.vault.add(state.note!.id);

      eSendEvent(eUpdateNoteInEditor, state.note, true);

      close();
      ToastManager.show({
        message: strings.noteLocked(),
        type: "error",
        context: "local"
      });
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [state.note, close]);

  const permanantUnlock = useCallback(() => {
    db.vault
      .remove(state.note!.id, passwordRef.current || "")
      .then(() => {
        ToastManager.show({
          heading: strings.noteUnlocked(),
          type: "success",
          context: "global"
        });
        eSendEvent(eUpdateNoteInEditor, state.note, true);
        close();
      })
      .catch((e) => {
        takeErrorAction();
      });
  }, [state.note, close]);

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
      await db.vault.remove(state.note!.id, passwordRef.current || "");
      await deleteItems("note", [state.note!.id]);
      close();
    } catch (e) {
      takeErrorAction();
    }
  }, [state.note, close]);

  const takeErrorAction = useCallback(() => {
    setState((prev) => ({
      ...prev,
      wrongPassword: true,
      visible: true
    }));
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

      const note = await db.vault.open(state.note!.id, passwordRef.current);
      if (!note) throw new Error("Failed to unlock note.");
      if (state.biometricUnlock && !state.isBiometryEnrolled) {
        await enrollFingerprint(passwordRef.current || "");
      }

      if (state.goToEditor) {
        openInEditor(note);
      } else if (state.share) {
        await shareNote(note);
      } else if (state.deleteNote) {
        await deleteNote();
      } else if (state.copyNote) {
        await copyNote(note);
      } else if (state.customAction && state.onUnlock) {
        const password = passwordRef.current;
        close();
        await sleep(300);
        state.onUnlock(note, password);
      }
    } catch (e) {
      takeErrorAction();
    }
  }, [
    state.note,
    state.biometricUnlock,
    state.isBiometryEnrolled,
    state.goToEditor,
    state.share,
    state.deleteNote,
    state.copyNote,
    state.customAction,
    state.onUnlock,
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
    if (state.permanant) {
      permanantUnlock();
    } else {
      await openNote();
    }
  }, [state.permanant, permanantUnlock, openNote]);

  const enrollFingerprint = useCallback(
    async (password: string) => {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        await db.vault.unlock(password);
        await BiometricService.storeCredentials(password);
        setState((prev) => ({ ...prev, loading: false }));
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
        setState((prev) => ({ ...prev, loading: false }));
      }
    },
    [close]
  );

  const createVault = useCallback(async () => {
    await db.vault.create(passwordRef.current || "");

    if (state.biometricUnlock) {
      await enrollFingerprint(passwordRef.current || "");
    }
    if (state.note?.id) {
      await db.vault.add(state.note.id);
      eSendEvent(eUpdateNoteInEditor, state.note, true);
      setState((prev) => ({ ...prev, loading: false }));
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
  }, [state.biometricUnlock, state.note, enrollFingerprint, close]);

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
          title || state.title,
          description || state.description || ""
        );

        if (!credentials) throw new Error("Failed to get user credentials");

        if (credentials?.password) {
          passwordRef.current = credentials.password;
          onPress();
        } else {
          eSendEvent(eCloseActionSheet);
          await sleep(300);
          setState((prev) => ({ ...prev, visible: true }));
        }
      } catch (e) {
        console.error(e);
      }
    },
    [state.title, state.description]
  );

  const onPress = useCallback(async () => {
    if (state.revokeFingerprintAccess) {
      await revokeFingerprintAccess();
      close();
      return;
    }
    if (state.loading) return;

    if (!passwordRef.current) {
      ToastManager.show({
        heading: strings.passwordNotEntered(),
        type: "error",
        context: "local"
      });
      return;
    }

    if (!state.novault) {
      if (passwordRef.current !== confirmPasswordRef.current) {
        ToastManager.show({
          heading: strings.passwordNotMatched(),
          type: "error",
          context: "local"
        });
        setState((prev) => ({ ...prev, passwordsDontMatch: true }));
        return;
      }

      createVault();
    } else if (state.changePassword) {
      setState((prev) => ({ ...prev, loading: true }));

      db.vault
        .changePassword(passwordRef.current, newPasswordRef.current || "")
        .then(() => {
          setState((prev) => ({ ...prev, loading: false }));
          if (state.biometricUnlock) {
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
          setState((prev) => ({ ...prev, loading: false }));
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
    } else if (state.locked) {
      if (!passwordRef.current || passwordRef.current.trim() === "") {
        ToastManager.show({
          heading: strings.passwordIncorrect(),
          type: "error",
          context: "local"
        });
        setState((prev) => ({ ...prev, wrongPassword: true }));
        return;
      }
      if (state.noteLocked) {
        await unlockNote();
      } else {
        db.vault
          .unlock(passwordRef.current)
          .then(async () => {
            setState((prev) => ({ ...prev, wrongPassword: false }));
            await lockNote();
          })
          .catch((e) => {
            takeErrorAction();
          });
      }
    } else if (state.fingerprintAccess) {
      enrollFingerprint(passwordRef.current);
    } else if (state.clearVault) {
      await clearVault();
    } else if (state.deleteVault) {
      await deleteVault();
    } else if (state.customAction) {
      await unlockNote();
    }
  }, [
    state.revokeFingerprintAccess,
    state.loading,
    state.novault,
    state.changePassword,
    state.locked,
    state.noteLocked,
    state.fingerprintAccess,
    state.clearVault,
    state.deleteVault,
    state.customAction,
    state.biometricUnlock,
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

  if (!state.visible) return null;

  const {
    note,
    novault,
    deleteNote: shouldDeleteNote,
    share,
    goToEditor,
    fingerprintAccess,
    changePassword,
    loading,
    deleteVault: shouldDeleteVault,
    clearVault: shouldClearVault,
    customAction,
    customActionTitle,
    customActionParagraph
  } = state;

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
          title={state.title}
          paragraph={customActionParagraph || ""}
          icon="shield"
          padding={12}
        />
        <Seperator half />

        <View
          style={{
            paddingHorizontal: DefaultAppStyles.GAP
          }}
        >
          {(novault ||
            changePassword ||
            shouldClearVault ||
            shouldDeleteVault ||
            customAction) &&
          !state.revokeFingerprintAccess ? (
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
                  !state.biometricUnlock ||
                  !state.isBiometryEnrolled ||
                  !novault ||
                  changePassword ||
                  customAction
                    ? 0
                    : 10
                }
                onSubmit={() => {
                  if (changePassword) {
                    confirmPassRef.current?.focus();
                  } else {
                    onPress();
                  }
                }}
                autoComplete="password"
                returnKeyLabel={changePassword ? strings.next() : state.title}
                returnKeyType={changePassword ? "next" : "done"}
                secureTextEntry
                placeholder={
                  changePassword
                    ? strings.currentPassword()
                    : strings.password()
                }
              />

              {!state.biometricUnlock ||
              !state.isBiometryEnrolled ||
              !novault ||
              changePassword ||
              customAction ? null : (
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

          {shouldDeleteVault && (
            <Button
              onPress={() =>
                setState((prev) => ({
                  ...prev,
                  deleteAll: !prev.deleteAll
                }))
              }
              icon={
                state.deleteAll
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

          {changePassword ? (
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

          {!novault ? (
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
                    setState((prev) => ({ ...prev, passwordsDontMatch: true }));
                  } else {
                    setState((prev) => ({
                      ...prev,
                      passwordsDontMatch: false
                    }));
                  }
                }}
                onSubmit={() => {
                  onPress();
                }}
                placeholder={strings.confirmPassword()}
              />
            </View>
          ) : null}

          {state.biometricUnlock && !state.isBiometryEnrolled && novault ? (
            <Paragraph>{strings.vaultEnableBiometrics()}</Paragraph>
          ) : null}

          {state.isBiometryAvailable &&
          !state.fingerprintAccess &&
          !shouldClearVault &&
          !shouldDeleteVault &&
          !customAction &&
          ((!state.biometricUnlock && !changePassword) || !novault) ? (
            <Button
              onPress={() => {
                setState((prev) => ({
                  ...prev,
                  biometricUnlock: !prev.biometricUnlock
                }));
              }}
              style={{
                marginTop: DefaultAppStyles.GAP_VERTICAL
              }}
              icon="fingerprint"
              width="100%"
              title={strings.unlockWithBiometrics()}
              iconColor={
                state.biometricUnlock
                  ? colors.selected.accent
                  : colors.primary.icon
              }
              type={state.biometricUnlock ? "transparent" : "plain"}
            />
          ) : null}
        </View>

        <DialogButtons
          onPressNegative={close}
          onPressPositive={onPress}
          loading={loading}
          positiveType={
            shouldDeleteVault || shouldClearVault ? "errorShade" : "transparent"
          }
          positiveTitle={
            shouldDeleteVault
              ? strings.delete()
              : shouldClearVault
              ? strings.clear()
              : fingerprintAccess
              ? strings.enable()
              : state.revokeFingerprintAccess
              ? strings.revoke()
              : changePassword
              ? strings.change()
              : customAction && customActionTitle
              ? customActionTitle
              : state.noteLocked
              ? shouldDeleteNote
                ? strings.delete()
                : share
                ? strings.share()
                : goToEditor
                ? strings.open()
                : strings.unlock()
              : !note?.id
              ? strings.create()
              : strings.lock()
          }
        />
      </View>
      <Toast context="local" />
    </BaseDialog>
  );
};
