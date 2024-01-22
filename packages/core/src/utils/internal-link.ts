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

const InternalLinkTypes = ["note"] as const;
type InternalLinkType = (typeof InternalLinkTypes)[number];
export type InternalLink<T extends InternalLinkType = InternalLinkType> = {
  type: T;
  id: string;
  params?: Partial<InternalLinkParams[T]>;
};
type InternalLinkParams = {
  note: { blockId: string };
};
export function createInternalLink<T extends InternalLinkType>(
  type: T,
  id: string,
  params?: InternalLinkParams[T]
) {
  let link = `nn://${type}/${id}`;
  if (params) {
    link +=
      "?" +
      Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
  }
  return link;
}

export function parseInternalLink(link: string): InternalLink | undefined {
  const url = new URL(link);
  if (url.protocol !== "nn:") return;
  const [type, id] = url.pathname.split("/").slice(2);
  if (!type || !id || !isValidInternalType(type)) return;

  return {
    type,
    id,
    params: Object.fromEntries(url.searchParams.entries())
  };
}

function isValidInternalType(type: string): type is InternalLinkType {
  return InternalLinkTypes.includes(type as any);
}
