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
import { Cipher } from "@notesnook/crypto";
import { Flex, Text } from "@theme-ui/components";
import { useLoaderData } from "@remix-run/react";
import { MonographPage } from "../components/monographpost";
import { useHashLocation } from "../utils/use-hash-location";
import { isSpam, isSpamCached } from "../utils/spam-filter.server";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
import { API_HOST, PUBLIC_URL } from "../utils/env";
import { generateMetaDescriptors } from "../utils/meta";
import { format } from "date-fns/format";

type Monograph = {
  title: string;
  userId: string;
  content?: {
    type: string;
    data: string;
  };
  selfDestruct: boolean;
  encryptedContent?: Cipher<"base64">;
  datePublished: string;
  id: string;
};

type MonographResponse = Omit<Monograph, "content"> & { content: string };

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data || !data.metadata || !data.monograph) return [];

  const imageUrl = `${PUBLIC_URL}/api/og.jpg?${new URLSearchParams({
    title: data?.metadata?.title || "",
    description: data?.metadata?.fullDescription
      ? Buffer.from(data.metadata.fullDescription, "utf-8").toString("base64")
      : "",
    date: data?.metadata?.datePublished || ""
  }).toString()}`;

  return generateMetaDescriptors({
    titleFull: data?.metadata.title + " - Monograph",
    titleShort: data?.metadata.title,
    description: data?.metadata.shortDescription,
    imageAlt: data?.metadata.fullDescription,
    imageUrl: imageUrl,
    url: data?.monograph ? `${PUBLIC_URL}/${data?.monograph.id}` : undefined,
    publishedAt: data?.metadata.datePublished,
    type: "article"
  });
};

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
      metadata
    };
  } catch (e) {
    // console.error(e);
    return {
      monograph: null,
      metadata: {
        title: "Not found",
        fullDescription: "This monograph does not exist.",
        shortDescription: "This monograph does not exist.",
        datePublished: ""
      }
    };
  }
}

export default function MonographPost() {
  const { monograph } = useLoaderData<typeof loader>();
  const [_, hashParams] = useHashLocation();

  return (
    <>
      {monograph ? (
        <MonographPage monograph={monograph} encodedKey={hashParams.key} />
      ) : (
        <>
          <Header />
          <Flex
            sx={{
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              flex: 1,
              height: "100vh",
              bg: "background"
            }}
          >
            <Text variant="heading" sx={{ fontSize: 42, mt: 20 }}>
              404
            </Text>
            <Text variant="body">This monograph does not exist.</Text>
          </Flex>
          <Footer />
        </>
      )}
    </>
  );
}

type Metadata = {
  title: string;
  fullDescription: string;
  shortDescription: string;
  datePublished: string;
};

function extractFirstWords(html: string, numWords = 30): string {
  // Strip HTML tags and normalize whitespace
  const plainText = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Split into words and take first N
  const words = plainText.split(" ").slice(0, numWords);

  // Add ellipsis if text was truncated
  const excerpt = words.join(" ");
  return words.length < plainText.split(" ").length ? excerpt + "..." : excerpt;
}

function trimDescription(
  str: string,
  length: number,
  collapse = false
): string {
  if (collapse) str = str.replace(/\n/gm, " ").replace(/\s+/gm, " ");
  const index = str.indexOf(".", length) - 1;
  return addPeriod(
    str.substring(
      0,
      index < 0 ? Math.min(str.length, length) : Math.min(index, length)
    )
  );
}

const NOT_ALPHA_REGEX = /[^\w\s']|_/g;
function addPeriod(str: string) {
  str = str.trim();
  const lastChar = str[str.length - 1];
  if (lastChar === ".") return str;
  if (NOT_ALPHA_REGEX.test(lastChar)) str = str.slice(0, str.length - 1);
  return str + "...";
}

function getMonographMetadata(monograph: Monograph): Metadata {
  const title = monograph?.title || "Not found";
  const text = monograph?.encryptedContent
    ? "This monograph is encrypted. Enter password to view contents."
    : monograph?.content
    ? extractFirstWords(monograph?.content.data, 100)
    : "";
  const shortDescription = trimDescription(text, 150, true);
  const fullDescription = trimDescription(text, 300, true);
  const datePublished = monograph
    ? format(monograph.datePublished, "yyyy-MM-dd HH:mm")
    : "";
  return {
    title,
    fullDescription,
    shortDescription,
    datePublished
  };
}
