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

import { memo } from "react";
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
  mdiFileImageOutline,
  mdiFileDocumentOutline,
  mdiFileVideoOutline,
  mdiWeb,
  mdiUploadOutline,
  mdiLinkOff,
  mdiMagnifyPlusOutline,
  mdiMagnifyMinusOutline,
  mdiRotateRight,
  mdiRotateLeft,
  mdiKeyOutline,
  mdiDatabaseImportOutline,
  mdiDeveloperBoard,
  mdiInformationOutline,
  mdiHeadCogOutline,
  mdiFormTextarea,
  mdiGavel,
  mdiDesktopClassic,
  mdiBellBadgeOutline,
  mdiDotsHorizontal,
  mdiCalendarBlank,
  mdiFormatListBulleted,
  mdiLink,
  mdiWindowClose,
  mdiFileMusicOutline,
  mdiBroom,
  mdiServerSecurity,
  mdiOpenInNew,
  mdiTagOutline,
  mdiChatQuestionOutline,
  mdiNoteRemoveOutline
} from "@mdi/js";
import { useTheme } from "@emotion/react";
import { Theme } from "@notesnook/theme";
import { Flex, FlexProps } from "@theme-ui/components";
import { isThemeColor, SchemeColors } from "@notesnook/theme";

type MDIIconWrapperProps = {
  title?: string;
  path: string;
  size?: keyof Theme["iconSizes"] | number;
  color?: SchemeColors;
  rotate?: boolean;
  rotateDirection?: "clockwise" | "counterclockwise";
};
function _MDIIconWrapper({
  title,
  path,
  size = 24,
  color = "icon",
  rotate,
  rotateDirection
}: MDIIconWrapperProps) {
  const theme = useTheme() as Theme;

  const themedColor: string =
    theme?.colors && isThemeColor(color, theme.colors)
      ? theme.colors[color]
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
      spin={rotate ? (rotateDirection === "clockwise" ? 2 : -2) : false}
    />
  );
}
const MDIIconWrapper = memo(
  _MDIIconWrapper,
  (prev, next) =>
    prev.rotate === next.rotate &&
    prev.color === next.color &&
    prev.title === next.title
);

export type IconProps = FlexProps & Omit<MDIIconWrapperProps, "path">;

export type Icon = {
  (props: IconProps): JSX.Element;
  isReactComponent: boolean;
  path: string;
};

function createIcon(path: string, rotate = false) {
  const NNIcon: Icon = function Icon(props) {
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
      >
        <MDIIconWrapper
          title={props.title}
          path={path}
          rotate={_rotate}
          size={size}
          color={props.color}
        />
      </Flex>
    );
  };
  NNIcon.isReactComponent = true;
  NNIcon.path = path;
  return NNIcon;
}

export const Plus = createIcon(mdiPlus);
export const Note = createIcon(mdiNoteOutline);
export const NoteRemove = createIcon(mdiNoteRemoveOutline);
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
export const MoreHorizontal = createIcon(mdiDotsHorizontal);
export const Trash = createIcon(mdiTrashCanOutline);
export const TopicRemove = createIcon(mdiBookmarkRemoveOutline);
export const NotebookRemove = createIcon(mdiBookRemoveOutline);
export const Search = createIcon(mdiMagnify);
export const TableOfContents = createIcon(mdiFormatListBulleted);
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
export const InternalLink = createIcon(mdiLink);
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
export const Discord = createIcon(
  `m22 24l-5.25-5l.63 2H4.5A2.5 2.5 0 0 1 2 18.5v-15A2.5 2.5 0 0 1 4.5 1h15A2.5 2.5 0 0 1 22 3.5V24M12 6.8c-2.68 0-4.56 1.15-4.56 1.15c1.03-.92 2.83-1.45 2.83-1.45l-.17-.17c-1.69.03-3.22 1.2-3.22 1.2c-1.72 3.59-1.61 6.69-1.61 6.69c1.4 1.81 3.48 1.68 3.48 1.68l.71-.9c-1.25-.27-2.04-1.38-2.04-1.38S9.3 14.9 12 14.9s4.58-1.28 4.58-1.28s-.79 1.11-2.04 1.38l.71.9s2.08.13 3.48-1.68c0 0 .11-3.1-1.61-6.69c0 0-1.53-1.17-3.22-1.2l-.17.17s1.8.53 2.83 1.45c0 0-1.88-1.15-4.56-1.15m-2.07 3.79c.65 0 1.18.57 1.17 1.27c0 .69-.52 1.27-1.17 1.27c-.64 0-1.16-.58-1.16-1.27c0-.7.51-1.27 1.16-1.27m4.17 0c.65 0 1.17.57 1.17 1.27c0 .69-.52 1.27-1.17 1.27c-.64 0-1.16-.58-1.16-1.27c0-.7.51-1.27 1.16-1.27Z`
);
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
export const Saved = createIcon(mdiCheckAll);
export const NotSaved = createIcon(mdiClose);

