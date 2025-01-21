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

export class FileWithURI extends File {
  uri: string;
  constructor(
    fileBits: BlobPart[],
    fileName: string,
    options?: FilePropertyBag
  ) {
    super(fileBits, fileName, options);
    this.uri = URL.createObjectURL(this);
  }
}

type DeriveDimension = (naturalWidth: number, naturalHeight: number) => number;

interface CompressorOptions {
  resize?: "none" | "cover" | "contain";
  maxWidth: DeriveDimension | number;
  maxHeight: DeriveDimension | number;
  minWidth: DeriveDimension | number;
  minHeight: DeriveDimension | number;
  width: DeriveDimension | number;
  height: DeriveDimension | number;
  mimeType?: "auto" | string;
  quality?: number;
  beforeDraw?: (
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) => void;
  afterDraw?: (
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) => void;
}

const DEFAULTS: CompressorOptions = {
  maxWidth: Infinity,
  maxHeight: Infinity,
  minWidth: 0,
  minHeight: 0,
  width: 0,
  height: 0,
  resize: "none",
  quality: 0.8,
  mimeType: "auto",
  beforeDraw: undefined,
  afterDraw: undefined
};

const COMPRESSIBLE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg"
];

export function compressImage(file: File, options: Partial<CompressorOptions>) {
  if (!COMPRESSIBLE_TYPES.includes(file.type)) return Promise.resolve(file);
  return new Promise<Blob>((resolve, reject) => {
    const image = new Image();
    image.onload = async () => {
      const compressed = await drawToCanvas({
        file,
        image,
        options: { ...DEFAULTS, ...options },
        naturalHeight: image.naturalHeight,
        naturalWidth: image.naturalWidth
      });
      resolve(compressed);
      URL.revokeObjectURL(image.src);
    };
    image.onabort = () => {
      reject(new Error("Aborted to load the image."));
    };
    image.onerror = () => {
      reject(new Error("Failed to load the image."));
    };
    image.src = URL.createObjectURL(file);
  });
}

