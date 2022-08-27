import { notesnook } from "../../../e2e/test.ids";
import { DDS } from "../../services/device-detection";
import Navigation from "../../services/navigation";
import useNavigationStore from "../../stores/use-navigation-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { tabBarRef } from "../../utils/global-refs";
import { IconButton } from "../ui/icon-button";

export const LeftMenus = () => {
  const colors = useThemeStore((state) => state.colors);
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const canGoBack = useNavigationStore((state) => state.canGoBack);
  const isTablet = deviceMode === "tablet";

  const onLeftButtonPress = () => {
    if (!canGoBack) {
      if (tabBarRef.current?.isDrawerOpen()) {
        Navigation.closeDrawer();
      } else {
        Navigation.openDrawer();
      }
      return;
    }
    Navigation.goBack();
    if (
      useNavigationStore.getState().currentScreen.name === "Signup" ||
      useNavigationStore.getState().currentScreen.name === "Login"
    ) {
      tabBarRef.current.unlock();
    }
  };

  return isTablet ? null : (
    <IconButton
      testID={notesnook.ids.default.header.buttons.left}
      customStyle={{
        justifyContent: "center",
        alignItems: "center",
        height: 40,
        width: 40,
        borderRadius: 100,
        marginLeft: -5,
        marginRight: DDS.isLargeTablet() ? 10 : 25
      }}
      left={40}
      top={40}
      right={DDS.isLargeTablet() ? 10 : 25}
      onPress={onLeftButtonPress}
      onLongPress={() => {
        Navigation.popToTop();
      }}
      name={canGoBack ? "arrow-left" : "menu"}
      color={colors.pri}
      iconStyle={{
        marginLeft: canGoBack ? -5 : 0
      }}
    />
  );
};