export const MfaAuthenticator = createIcon(mdiCellphoneKey);
export const MfaEmail = createIcon(mdiEmailOutline);
export const MfaRecoveryCode = createIcon(mdiRestore);
export const MfaSms = createIcon(mdiMessageLockOutline);
export const MfaEnabled = createIcon(mdiShieldCheckOutline);
export const Reupload = createIcon(mdiProgressUpload);
export const Rename = createIcon(mdiFormTextbox);
export const Upload = createIcon(mdiCloudOffOutline);
export const Uploaded = createIcon(mdiCloudCheckOutline);
export const Uploading = createIcon(mdiUploadOutline);
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

export const EditorNormalWidth = createIcon(
  `M4 20q-.825 0-1.412-.587Q2 18.825 2 18V6q0-.825.588-1.412Q3.175 4 4 4h16q.825 0 1.413.588Q22 5.175 22 6v12q0 .825-.587 1.413Q20.825 20 20 20Zm0-2h2V6H4v12Zm4 0h8V6H8Zm10 0h2V6h-2ZM8 6v12Z`
);
export const EditorFullWidth = createIcon(
  `M4 20q-.825 0-1.412-.587Q2 18.825 2 18V6q0-.825.588-1.412Q3.175 4 4 4h16q.825 0 1.413.588Q22 5.175 22 6v12q0 .825-.587 1.413Q20.825 20 20 20Zm0-2h1V6H4v12Zm3 0h10V6H7Zm12 0h1V6h-1ZM7 6v12Z`
);
export const Suggestion = createIcon(mdiLightbulbOnOutline);

export const FileImage = createIcon(mdiFileImageOutline);
export const FilePDF = createIcon(
  `M14 2l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8m4 18V9h-5V4H6v16h12m-7.08-7.69c-.24-.77-.77-3.23.63-3.27c1.4-.04.48 3.12.48 3.12c.39 1.49 2.02 2.56 2.02 2.56c.5-.15 3.35-.48 2.95 1c-.43 1.48-3.5.09-3.5.09c-1.95.14-3.41.66-3.41.66c-1.13 2.11-2.45 3.03-2.99 2.14c-.67-1.11 2.13-2.54 2.13-2.54c1.45-2.35 1.67-3.72 1.69-3.76m.65.84c-.4 1.3-1.2 2.69-1.2 2.69c.85-.34 2.71-.73 2.71-.73c-1.14-1-1.49-1.95-1.51-1.96m3.14 2.17s1.75.65 1.79.39c.07-.27-1.33-.51-1.79-.39m-5.66 1.49c-.77.3-1.51 1.58-1.33 1.58c.18.01.91-.6 1.33-1.58m2.52-5.55c0-.05.43-1.68 0-1.73c-.3-.03-.01 1.69 0 1.73z`
);
export const FileDocument = createIcon(mdiFileDocumentOutline);
export const FileVideo = createIcon(mdiFileVideoOutline);
export const FileAudio = createIcon(mdiFileMusicOutline);
export const FileGeneral = createIcon(mdiFileOutline);
export const FileWebClip = createIcon(mdiWeb);
export const Unlink = createIcon(mdiLinkOff);
export const ZoomIn = createIcon(mdiMagnifyPlusOutline);
export const ZoomOut = createIcon(mdiMagnifyMinusOutline);
export const RotateCW = createIcon(mdiRotateRight);
export const RotateACW = createIcon(mdiRotateLeft);
export const Reset = createIcon(mdiRestore);

export const Account = createIcon(mdiAccountOutline);
export const PasswordAndAuth = createIcon(mdiKeyOutline);
export const Appearance = createIcon(mdiPaletteSwatchOutline);
export const Import = createIcon(mdiDatabaseImportOutline);
export const Privacy = createIcon(mdiEyeOffOutline);
export const Developer = createIcon(mdiDeveloperBoard);
export const About = createIcon(mdiInformationOutline);
export const Behaviour = createIcon(mdiHeadCogOutline);
export const Editor = createIcon(mdiFormTextarea);
export const Documentation = createIcon(mdiFileDocumentOutline);
export const Legal = createIcon(mdiGavel);
export const Desktop = createIcon(mdiDesktopClassic);
export const Notification = createIcon(mdiBellBadgeOutline);
export const Servers = createIcon(mdiServerSecurity);
export const Calendar = createIcon(mdiCalendarBlank);

export const WindowMinimize = createIcon("M4 20v-2h16v2H4Z");
export const WindowMaximize = createIcon("M4 20V4h16v16Zm2-2h12V6H6ZM6 6v12Z");
export const WindowRestore = createIcon(
  "M8 16V4h12v12Zm2-2h8V6h-8Zm-6 6V8.525h2V18h9.475v2Zm6-6V6v8Z"
);
export const WindowClose = createIcon(mdiWindowClose);
export const ClearCache = createIcon(mdiBroom);
export const OpenInNew = createIcon(mdiOpenInNew);
export const Coupon = createIcon(mdiTagOutline);
export const Support = createIcon(mdiChatQuestionOutline);
