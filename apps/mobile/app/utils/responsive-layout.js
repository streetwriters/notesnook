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

/** Windows up to this width (dp) stay on the single-column phone layout. */
export const NARROW_MAX_DP = 599;

/**
 * Landscape tablets wider than this open the third pane.
 * Matches the previous large-tablet cutoff (width / 100 > 9).
 */
export const LARGE_TABLET_MIN_DP = 900;

/**
 * Column count follows the current window, not the physical screen.
 * Foldables report as tablets even while a Samsung pop-up is phone-sized.
 *
 * Phones keep the historical split: portrait is one column, a wide
 * landscape window is two. Three columns stay limited to a wide
 * landscape tablet so iPhone landscape does not gain a sidebar.
 *
 * @param {{ windowWidth: number, isTabletDevice: boolean, isLandscape: boolean }} options
 * @returns {"mobile" | "smallTablet" | "tablet"}
 */
export function resolveDeviceMode({
  windowWidth,
  isTabletDevice,
  isLandscape
}) {
  const width = Number(windowWidth);
  if (!Number.isFinite(width) || width <= 0) return "mobile";

  if (!isTabletDevice) {
    if (isLandscape && width > NARROW_MAX_DP) return "smallTablet";
    return "mobile";
  }

  if (width <= NARROW_MAX_DP) return "mobile";
  if (isLandscape && width > LARGE_TABLET_MIN_DP) return "tablet";
  return "smallTablet";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Pane sizes whose on-screen columns fit inside `availableWidth`.
 * Offsets are the translateX that reveals each column.
 *
 * @param {"mobile" | "smallTablet" | "tablet"} mode
 * @param {number} availableWidth
 * @param {boolean} fullscreen
 */
export function computePaneLayout(mode, availableWidth, fullscreen) {
  const width = Number.isFinite(availableWidth)
    ? Math.max(0, availableWidth)
    : 0;

  if (mode === "tablet") {
    const sidebar = width * 0.22;
    const list = width * 0.3;
    const editor = Math.max(0, width - sidebar - list);
    return {
      widths: { sidebar, list, editor },
      offsets: { sidebar: 0, list: 0, editor: 0 }
    };
  }

  if (mode === "smallTablet") {
    // Historical proportion was 30% clamped to 300–450. The minimum must
    // not push the list past the window (a 360dp pop-up cannot hold a
    // 300dp list plus an editor).
    const list = Math.min(clamp(width * 0.3, Math.min(300, width), 450), width);
    const editor = Math.max(0, width - list);
    const sidebar = Math.min(
      clamp(width * 0.3, Math.min(300, width), 450),
      width
    );
    if (fullscreen) {
      return {
        widths: { sidebar, list, editor: width },
        offsets: { sidebar: 0, list: 0, editor: 0 }
      };
    }
    return {
      widths: { sidebar, list, editor },
      offsets: {
        sidebar,
        list: sidebar + list,
        editor: sidebar + width
      }
    };
  }

  const sidebar = width * 0.85;
  return {
    widths: { sidebar, list: width, editor: width },
    offsets: {
      sidebar,
      list: width + sidebar,
      editor: width * 2 + sidebar
    }
  };
}

/**
 * Prefer the real window when it is materially smaller than the view.
 * A few percent of disagreement is system insets, not a pop-up, so the
 * laid-out size wins. A keyboard makes the view shorter than the window;
 * that smaller layout wins too.
 *
 * @param {number} layout
 * @param {number} reported
 */
export function windowConstrainedSize(layout, reported) {
  const hasLayout = Number.isFinite(layout) && layout > 0;
  const hasReported = Number.isFinite(reported) && reported > 0;
  if (!hasLayout) return hasReported ? reported : 0;
  if (!hasReported) return layout;
  if (reported < layout * 0.9) return reported;
  return layout;
}