function drawToCanvas({
  file,
  image,
  options,
  naturalWidth,
  naturalHeight,
  rotate = 0,
  scaleX = 1,
  scaleY = 1
}: {
  options: CompressorOptions;
  file: File;
  image: HTMLImageElement;
  naturalWidth: number;
  naturalHeight: number;
  rotate?: number;
  scaleX?: number;
  scaleY?: number;
}) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Failed to get 2d context.");

  const derive = dimensionDeriver(image);
  const is90DegreesRotated = Math.abs(rotate) % 180 === 90;
  const resizable =
    (options.resize === "contain" || options.resize === "cover") &&
    isPositiveNumber(derive(options.width)) &&
    isPositiveNumber(derive(options.height));
  let maxWidth = Math.max(derive(options.maxWidth), 0) || Infinity;
  let maxHeight = Math.max(derive(options.maxHeight), 0) || Infinity;
  let minWidth = Math.max(derive(options.minWidth), 0) || 0;
  let minHeight = Math.max(derive(options.minHeight), 0) || 0;
  let aspectRatio = naturalWidth / naturalHeight;
  let width = derive(options.width);
  let height = derive(options.height);

  if (is90DegreesRotated) {
    [maxWidth, maxHeight] = [maxHeight, maxWidth];
    [minWidth, minHeight] = [minHeight, minWidth];
    [width, height] = [height, width];
  }

  if (resizable) {
    aspectRatio = width / height;
  }

  ({ width: maxWidth, height: maxHeight } = getAdjustedSizes(
    {
      aspectRatio,
      width: maxWidth,
      height: maxHeight
    },
    "contain"
  ));
  ({ width: minWidth, height: minHeight } = getAdjustedSizes(
    {
      aspectRatio,
      width: minWidth,
      height: minHeight
    },
    "cover"
  ));

  if (resizable) {
    ({ width, height } = getAdjustedSizes(
      {
        aspectRatio,
        width,
        height
      },
      options.resize
    ));
  } else {
    ({ width = naturalWidth, height = naturalHeight } = getAdjustedSizes({
      aspectRatio,
      width,
      height
    }));
  }

  width = Math.floor(
    normalizeDecimalNumber(Math.min(Math.max(width, minWidth), maxWidth))
  );
  height = Math.floor(
    normalizeDecimalNumber(Math.min(Math.max(height, minHeight), maxHeight))
  );

  const destX = -width / 2;
  const destY = -height / 2;
  const destWidth = width;
  const destHeight = height;
  let srcX = 0;
  let srcY = 0;
  let srcWidth = naturalWidth;
  let srcHeight = naturalHeight;

  if (resizable) {
    ({ width: srcWidth, height: srcHeight } = getAdjustedSizes(
      {
        aspectRatio,
        width: naturalWidth,
        height: naturalHeight
      },
      options.resize || "none"
    ));
    srcX = (naturalWidth - srcWidth) / 2;
    srcY = (naturalHeight - srcHeight) / 2;
  }

  if (is90DegreesRotated) {
    [width, height] = [height, width];
  }

  canvas.width = width;
  canvas.height = height;

  if (!options.mimeType || !isImageType(options.mimeType)) {
    options.mimeType = file.type;
  }

  let fillStyle = "transparent";

  const isJPEGImage = options.mimeType === "image/jpeg";
  if (isJPEGImage) {
    fillStyle = "#fff";
  }

  // Override the default fill color (#000, black)
  context.fillStyle = fillStyle;
  context.fillRect(0, 0, width, height);

  if (options.beforeDraw) {
    options.beforeDraw(context, canvas);
  }

  context.save();
  context.translate(width / 2, height / 2);
  context.rotate((rotate * Math.PI) / 180);
  context.scale(scaleX, scaleY);
  if (resizable)
    context.drawImage(
      image,
      srcX,
      srcY,
      srcWidth,
      srcHeight,
      destX,
      destY,
      destWidth,
      destHeight
    );
  else context.drawImage(image, destX, destY, destWidth, destHeight);
  context.restore();

  if (options.afterDraw) {
    options.afterDraw(context, canvas);
  }

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob || file),
      options.mimeType,
      options.quality
    );
  });
}

const REGEXP_DECIMALS = /\.\d*(?:0|9){12}\d*$/;
/**
 * Normalize decimal number.
 * Check out {@link https://0.30000000000000004.com/}
 */
function normalizeDecimalNumber(value: number, times = 100000000000) {
  return REGEXP_DECIMALS.test(value.toString())
    ? Math.round(value * times) / times
    : value;
}

/**
 * Get the max sizes in a rectangle under the given aspect ratio.
 * @param data - The original sizes.
 * @param type - The adjust type.
 * @returns The result sizes.
 */
export function getAdjustedSizes(
  {
    aspectRatio,
    height,
    width
  }: { aspectRatio: number; height: number; width: number },
  type: "none" | "contain" | "cover" = "none"
) {
  const isValidWidth = isPositiveNumber(width);
  const isValidHeight = isPositiveNumber(height);

  if (isValidWidth && isValidHeight) {
    const adjustedWidth = height * aspectRatio;

    if (
      ((type === "contain" || type === "none") && adjustedWidth > width) ||
      (type === "cover" && adjustedWidth < width)
    ) {
      height = width / aspectRatio;
    } else {
      width = height * aspectRatio;
    }
  } else if (isValidWidth) {
    height = width / aspectRatio;
  } else if (isValidHeight) {
    width = height * aspectRatio;
  }

  return {
    width,
    height
  };
}

const isPositiveNumber = (value: number) => value > 0 && value < Infinity;

function isImageType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function dimensionDeriver(image: HTMLImageElement) {
  return (dimension: DeriveDimension | number) =>
    typeof dimension === "number"
      ? dimension
      : dimension(image.naturalWidth, image.naturalHeight);
}
