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

import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { strings } from "@notesnook/intl";
import {
  Box,
  Button,
  dataColor,
  Flex,
  Image,
  type KeyEvent,
  type PressEvent,
  type UIElement
} from "@ui";
import {
  Close,
  Reset,
  RotateACW,
  RotateCW,
  Loading,
  ZoomIn,
  ZoomOut,
  type Icon
} from "../icons";
import { TITLE_BAR_HEIGHT } from "../title-bar";

const DEFAULT_ZOOM_STEP = 0.3;
const DEFAULT_LARGE_ZOOM = 4;

type LightboxImage = { url: string; title?: string };
export type LightboxProps = {
  image?: string;
  zoomStep?: number;
  images?: LightboxImage[];
  startIndex?: number;
  keyboardInteraction?: boolean;
  doubleClickZoom?: number;
  allowZoom?: boolean;
  allowReset?: boolean;
  allowRotate?: boolean;
  onNavigateImage?: (index: number) => void;
  clickOutsideToExit?: boolean;
  onClose?: () => void;
};

function LightboxView(props: LightboxProps) {
  const {
    zoomStep = DEFAULT_ZOOM_STEP,
    allowZoom = true,
    allowRotate = true,
    allowReset = true,
    doubleClickZoom = DEFAULT_LARGE_ZOOM,
    keyboardInteraction = true,
    clickOutsideToExit = true,
    onClose,
    images
  } = props;
  const container = useRef<UIElement>(null);
  const drag = useRef<
    { x: number; y: number; ox: number; oy: number } | undefined
  >(undefined);
  const [moving, setMoving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1, rotate: 0 });
  const [current, setCurrent] = useState(props.startIndex ?? 0);
  const multi = !!images?.length;
  const { x, y, zoom, rotate } = view;

  useEffect(() => {
    container.current?.focus();
  }, []);

  const image = multi ? images?.[current]?.url ?? "" : props.image ?? "";
  useEffect(() => {
    setLoading(true);
  }, [image]);
  if (!image) return null;

  const shouldShowReset = !!x || !!y || zoom !== 1 || rotate !== 0;

  const resetZoom = () => setView((v) => ({ ...v, x: 0, y: 0, zoom: 1 }));
  const reset = () => setView({ x: 0, y: 0, zoom: 1, rotate: 0 });
  const applyZoom = (type: "in" | "out") =>
    setView((v) => {
      if (type === "in") return { ...v, zoom: v.zoom + zoomStep };
      const newZoom = v.zoom - zoomStep;
      if (newZoom < 1) return v;
      if (newZoom === 1) return { ...v, x: 0, y: 0, zoom: 1 };
      return { ...v, zoom: newZoom };
    });
  const applyRotate = (type: "cw" | "acw") =>
    setView((v) => ({ ...v, rotate: v.rotate + (type === "cw" ? 90 : -90) }));
  const navigateImage = (direction: "next" | "prev") => {
    if (!images) return;
    let next = current + (direction === "next" ? 1 : -1);
    if (next >= images.length) next = 0;
    else if (next < 0) next = images.length - 1;
    setCurrent(next);
    reset();
    props.onNavigateImage?.(next);
  };
  const shockZoom = () => {
    if (!allowZoom || !doubleClickZoom) return;
    if (zoom > 1) return resetZoom();
    const z =
      (zoomStep < 1 ? Math.ceil(doubleClickZoom / zoomStep) : zoomStep) *
      zoomStep;
    setView((v) => ({ ...v, zoom: z }));
  };
  const onKeyUp = (e: KeyEvent) => {
    if (!keyboardInteraction) return;
    switch (e.key) {
      case "ArrowLeft":
        if (multi && zoom === 1) navigateImage("prev");
        else if (zoom > 1) setView((v) => ({ ...v, x: v.x - 20 }));
        break;
      case "ArrowRight":
        if (multi && zoom === 1) navigateImage("next");
        else if (zoom > 1) setView((v) => ({ ...v, x: v.x + 20 }));
        break;
      case "ArrowUp":
        if (zoom > 1) setView((v) => ({ ...v, y: v.y + 20 }));
        break;
      case "ArrowDown":
        if (zoom > 1) setView((v) => ({ ...v, y: v.y - 20 }));
        break;
      case "+":
        if (allowZoom) applyZoom("in");
        break;
      case "-":
        if (allowZoom) applyZoom("out");
        break;
      case "Escape":
        if (allowReset && shouldShowReset) reset();
        else onClose?.();
        break;
    }
  };

  const tools: {
    title: string;
    icon: Icon;
    enabled: boolean;
    onClick: (e: PressEvent) => void;
    hidden?: boolean;
  }[] = [
    {
      title: strings.reset(),
      icon: Reset,
      enabled: true,
      hidden: !allowReset,
      onClick: () => reset()
    },
    {
      title: strings.rotateLeft(),
      icon: RotateACW,
      enabled: true,
      hidden: !allowRotate,
      onClick: () => applyRotate("acw")
    },
    {
      title: strings.rotateRight(),
      icon: RotateCW,
      enabled: true,
      hidden: !allowRotate,
      onClick: () => applyRotate("cw")
    },
    {
      title: strings.zoomOut(),
      icon: ZoomOut,
      enabled: zoom > 1,
      hidden: !allowZoom,
      onClick: () => applyZoom("out")
    },
    {
      title: strings.zoomIn(),
      icon: ZoomIn,
      enabled: true,
      hidden: !allowZoom,
      onClick: () => applyZoom("in")
    },
    {
      title: strings.close(),
      icon: Close,
      enabled: !!onClose,
      onClick: () => onClose?.()
    }
  ];

  return (
    <Flex
      ref={container}
      testID="lightbox"
      onKeyUp={onKeyUp}
      sx={{
        zIndex: 50000,
        position: "absolute",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        bg: "#000000a1" as never,
        flexDirection: "column"
      }}
    >
      <Flex
        sx={{ flexDirection: "row", justifyContent: "flex-end", zIndex: 10 }}
      >
        <Flex
          sx={{
            flexDirection: "row",
            bg: "background-secondary",
            borderBottomLeftRadius: 5,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "flex-end",
            height: TITLE_BAR_HEIGHT
          }}
        >
          {tools
            .filter((tool) => !tool.hidden)
            .map((tool) => (
              <Button
                key={tool.title}
                testID={tool.title}
                disabled={!tool.enabled}
                variant="secondary"
                title={tool.title}
                onPress={tool.onClick}
                sx={{
                  height: "100%",
                  borderRadius: 0,
                  bg: "transparent",
                  cursor: tool.enabled ? "pointer" : "not-allowed",
                  flexDirection: "row",
                  flexShrink: 0,
                  alignItems: "center"
                }}
              >
                <tool.icon size={18} color="icon" />
              </Button>
            ))}
        </Flex>
      </Flex>
      <Flex
        onPress={() => {
          if (clickOutsideToExit && zoom <= 1) onClose?.();
        }}
        sx={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative"
        }}
      >
        {moving ? (
          <Box
            testID="lightbox-moving"
            sx={{ position: "absolute", width: 0, height: 0 }}
          />
        ) : null}
        {loading ? (
          <Flex
            testID="lightbox-loading"
            sx={{ position: "absolute", alignSelf: "center" }}
          >
            <Loading color={dataColor("#ffffff")} size={60} />
          </Flex>
        ) : null}
        <Box
          testID="lightbox-image"
          onPointerDown={(e) => {
            if (zoom <= 1) return;
            drag.current = { x: e.pageX, y: e.pageY, ox: x, oy: y };
            setMoving(true);
          }}
          onPointerMove={(e) => {
            const start = drag.current;
            if (!start) return;
            setView((v) => ({
              ...v,
              x: start.ox + e.pageX - start.x,
              y: start.oy + e.pageY - start.y
            }));
          }}
          onPointerUp={() => {
            drag.current = undefined;
            setMoving(false);
          }}
          sx={{
            cursor: zoom > 1 ? (moving ? "move" : "grab") : "default",
            transform: [
              { translateX: x },
              { translateY: y },
              { scale: zoom },
              { rotate: `${rotate}deg` }
            ],
            transition: { property: "transform", duration: moving ? 0 : 100 },
            minWidth: 100,
            minHeight: 100
          }}
        >
          <Box
            onPress={(e) => e.stopPropagation()}
            onDoubleClick={() => shockZoom()}
            sx={{ minWidth: 100, minHeight: 100 }}
          >
            <Image
              src={image}
              onLoad={() => setLoading(false)}
              resizeMode="contain"
              sx={{ width: "80%", height: "80%" }}
            />
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
}

const useLightboxStore = create<{ props?: LightboxProps }>(() => ({}));

export const Lightbox = Object.assign(LightboxView, {
  show(props: LightboxProps) {
    useLightboxStore.setState({
      props: {
        ...props,
        onClose: () => {
          props.onClose?.();
          useLightboxStore.setState({ props: undefined });
        }
      }
    });
  }
});

export function LightboxHost() {
  const props = useLightboxStore((store) => store.props);
  if (!props) return null;
  return <LightboxView {...props} />;
}
