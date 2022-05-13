import { StandardNotes } from "./standardnotes";
import { Evernote } from "./evernote";
import { Markdown } from "./md";
import { HTML } from "./html";
import { GoogleKeep } from "./keep";
import { Simplenote } from "./simplenote";
import { ZohoNotebook } from "./zohonotebook";
import { OneNote } from "./onenote";
import { Joplin } from "./joplin";

const providerMap = {
  evernote: Evernote,
  md: Markdown,
  html: HTML,
  keep: GoogleKeep,
  simplenote: Simplenote,
  onenote: OneNote,
  standardnotes: StandardNotes,
  zohonotebook: ZohoNotebook,
  joplin: Joplin,
};

type ProvidersMap = typeof providerMap;

export type Providers = keyof ProvidersMap;

export class ProviderFactory {
  static getAvailableProviders(): Providers[] {
    return Object.keys(providerMap) as Providers[];
  }

  static getProvider<TProvider extends Providers>(
    provider: TProvider
  ): InstanceType<ProvidersMap[TProvider]> {
    const Provider = new providerMap[provider]();
    return Provider as InstanceType<ProvidersMap[TProvider]>;
  }
}
