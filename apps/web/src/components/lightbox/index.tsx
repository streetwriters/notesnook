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

import { Button, Flex, Image } from "@theme-ui/components";
import React from "react";
import {
  Close,
  Icon,
  Loading,
  Reset,
  RotateACW,
  RotateCW,
  ZoomIn,
  ZoomOut
} from "../icons";
import { getPlatform } from "../../utils/platform";
import { TITLE_BAR_HEIGHT } from "../title-bar";
import { strings } from "@notesnook/intl";

const DEFAULT_ZOOM_STEP = 0.3;
const DEFAULT_LARGE_ZOOM = 4;

function getXY(e: React.MouseEvent | React.TouchEvent) {
  let x = 0;
  let y = 0;
  if ("touches" in e && e.touches.length) {
    x = e.touches[0].pageX;
    y = e.touches[0].pageY;
  } else if ("pageX" in e && "pageY" in e) {
    x = e.pageX;
    y = e.pageY;
  }
  return { x, y };
}

type Image = { url: string; title?: string };
export type LightboxProps = {
  image?: string;
  // title?: string;
  zoomStep?: number;
  images?: Image[];
  startIndex?: number;
  keyboardInteraction?: boolean;
  doubleClickZoom?: number;
  // showTitle?: boolean;
  // buttonAlign?: "flex-end" | "flex-start" | "center";
  allowZoom?: boolean;
  allowReset?: boolean;
  allowRotate?: boolean;
  onNavigateImage?: (index: number) => void;
  clickOutsideToExit?: boolean;
  onClose?: (e: React.MouseEvent | KeyboardEvent) => void;
};

export class Lightbox extends React.Component<LightboxProps> {
  initX = 0;
  initY = 0;
  lastX = 0;
  lastY = 0;
  _cont = React.createRef<HTMLDivElement>();
  state = {
    x: 0,
    y: 0,
    zoom: 1,
    rotate: 0,
    loading: true,
    moving: false,
    current: this.props?.startIndex ?? 0,
    multi: this.props?.images?.length ? true : false
  };

  createTransform = (x: number, y: number, zoom: number, rotate: number) =>
    `translate3d(${x}px,${y}px,0px) scale(${zoom}) rotate(${rotate}deg)`;

  stopSideEffect = (
    e: React.KeyboardEvent | React.MouseEvent | KeyboardEvent | MouseEvent
  ) => e.stopPropagation();

  getCurrentImage = () => {
    if (!this.state.multi) return this.props.image ?? "";
    return this.props.images?.[this.state.current]?.url ?? "";
  };

