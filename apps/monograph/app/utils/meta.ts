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
import { ServerRuntimeMetaDescriptor } from "@remix-run/server-runtime";

type MetaProps = {
  titleFull: string;
  titleShort?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  imageAlt?: string;
  publishedAt?: string;
  type: "website" | "article";
};

export function generateMetaDescriptors(
  props: MetaProps
): ServerRuntimeMetaDescriptor[] {
  const descriptors: ServerRuntimeMetaDescriptor[] = [];

  descriptors.push({ title: props.titleFull });

  if (props.description)
    descriptors.push({ name: "description", content: props.description });

  if (props.imageUrl)
    descriptors.push({ name: "og:image", content: props.imageUrl });
  descriptors.push({
    name: "og:title",
    content: props.titleShort || props.titleFull
  });
  if (props.imageAlt || props.description)
    descriptors.push({
      name: "og:image:alt",
      content: props.imageAlt || props.description
    });
  if (props.url) descriptors.push({ name: "og:url", content: props.url });
  descriptors.push({ name: "og:type", content: props.type });
  descriptors.push({ name: "og:site_name", content: "Monograph" });
  if (props.publishedAt)
    descriptors.push({
      name: "article:published_time",
      content: props.publishedAt
    });

  descriptors.push({ name: "author", content: "Monograph" });
  descriptors.push({ name: "twitter:card", content: "summary_large_image" });
  descriptors.push({ name: "twitter:site", content: "@notesnook" });
  descriptors.push({ name: "twitter:creator", content: "@notesnook" });
  descriptors.push({ name: "twitter:title", content: props.titleShort });
  descriptors.push({ name: "twitter:description", content: props.description });
  if (props.imageUrl)
    descriptors.push({ name: "twitter:image", content: props.imageUrl });

  return descriptors;
}
