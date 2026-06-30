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
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { isSpam, isSpamCached } from "../utils/spam-filter.server";
import { API_HOST, PUBLIC_URL } from "../utils/env";
import {
  buildMonographMeta,
  getMonographMetadata,
  NOT_FOUND_LOADER_DATA
} from "../utils/meta";
import { MonographView } from "../components/monograph-view";
import { useHashLocation } from "../utils/use-hash-location";
import { Monograph } from "../components/monographpost/types";

type MonographResponse = Omit<Monograph, "content"> & { content: string };

export const meta: MetaFunction<typeof loader> = ({ data }) =>
  buildMonographMeta(
    data,
    data?.monograph ? `${PUBLIC_URL}/${data.monograph.id}` : undefined
  );

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const monographId = params["id"];

    if (monographId && (await isSpamCached(monographId))) throw new Error();

    const monograph = await fetch(`${API_HOST}/monographs/${monographId}`)
      .then((r) => r.json() as Promise<MonographResponse>)
      .then(
        (data) => ({ ...data, content: JSON.parse(data.content) } as Monograph)
      );

    if (!monograph.encryptedContent && (await isSpam(monograph)))
      throw new Error();

    const metadata = getMonographMetadata(monograph);
    return {
      monograph,
      metadata,
      pixel: `${API_HOST}/monographs/${monographId}/view`
    };
  } catch (e) {
    // console.error(e);
    return NOT_FOUND_LOADER_DATA;
  }
}

export default function MonographPost() {
  const { monograph, pixel } = useLoaderData<typeof loader>();
  const [_, hashParams] = useHashLocation();
  return (
    <MonographView
      monograph={monograph}
      pixel={pixel}
      encodedKey={hashParams.key}
    />
  );
}