  resetZoom = () => this.setState({ x: 0, y: 0, zoom: 1 });
  shockZoom = (e: React.MouseEvent) => {
    const {
      zoomStep = DEFAULT_ZOOM_STEP,
      allowZoom = true,
      doubleClickZoom = DEFAULT_LARGE_ZOOM
    } = this.props;
    if (!allowZoom || !doubleClickZoom) return false;
    this.stopSideEffect(e);
    if (this.state.zoom > 1) return this.resetZoom();
    const _z =
      (zoomStep < 1 ? Math.ceil(doubleClickZoom / zoomStep) : zoomStep) *
      zoomStep;
    const _xy = getXY(e);
    const _cbr = this._cont.current?.getBoundingClientRect?.();
    if (!_cbr) return false;
    const _ccx = _cbr.x + _cbr.width / 2;
    const _ccy = _cbr.y + _cbr.height / 2;
    const x = (_xy.x - _ccx) * -1 * _z;
    const y = (_xy.y - _ccy) * -1 * _z;
    this.setState({ x, y, zoom: _z });
  };
  navigateImage = (
    direction: "next" | "prev",
    e: React.KeyboardEvent | React.MouseEvent | KeyboardEvent | MouseEvent
  ) => {
    if (!this.props.images) return;

    this.stopSideEffect(e);
    let current = 0;
    switch (direction) {
      case "next":
        current = this.state.current + 1;
        break;
      case "prev":
        current = this.state.current - 1;
        break;
    }
    if (current >= this.props.images.length) current = 0;
    else if (current < 0) current = this.props.images.length - 1;
    this.setState({ current, x: 0, y: 0, zoom: 1, rotate: 0, loading: true });
    if (typeof this.props.onNavigateImage === "function") {
      this.props.onNavigateImage(current);
    }
  };
  startMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (this.state.zoom <= 1) return false;
    this.setState({ moving: true });
    const xy = getXY(e);
    this.initX = xy.x - this.lastX;
    this.initY = xy.y - this.lastY;
  };
  duringMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!this.state.moving) return false;
    const xy = getXY(e);
    this.lastX = xy.x - this.initX;
    this.lastY = xy.y - this.initY;
    this.setState({
      x: xy.x - this.initX,
      y: xy.y - this.initY
    });
  };
  endMove = () => this.setState({ moving: false });
  applyZoom = (type: "in" | "out" | "reset") => {
    const { zoomStep = DEFAULT_ZOOM_STEP } = this.props;
    switch (type) {
      case "in":
        this.setState({ zoom: this.state.zoom + zoomStep });
        break;
      case "out": {
        const newZoom = this.state.zoom - zoomStep;
        if (newZoom < 1) break;
        else if (newZoom === 1) this.setState({ x: 0, y: 0, zoom: 1 });
        else this.setState({ zoom: newZoom });
        break;
      }
      case "reset":
        this.resetZoom();
        break;
    }
  };
  applyRotate = (type: "cw" | "acw") => {
    switch (type) {
      case "cw":
        this.setState({ rotate: this.state.rotate + 90 });
        break;
      case "acw":
        this.setState({ rotate: this.state.rotate - 90 });
        break;
    }
  };
  reset = (e: React.MouseEvent | KeyboardEvent) => {
    this.stopSideEffect(e);
    this.setState({ x: 0, y: 0, zoom: 1, rotate: 0 });
  };
  exit = (e: React.MouseEvent | KeyboardEvent) => {
    if (typeof this.props.onClose === "function") return this.props.onClose(e);
    console.error(
      "No Exit function passed on prop: onClose. Clicking the close button will do nothing"
    );
  };
  shouldShowReset = () =>
    this.state.x ||
    this.state.y ||
    this.state.zoom !== 1 ||
    this.state.rotate !== 0;
  canvasClick = (e: React.MouseEvent) => {
    const { clickOutsideToExit = true } = this.props;
    if (clickOutsideToExit && this.state.zoom <= 1) return this.exit(e);
  };
  keyboardNavigation = (e: KeyboardEvent) => {
    const { allowZoom = true, allowReset = true } = this.props;
    const { multi, x, y, zoom } = this.state;
    switch (e.key) {
      case "ArrowLeft":
        if (multi && zoom === 1) this.navigateImage("prev", e);
        else if (zoom > 1) this.setState({ x: x - 20 });
        break;
      case "ArrowRight":
        if (multi && zoom === 1) this.navigateImage("next", e);
        else if (zoom > 1) this.setState({ x: x + 20 });
        break;
      case "ArrowUp":
        if (zoom > 1) this.setState({ y: y + 20 });
        break;
      case "ArrowDown":
        if (zoom > 1) this.setState({ y: y - 20 });
        break;
      case "+":
        if (allowZoom) this.applyZoom("in");
        break;
      case "-":
        if (allowZoom) this.applyZoom("out");
        break;
      case "Escape":
        if (allowReset && this.shouldShowReset()) this.reset(e);
        else this.exit(e);
        break;
    }
  };
  componentDidMount() {
    document.body.classList.add("lb-open-lightbox");
    const { keyboardInteraction = true } = this.props;
    if (keyboardInteraction)
      document.addEventListener("keyup", this.keyboardNavigation);
  }
  componentWillUnmount() {
    document.body.classList.remove("lb-open-lightbox");
    const { keyboardInteraction = true } = this.props;
    if (keyboardInteraction)
      document.removeEventListener("keyup", this.keyboardNavigation);
  }

  render() {
    const image = this.getCurrentImage();
    if (!image) {
      console.warn("Not showing lightbox because no image(s) was supplied");
      return null;
    }
    const {
      allowZoom = true,
      allowRotate = true,
      allowReset = true,
      onClose
    } = this.props;
    const { x, y, zoom, rotate, multi, loading, moving } = this.state;
    const _reset = allowReset && this.shouldShowReset();

    const tools: {
      title: string;
      icon: Icon;
      enabled: boolean;
      onClick: (e: React.MouseEvent) => void;
      hidden?: boolean;
      hideOnMobile?: boolean;
    }[] = [
      {
        title: strings.reset(),
        icon: Reset,
        enabled: true,
        hidden: !allowReset,
        onClick: (e) => this.reset(e)
      },
      {
        title: strings.rotateLeft(),
        icon: RotateACW,
        enabled: true,
        hidden: !allowRotate,
        onClick: () => this.applyRotate("acw")
      },
      {
        title: strings.rotateRight(),
        icon: RotateCW,
        enabled: true,
        hidden: !allowRotate,
        onClick: () => this.applyRotate("cw")
      },
      {
        title: strings.zoomOut(),
        icon: ZoomOut,
        enabled: zoom > 1,
        hidden: !allowZoom,
        onClick: () => this.applyZoom("out")
      },
      {
        title: strings.zoomIn(),
        icon: ZoomIn,
        enabled: true,
        hidden: !allowZoom,
        onClick: () => this.applyZoom("in")
      },
      {
        title: strings.close(),
        icon: Close,
        enabled: !!onClose,
        onClick: (e) => this.exit(e)
      }
    ];
    return (
      <Flex
        sx={{
          zIndex: 50000,
          position: "fixed",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          bg: "#000000a1",
          flexDirection: "column"
        }}
      >
        <Flex
          sx={{
            justifyContent: "flex-end",
            zIndex: 10
          }}
        >
          <Flex
            bg="var(--background-secondary)"
            sx={{
              borderRadius: "0px 0px 0px 5px",
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "flex-end",
              height: !hasNativeTitlebar ? TITLE_BAR_HEIGHT : "auto",
              pr:
                !hasNativeTitlebar && getPlatform() !== "darwin"
                  ? "calc(100vw - env(titlebar-area-width))"
                  : 0
            }}
          >
            {tools.map((tool) => (
              <Button
                key={tool.title}
                data-test-id={tool.title}
                disabled={!tool.enabled}
                variant="secondary"
                bg="transparent"
                title={tool.title}
                sx={{
                  height: "100%",
                  borderRadius: 0,
                  display: [
                    tool.hideOnMobile ? "none" : "flex",
                    tool.hidden ? "none" : "flex"
                  ],
                  cursor: tool.enabled ? "pointer" : "not-allowed",
                  flexDirection: "row",
                  flexShrink: 0,
                  alignItems: "center"
                }}
                onClick={tool.onClick}
              >
                <tool.icon size={18} color={"icon"} />
              </Button>
            ))}
          </Flex>
        </Flex>
        <Flex
          sx={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            maxWidth: "100%",
            maxHeight: "100%",
            position: "relative"
          }}
          ref={this._cont}
          onClick={(e) => this.canvasClick(e)}
        >
          {loading ? <Loading color="static" size={60} /> : null}
          <Image
            draggable="false"
            sx={{
              transform: this.createTransform(x, y, zoom, rotate),
              cursor: zoom > 1 ? "grab" : "unset",
              transition: moving ? "none" : "all 0.1s",
              maxWidth: "80vw",
              maxHeight: "80vh",
              minWidth: "100px",
              minHeight: "100px",
              backgroundSize: "50px",
              transformOrigin: "center center"
            }}
            onMouseDown={(e) => this.startMove(e)}
            onTouchStart={(e) => this.startMove(e)}
            onMouseMove={(e) => this.duringMove(e)}
            onTouchMove={(e) => this.duringMove(e)}
            onMouseUp={() => this.endMove()}
            onMouseLeave={() => this.endMove()}
            onTouchEnd={() => this.endMove()}
            onClick={(e) => this.stopSideEffect(e)}
            onDoubleClick={(e) => this.shockZoom(e)}
            onLoad={() => this.setState({ loading: false })}
            src={image}
          />
        </Flex>
      </Flex>
    );
  }
}
