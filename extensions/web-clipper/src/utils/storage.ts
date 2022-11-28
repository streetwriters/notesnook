import browser from "webextension-polyfill";

export async function storeClip(data: string) {
  await browser.storage.local.set({ clip: data });
}

export async function deleteClip() {
  return await browser.storage.local.remove("clip");
}

export async function getClip() {
  const { clip } = await browser.storage.local.get("clip");
  return clip;
}
