import {
  mdiCheck,
  mdiChevronDown,
  mdiLoading,
  mdiPlus,
  mdiClose,
  mdiDeleteOutline,
  mdiDownloadOutline,
  mdiCheckboxMarkedOutline,
  mdiChevronUp,
  mdiChevronRight,
  mdiWeatherNight,
  mdiWeatherSunny,
  mdiCogOutline,
  mdiNewspaperVariantOutline,
  mdiTextBoxOutline,
  mdiFitToScreenOutline,
  mdiCursorDefaultClickOutline,
  mdiNewspaper,
  mdiMagnify,
  mdiViewDayOutline,
  mdiViewDashboardOutline
} from "@mdi/js";

export const Icons = {
  darkMode: mdiWeatherNight,
  lightMode: mdiWeatherSunny,
  settings: mdiCogOutline,
  search: mdiMagnify,

  fullPage: mdiNewspaper,
  article: mdiNewspaperVariantOutline,
  visible: mdiViewDayOutline,
  selection: mdiCursorDefaultClickOutline,

  simplified: mdiTextBoxOutline,
  screenshot: mdiFitToScreenOutline,
  complete: mdiViewDashboardOutline,

  check: mdiCheck,
  checkbox: mdiCheckboxMarkedOutline,
  loading: mdiLoading,
  plus: mdiPlus,
  close: mdiClose,
  delete: mdiDeleteOutline,
  download: mdiDownloadOutline,
  chevronDown: mdiChevronDown,
  chevronUp: mdiChevronUp,
  chevronRight: mdiChevronRight,

  none: ""
};

export type IconNames = keyof typeof Icons;
