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
import MDIIcon from "@mdi/react";
import {
  mdiPlus,
  mdiMinus,
  mdiBookOutline,
  mdiNotebookOutline,
  mdiArrowLeft,
  mdiArrowRight,
  mdiArrowDown,
  mdiBookPlusMultipleOutline,
  mdiBookmarkOutline,
  mdiShieldOutline,
  mdiLockOpenOutline,
  mdiLockOutline,
  mdiStarOutline,
  mdiCircle,
  mdiCircleOutline,
  mdiUpdate,
  mdiCheck,
  mdiClose,
  mdiDotsVertical,
  mdiTrashCanOutline,
  mdiBookRemoveOutline,
  mdiMagnify,
  mdiMenu,
  mdiLoginVariant,
  mdiEmailAlertOutline,
  mdiAccountOutline,
  mdiLogoutVariant,
  mdiSunglasses,
  mdiGlasses,
  mdiCogOutline,
  mdiHomeOutline,
  mdiRecycle,
  mdiSync,
  mdiSyncOff,
  mdiLoading,
  mdiExportVariant,
  mdiArrowExpandDown,
  mdiArrowTopRightThick,
  mdiChevronLeft,
  mdiChevronRight,
  mdiPound,
  mdiPinOutline,
  mdiPin,
  mdiWeatherNight,
  mdiWeatherSunny,
  mdiThemeLightDark,
  mdiCheckCircle,
  mdiLanguageMarkdownOutline,
  mdiFilePdfBox,
  mdiLanguageHtml5,
  mdiFormatTitle,
  mdiAlertCircle,
  mdiInformation,
  mdiToggleSwitchOffOutline,
  mdiToggleSwitchOutline,
  mdiBackupRestore,
  mdiPencil,
  mdiUndoVariant,
  mdiRedoVariant,
  mdiTune,
  mdiChevronDown,
  mdiChevronUp,
  mdiSortAscending,
  mdiSortDescending,
  mdiFullscreen,
  mdiFullscreenExit,
  mdiBullhorn,
  mdiCloudUploadOutline,
  mdiCloudCheckOutline,
  mdiContentCopy,
  mdiCheckboxMultipleMarkedCircleOutline,
  mdiBookEditOutline,
  mdiDeleteForeverOutline,
  mdiTextBoxMultipleOutline,
  mdiRocketLaunchOutline,
  mdiShareVariantOutline,
  mdiFormTextboxPassword,
  mdiBomb,
  mdiViewHeadline,
  mdiViewSequentialOutline,
  mdiEmailCheckOutline,
  mdiDiscord,
  mdiTwitter,
  mdiReddit,
  mdiFileOutline,
  mdiImage,
  mdiNoteOutline,
  mdiSyncAlert,
  mdiAlertOutline,
  mdiEyeOutline,
  mdiEyeOffOutline,
  mdiAttachment,
  mdiPencilOutline,
  mdiBillboard,
  mdiCellphone,
  mdiCellphoneLock,
  mdiFileLockOutline,
  mdiShieldLockOutline,
  mdiImageMultipleOutline,
  mdiHarddisk,
  mdiFileCabinet,
  mdiEmoticonOutline,
  mdiPaletteOutline,
  mdiFormatBold,
  mdiTable,
  mdiCrownOutline,
  mdiDatabaseLockOutline,
  mdiPaletteSwatchOutline,
  mdiAppleIos,
  mdiMicrosoftWindows,
  mdiLinux,
  mdiApple,
  mdiYoutube,
  mdiCheckCircleOutline,
  mdiAndroid,
  mdiIncognito,
  mdiCloudLockOutline,
  mdiGoogleChrome,
  mdiFirefox,
  mdiAppleSafari,
  mdiBugOutline,
  mdiLinkVariant,
  mdiLinkVariantOff,
  mdiNetworkOffOutline,
  mdiCheckNetworkOutline,
  mdiPencilLockOutline,
  mdiSort,
  mdiOrderAlphabeticalAscending,
  mdiOrderAlphabeticalDescending,
  mdiOrderNumericDescending,
  mdiOrderNumericAscending,
  mdiSelectGroup,
  mdiContentSaveCheckOutline,
  mdiContentSaveAlertOutline,
  mdiCurrencyUsd,
  mdiCellphoneKey,
  mdiEmailOutline,
  mdiMessageLockOutline,
  mdiShieldCheckOutline,
  mdiAlertOctagonOutline,
  mdiGithub,
  mdiAlertCircleOutline,
  mdiProgressUpload,
  mdiFormTextbox,
  mdiCheckAll,
  mdiCloudOffOutline,
  mdiContentDuplicate,
  mdiPrinterOutline,
  mdiRefresh,
  mdiRestore,
  mdiVectorLink,
  mdiCodeBraces,
  mdiArrowCollapseHorizontal,
  mdiSpeedometer,
  mdiFormatLineSpacing,
  mdiCalendarClockOutline,
  mdiPuzzleOutline,
  mdiBellRingOutline,
  mdiClockTimeFiveOutline,
  mdiBellOffOutline,
  mdiVibrate,
  mdiBellCancelOutline,
  mdiBellPlusOutline,
  mdiBellOutline,
  mdiGestureTapButton,
  mdiCloseCircleOutline,
  mdiMinusCircleOutline,
  mdiLightbulbOnOutline,
  mdiNoteMultipleOutline,
  mdiBookMultipleOutline,
  mdiArrowTopRight,
  mdiBookmarkRemoveOutline,
  mdiCalendarAlert
} from "@mdi/js";
import { useTheme } from "@emotion/react";
import { Theme } from "@notesnook/theme";
import { Flex, FlexProps } from "@theme-ui/components";
import { MotionProps } from "framer-motion";

