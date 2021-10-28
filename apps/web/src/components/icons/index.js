import React, { useState } from "react";
import MDIIcon from "@mdi/react";
import {
  mdiPlus,
  mdiHomeVariantOutline,
  mdiMinus,
  mdiBookOutline,
  mdiNotebookOutline,
  mdiArrowLeft,
  mdiArrowRight,
  mdiArrowDown,
  mdiBookPlusMultipleOutline,
  mdiBookmarkOutline,
  mdiAlert,
  mdiShieldOutline,
  mdiLockOpenOutline,
  mdiLockOutline,
  mdiStar,
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
  mdiFilePdfOutline,
  mdiLanguageHtml5,
  mdiFormatTitle,
  mdiAlertCircle,
  mdiInformation,
  mdiToggleSwitchOffOutline,
  mdiToggleSwitchOutline,
  mdiBackupRestore,
  mdiCurrencyUsdCircleOutline,
  mdiPencil,
  mdiUndoVariant,
  mdiRedoVariant,
  mdiTune,
  mdiChevronDown,
  mdiChevronUp,
  mdiSortAscending,
  mdiSortDescending,
  mdiEye,
  mdiEyeOff,
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
  mdiAlertOctagramOutline,
} from "@mdi/js";
import { useTheme } from "emotion-theming";
import { AnimatedFlex } from "../animated";

function Icon({ title, name, size = 24, color = "icon", stroke, rotate }) {
  const theme = useTheme();
  return (
    <MDIIcon
      title={title}
      path={name}
      size={size + "px"}
      style={{
        strokeWidth: stroke || "0px",
        stroke: theme.colors[color] || color,
      }}
      color={theme.colors[color] || color}
      spin={rotate}
    />
  );
}

function createIcon(name, rotate = false) {
  return function (props) {
    const [isHovering, setIsHovering] = useState();
    return (
      <AnimatedFlex
        id={props.id}
        title={props.title}
        variant={props.variant}
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        animate={props.animation}
        onClick={props.onClick}
        data-test-id={props["data-test-id"]}
        sx={props.sx}
        justifyContent="center"
        alignItems="center"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Icon
          title={props.title}
          name={name}
          rotate={rotate}
          color={
            props.hoverColor && isHovering ? props.hoverColor : props.color
          }
          {...props}
        />
      </AnimatedFlex>
    );
  };
}

export const Plus = createIcon(mdiPlus);
export const Note = createIcon(mdiNoteOutline);
export const Minus = createIcon(mdiMinus);
export const Notebook = createIcon(mdiBookOutline);
export const Notebook2 = createIcon(mdiNotebookOutline);
export const ArrowLeft = createIcon(mdiArrowLeft);
export const ArrowRight = createIcon(mdiArrowRight);
export const ArrowDown = createIcon(mdiArrowDown);
export const Move = createIcon(mdiBookPlusMultipleOutline);
export const Topic = createIcon(mdiBookmarkOutline);
export const Alert = createIcon(mdiAlertOctagramOutline);
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
export const TopicRemove = createIcon(mdiBookRemoveOutline);
export const Search = createIcon(mdiMagnify);
export const Menu = createIcon(mdiMenu);
export const Login = createIcon(mdiLoginVariant);
export const Email = createIcon(mdiEmailAlertOutline);
export const Signup = createIcon(mdiAccountOutline);
export const Logout = createIcon(mdiLogoutVariant);
export const FocusMode = createIcon(mdiSunglasses);
export const NormalMode = createIcon(mdiGlasses);
export const Settings = createIcon(mdiCogOutline);
export const Home = createIcon(mdiHomeOutline);
export const Restore = createIcon(mdiRecycle);
export const Sync = createIcon(mdiSync);
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
export const Theme = createIcon(mdiThemeLightDark);
export const Checkmark = createIcon(mdiCheck);
export const CheckCircle = createIcon(mdiCheckCircle);
export const Properties = createIcon(mdiDotsVertical);
export const Markdown = createIcon(mdiLanguageMarkdownOutline);
export const PDF = createIcon(mdiFilePdfOutline);
export const HTML = createIcon(mdiLanguageHtml5);
export const Text = createIcon(mdiFormatTitle);
export const Success = createIcon(mdiCheckCircle);
export const Error = createIcon(mdiAlertCircle);
export const Warn = createIcon(mdiAlertOutline);
export const Info = createIcon(mdiInformation);
export const ToggleUnchecked = createIcon(mdiToggleSwitchOffOutline);
export const ToggleChecked = createIcon(mdiToggleSwitchOutline);
export const Backup = createIcon(mdiBackupRestore);
export const Buy = createIcon(mdiCurrencyUsdCircleOutline);
export const Edit = createIcon(mdiPencil);
export const Undo = createIcon(mdiUndoVariant);
export const Redo = createIcon(mdiRedoVariant);
export const Filter = createIcon(mdiTune);
export const ChevronDown = createIcon(mdiChevronDown);
export const ChevronUp = createIcon(mdiChevronUp);
export const SortAsc = createIcon(mdiSortAscending);
export const SortDesc = createIcon(mdiSortDescending);
export const PasswordInvisible = createIcon(mdiEye);
export const PasswordVisible = createIcon(mdiEyeOff);
export const Fullscreen = createIcon(mdiFullscreen);
export const ExitFullscreen = createIcon(mdiFullscreenExit);
export const Announcement = createIcon(mdiBullhorn);
export const Publish = createIcon(mdiCloudUploadOutline);
export const Published = createIcon(mdiCloudCheckOutline);
export const Copy = createIcon(mdiContentCopy);
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
export const Reddit = createIcon(mdiReddit);
export const Dismiss = createIcon(mdiClose);
export const File = createIcon(mdiFileOutline);
export const Download = createIcon(mdiArrowDown);
export const ImageDownload = createIcon(mdiImage);
