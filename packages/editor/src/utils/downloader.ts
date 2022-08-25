export async function downloadImage(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`invalid status code ${response.status}`);

  const contentType = response.headers.get("Content-Type");
  const contentLength = response.headers.get("Content-Length");

  if (
    !contentType ||
    !contentLength ||
    contentLength === "0" ||
    !contentType.startsWith("image/")
  )
    throw new Error("not an image");

  const size = parseInt(contentLength);
  const blob = await response.blob();
  return {
    blob,
    url: URL.createObjectURL(blob),
    type: contentType,
    size,
  };
}

export function toDataURL(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (_e) => resolve(reader.result as string);
    reader.onerror = (_e) => reject(reader.error);
    reader.onabort = (_e) => reject(new Error("Read aborted"));
    reader.readAsDataURL(blob);
  });
}

export function isDataUrl(url?: string): boolean {
  return url?.startsWith("data:") || false;
}

export async function toBlobURL(dataurl: string) {
  if (!isDataUrl(dataurl)) return dataurl;

  const response = await fetch(dataurl);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