type MDIIconWrapperProps = {
  title?: string;
  path: string;
  size?: keyof Theme["iconSizes"] | number;
  color?: keyof Theme["colors"];
  rotate?: boolean;
};
function MDIIconWrapper({
  title,
  path,
  size = 24,
  color = "icon",
  rotate
}: MDIIconWrapperProps) {
  const theme = useTheme() as Theme;

  const themedColor: string = theme?.colors
    ? (theme.colors[color] as string)
    : color;

  return (
    <MDIIcon
      className="icon"
      title={title}
      path={path}
      size={
        typeof size === "string"
          ? `${theme?.iconSizes[size] || 24}px`
          : `${size}px`
      }
      style={{
        strokeWidth: 0,
        stroke: themedColor
      }}
      color={themedColor}
      spin={rotate}
    />
  );
}

export type IconProps = FlexProps &
  MotionProps &
  Omit<MDIIconWrapperProps, "path"> & {
    hoverColor?: keyof Theme["colors"];
  };

export type Icon = {
  (props: IconProps): JSX.Element;
  isReactComponent: boolean;
};

function createIcon(path: string, rotate = false) {
  const NNIcon: Icon = function Icon(props) {
    const [isHovering, setIsHovering] = useState(false);
    const { sx, rotate: _rotate = rotate, size, ...restProps } = props;
    return (
      <Flex
        {...restProps}
        sx={{
          ...sx,
          justifyContent: "center",
          alignItems: "center",
          flexShrink: 0
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <MDIIconWrapper
          title={props.title}
          path={path}
          rotate={_rotate}
          size={size}
          color={
            props.hoverColor && isHovering ? props.hoverColor : props.color
          }
        />
      </Flex>
    );
  };
  NNIcon.isReactComponent = true;
  return NNIcon;
}

export const Plus = createIcon(mdiPlus);
export const Note = createIcon(mdiNoteOutline);
export const Notes = createIcon(mdiNoteMultipleOutline);
export const Minus = createIcon(mdiMinus);
export const Notebook = createIcon(mdiBookOutline);
export const Notebooks = createIcon(mdiBookMultipleOutline);
export const Notebook2 = createIcon(mdiNotebookOutline);
export const ArrowLeft = createIcon(mdiArrowLeft);
export const ArrowRight = createIcon(mdiArrowRight);
export const ArrowDown = createIcon(mdiArrowDown);
export const ArrowTopRight = createIcon(mdiArrowTopRight);
export const Move = createIcon(mdiBookPlusMultipleOutline);
export const Topic = createIcon(mdiBookmarkOutline);
export const Alert = createIcon(mdiAlertOctagonOutline);
export const Vault = createIcon(mdiShieldOutline);
export const Unlock = createIcon(mdiLockOpenOutline);
export const Lock = createIcon(mdiLockOutline);
export const Star = createIcon(mdiStarOutline);
export const StarOutline = createIcon(mdiStarOutline);
export const Circle = createIcon(mdiCircle);
export const CircleEmpty = createIcon(mdiCircleOutline);
export const Update = createIcon(mdiUpdate);
export const Check = createIcon(mdiCheck);
export const Cross = createIcon(mdiClose);
export const MoreVertical = createIcon(mdiDotsVertical);
export const Trash = createIcon(mdiTrashCanOutline);
export const TopicRemove = createIcon(mdiBookmarkRemoveOutline);
export const NotebookRemove = createIcon(mdiBookRemoveOutline);
export const Search = createIcon(mdiMagnify);
export const Menu = createIcon(mdiMenu);
export const Login = createIcon(mdiLoginVariant);
export const Email = createIcon(mdiEmailAlertOutline);
export const Signup = createIcon(mdiAccountOutline);
export const Logout = createIcon(mdiLogoutVariant);
export const FocusMode = createIcon(mdiGlasses);
export const NormalMode = createIcon(mdiSunglasses);
export const Settings = createIcon(mdiCogOutline);
export const Home = createIcon(mdiHomeOutline);
export const Restore = createIcon(mdiRecycle);
export const Sync = createIcon(mdiSync);
export const SyncOff = createIcon(mdiSyncOff);
export const SyncError = createIcon(mdiSyncAlert);
export const Loading = createIcon(mdiLoading, true);
export const Export = createIcon(mdiExportVariant);
export const AddToNotebook = createIcon(mdiBookPlusMultipleOutline);
export const Expand = createIcon(mdiArrowExpandDown);
export const Shortcut = createIcon(mdiArrowTopRightThick);
export const ChevronLeft = createIcon(mdiChevronLeft);
export const ChevronRight = createIcon(mdiChevronRight);
export const Close = createIcon(mdiClose);
export const Tag = createIcon(mdiPound);
export const Tag2 = createIcon(mdiPound);
export const Pin = createIcon(mdiPinOutline);
export const PinFilled = createIcon(mdiPin);
export const User = createIcon(mdiAccountOutline);
export const DarkMode = createIcon(mdiWeatherNight);
export const LightMode = createIcon(mdiWeatherSunny);
export const ThemeIcon = createIcon(mdiThemeLightDark);
export const Checkmark = createIcon(mdiCheck);
export const DoubleCheckmark = createIcon(mdiCheckAll);
export const CheckCircle = createIcon(mdiCheckCircle);
export const CheckIntermediate = createIcon(mdiMinusCircleOutline);
export const CheckRemove = createIcon(mdiCloseCircleOutline);
export const CheckCircleOutline = createIcon(mdiCheckCircleOutline);
export const Properties = createIcon(mdiDotsVertical);
export const Markdown = createIcon(mdiLanguageMarkdownOutline);
export const PDF = createIcon(mdiFilePdfBox);
export const Attachment = createIcon(mdiAttachment);
export const AttachmentError = createIcon(mdiAlertCircleOutline);
export const Write = createIcon(mdiPencilOutline);
export const HTML = createIcon(mdiLanguageHtml5);
export const Text = createIcon(mdiFormatTitle);
export const Success = createIcon(mdiCheckCircle);
export const Error = createIcon(mdiAlertCircle);
export const Warn = createIcon(mdiAlertOutline);
export const Info = createIcon(mdiInformation);
export const ToggleUnchecked = createIcon(mdiToggleSwitchOffOutline);
export const ToggleChecked = createIcon(mdiToggleSwitchOutline);
export const Backup = createIcon(mdiBackupRestore);
export const Buy = createIcon(mdiCurrencyUsd);
export const Edit = createIcon(mdiPencil);
export const Undo = createIcon(mdiUndoVariant);
export const Redo = createIcon(mdiRedoVariant);
export const Filter = createIcon(mdiTune);
export const ChevronDown = createIcon(mdiChevronDown);
export const ChevronUp = createIcon(mdiChevronUp);
export const SortAsc = createIcon(mdiSortAscending);
export const SortDesc = createIcon(mdiSortDescending);
export const PasswordInvisible = createIcon(mdiEyeOutline);
export const PasswordVisible = createIcon(mdiEyeOffOutline);
export const Fullscreen = createIcon(mdiFullscreen);
export const ExitFullscreen = createIcon(mdiFullscreenExit);
export const Announcement = createIcon(mdiBullhorn);
export const Publish = createIcon(mdiCloudUploadOutline);
export const Colors = createIcon(mdiPaletteOutline);
export const Published = createIcon(mdiCloudCheckOutline);
export const Copy = createIcon(mdiContentCopy);
export const Refresh = createIcon(mdiRefresh);
export const Clock = createIcon(mdiClockTimeFiveOutline);
export const Duplicate = createIcon(mdiContentDuplicate);
export const Select = createIcon(mdiCheckboxMultipleMarkedCircleOutline);
export const NotebookEdit = createIcon(mdiBookEditOutline);
export const DeleteForver = createIcon(mdiDeleteForeverOutline);
export const Monographs = createIcon(mdiTextBoxMultipleOutline);
export const Rocket = createIcon(mdiRocketLaunchOutline);
export const Share = createIcon(mdiShareVariantOutline);
export const Password = createIcon(mdiFormTextboxPassword);
export const Destruct = createIcon(mdiBomb);
export const CompactView = createIcon(mdiViewHeadline);
export const DetailedView = createIcon(mdiViewSequentialOutline);
export const MailCheck = createIcon(mdiEmailCheckOutline);
export const Discord = createIcon(mdiDiscord);
export const Twitter = createIcon(mdiTwitter);
export const Github = createIcon(mdiGithub);
export const Reddit = createIcon(mdiReddit);
export const Dismiss = createIcon(mdiClose);
export const File = createIcon(mdiFileOutline);
export const Download = createIcon(mdiArrowDown);
export const Print = createIcon(mdiPrinterOutline);
export const ImageDownload = createIcon(mdiImage);
export const Billboard = createIcon(mdiBillboard);
export const Cellphone = createIcon(mdiCellphone);
export const CellphoneLock = createIcon(mdiCellphoneLock);
export const FileLock = createIcon(mdiFileLockOutline);
export const ShieldLock = createIcon(mdiShieldLockOutline);
export const ImageMultiple = createIcon(mdiImageMultipleOutline);
export const Harddisk = createIcon(mdiHarddisk);
export const FileCabinet = createIcon(mdiFileCabinet);
export const Emoticon = createIcon(mdiEmoticonOutline);
export const Palette = createIcon(mdiPaletteOutline);
export const Bold = createIcon(mdiFormatBold);
export const Table = createIcon(mdiTable);
export const Pro = createIcon(mdiCrownOutline);
export const EncryptedBackup = createIcon(mdiDatabaseLockOutline);
export const Accent = createIcon(mdiPaletteSwatchOutline);

export const Ios = createIcon(mdiAppleIos);
export const Android = createIcon(mdiAndroid);
export const Windows = createIcon(mdiMicrosoftWindows);
export const Linux = createIcon(mdiLinux);
export const MacOs = createIcon(mdiApple);
export const Chrome = createIcon(mdiGoogleChrome);
export const Firefox = createIcon(mdiFirefox);
export const Safari = createIcon(mdiAppleSafari);

export const Embed = createIcon(mdiYoutube);
export const Anonymous = createIcon(mdiIncognito);
export const CloudLock = createIcon(mdiCloudLockOutline);
export const Timebomb = createIcon(mdiBomb);
export const Issue = createIcon(mdiBugOutline);
export const ShortcutLink = createIcon(mdiLinkVariant);
export const RemoveShortcutLink = createIcon(mdiLinkVariantOff);
export const Offline = createIcon(mdiNetworkOffOutline);
export const Online = createIcon(mdiCheckNetworkOutline);
export const Readonly = createIcon(mdiPencilLockOutline);

export const SortBy = createIcon(mdiSort);
export const GroupBy = createIcon(mdiSelectGroup);
export const OrderAtoZ = createIcon(mdiOrderAlphabeticalAscending);
export const OrderZtoA = createIcon(mdiOrderAlphabeticalDescending);
export const OrderOldestNewest = createIcon(mdiOrderNumericDescending);
export const OrderNewestOldest = createIcon(mdiOrderNumericAscending);
export const Saved = createIcon(mdiContentSaveCheckOutline);
export const NotSaved = createIcon(mdiContentSaveAlertOutline);

export const MfaAuthenticator = createIcon(mdiCellphoneKey);
export const MfaEmail = createIcon(mdiEmailOutline);
export const MfaRecoveryCode = createIcon(mdiRestore);
export const MfaSms = createIcon(mdiMessageLockOutline);
export const MfaEnabled = createIcon(mdiShieldCheckOutline);
export const Reupload = createIcon(mdiProgressUpload);
export const Rename = createIcon(mdiFormTextbox);
export const Upload = createIcon(mdiCloudOffOutline);
export const Uploaded = createIcon(mdiCloudCheckOutline);
export const References = createIcon(mdiVectorLink);
export const Codeblock = createIcon(mdiCodeBraces);
export const Resize = createIcon(mdiArrowCollapseHorizontal);
export const Performance = createIcon(mdiSpeedometer);
export const Date = createIcon(mdiCalendarClockOutline);
export const LineSpacing = createIcon(mdiFormatLineSpacing);
export const Extension = createIcon(mdiPuzzleOutline);

export const Reminders = createIcon(mdiBellRingOutline);
export const Reminder = createIcon(mdiBellOutline);
export const ReminderOff = createIcon(mdiBellCancelOutline);
export const AddReminder = createIcon(mdiBellPlusOutline);
export const Silent = createIcon(mdiBellOffOutline);
export const Vibrate = createIcon(mdiVibrate);
export const Loud = createIcon(mdiBellRingOutline);
export const CustomToolbar = createIcon(mdiGestureTapButton);
export const expiryDate = createIcon(mdiCalendarAlert);

export const EditorNormalWidth = createIcon(
  `M4 20q-.825 0-1.412-.587Q2 18.825 2 18V6q0-.825.588-1.412Q3.175 4 4 4h16q.825 0 1.413.588Q22 5.175 22 6v12q0 .825-.587 1.413Q20.825 20 20 20Zm0-2h2V6H4v12Zm4 0h8V6H8Zm10 0h2V6h-2ZM8 6v12Z`
);
export const EditorFullWidth = createIcon(
  `M4 20q-.825 0-1.412-.587Q2 18.825 2 18V6q0-.825.588-1.412Q3.175 4 4 4h16q.825 0 1.413.588Q22 5.175 22 6v12q0 .825-.587 1.413Q20.825 20 20 20Zm0-2h1V6H4v12Zm3 0h10V6H7Zm12 0h1V6h-1ZM7 6v12Z`
);
export const Suggestion = createIcon(mdiLightbulbOnOutline);
