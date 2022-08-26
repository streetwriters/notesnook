import { useEffect } from "react";
import { useStore } from "./stores/app-store";
import useSlider from "./hooks/use-slider";
import useMobile from "./hooks/use-mobile";
import useTablet from "./hooks/use-tablet";

export default function MobileAppEffects({ sliderId, overlayId, setShow }) {
  const isMobile = useMobile();
  const isTablet = useTablet();
  const toggleSideMenu = useStore((store) => store.toggleSideMenu);
  const setIsEditorOpen = useStore((store) => store.setIsEditorOpen);
  const isEditorOpen = useStore((store) => store.isEditorOpen);
  const isSideMenuOpen = useStore((store) => store.isSideMenuOpen);
  const isFocusMode = useStore((store) => store.isFocusMode);

  const [slideToIndex] = useSlider(sliderId, {
    onSliding: (e, { lastSlide, position, lastPosition }) => {
      if (!isMobile) return;
      const offset = 70;
      const width = 300;

      const percent = offset - (position / width) * offset;
      const overlay = document.getElementById("overlay");
      if (percent > 0) {
        overlay.style.opacity = `${percent}%`;
        overlay.style.pointerEvents = "all";
      } else {
        overlay.style.opacity = "0%";
        overlay.style.pointerEvents = "none";
      }
    },
    onChange: (e, { slide, lastSlide }) => {
      if (!lastSlide || !isMobile) return;
      toggleSideMenu(slide?.index === 0 ? true : false);
      console.log("Setting editor", slide?.index === 2 ? true : false);
      setIsEditorOpen(slide?.index === 2 ? true : false);
    }
  });

  useEffect(() => {
    if (!isMobile) return;
    slideToIndex(isSideMenuOpen ? 0 : 1);
  }, [isMobile, slideToIndex, isSideMenuOpen]);

  useEffect(() => {
    if (!isMobile) return;
    console.log(isEditorOpen);
    slideToIndex(isEditorOpen ? 2 : 1);
  }, [isMobile, slideToIndex, isEditorOpen]);

  useEffect(() => {
    toggleSideMenu(!isMobile);
    if (!isMobile && !isTablet && !isFocusMode) setShow(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, isTablet, isFocusMode, toggleSideMenu]);

  useEffect(() => {
    if (!overlayId) return;
    const overlay = document.getElementById(overlayId);
    overlay.onclick = () => toggleSideMenu(false);
    return () => {
      overlay.onclick = null;
    };
  }, [overlayId, toggleSideMenu]);

  return null;
}
