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

import { useEffect } from "react";
import { useStore } from "./stores/app-store";
import useSlider from "./hooks/use-slider";
import useMobile from "./hooks/use-mobile";
import useTablet from "./hooks/use-tablet";

type MobileAppEffectsProps = {
  sliderId: string;
  overlayId: string;
  setShow: (show: boolean) => void;
};
export default function MobileAppEffects({
  sliderId,
  overlayId,
  setShow
}: MobileAppEffectsProps) {
  const isMobile = useMobile();
  const isTablet = useTablet();
  const toggleSideMenu = useStore((store) => store.toggleSideMenu);
  const setIsEditorOpen = useStore((store) => store.setIsEditorOpen);
  const isEditorOpen = useStore((store) => store.isEditorOpen);
  const isSideMenuOpen = useStore((store) => store.isSideMenuOpen);
  const isFocusMode = useStore((store) => store.isFocusMode);

  const [slideToIndex] = useSlider(sliderId, {
    onSliding: (_e, { position }) => {
      if (!isMobile) return;
      const offset = 70;
      const width = 300;

      const percent = offset - (position / width) * offset;
      const overlay = document.getElementById("overlay");
      if (!overlay) return;
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
      toggleSideMenu(slide?.index === 1 ? true : false);
      setIsEditorOpen(slide?.index === 3 ? true : false);
    }
  });

  useEffect(() => {
    if (!isMobile) return;
    slideToIndex(isSideMenuOpen ? 1 : 2);
  }, [isMobile, slideToIndex, isSideMenuOpen]);

  useEffect(() => {
    if (!isMobile) return;
    slideToIndex(isEditorOpen ? 3 : 2);
  }, [isMobile, slideToIndex, isEditorOpen]);

  useEffect(() => {
    toggleSideMenu(!isMobile);
    if (!isMobile && !isTablet && !isFocusMode) setShow(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, isTablet, isFocusMode, toggleSideMenu]);

  useEffect(() => {
    if (!overlayId) return;
    const overlay = document.getElementById(overlayId);
    if (!overlay) return;
    overlay.onclick = () => toggleSideMenu(false);
    return () => {
      overlay.onclick = null;
    };
  }, [overlayId, toggleSideMenu]);

  return null;
}
