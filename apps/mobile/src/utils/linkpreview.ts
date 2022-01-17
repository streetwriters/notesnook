import {Image} from 'react-native';
import {decode} from 'entities';
export interface PreviewData {
  description?: string;
  image?: PreviewDataImage;
  link?: string;
  title?: string;
}

export interface PreviewDataImage {
  height: number;
  url: string;
  width: number;
}

export interface Size {
  height: number;
  width: number;
}

export const getActualImageUrl = (baseUrl: string, imageUrl?: string) => {
  let actualImageUrl = imageUrl?.trim();
  if (!actualImageUrl || actualImageUrl.startsWith('data')) return;

  if (actualImageUrl.startsWith('//'))
    actualImageUrl = `https:${actualImageUrl}`;

  if (!actualImageUrl.startsWith('http')) {
    if (baseUrl.endsWith('/') && actualImageUrl.startsWith('/')) {
      actualImageUrl = `${baseUrl.slice(0, -1)}${actualImageUrl}`;
    } else if (!baseUrl.endsWith('/') && !actualImageUrl.startsWith('/')) {
      actualImageUrl = `${baseUrl}/${actualImageUrl}`;
    } else {
      actualImageUrl = `${baseUrl}${actualImageUrl}`;
    }
  }
  return actualImageUrl;
};
export const getHtmlEntitiesDecodedText = (text?: string) => {
  const actualText = text?.trim();
  if (!actualText) return;
  return decode(actualText);
};

export const getContent = (left: string, right: string, type: string) => {
  const contents = {
    [left.trim()]: right,
    [right.trim()]: left
  };

  return contents[type]?.trim();
};

const getDiffUrl = actualImageUrl => {
  if (
    !actualImageUrl.startsWith('https://www.') ||
    !actualImageUrl.startsWith('http://www.')
  ) {
    if (actualImageUrl.startsWith('http://')) {
      actualImageUrl = actualImageUrl.replace('http://', 'http://www.');
    } else {
      actualImageUrl = actualImageUrl.replace('https://', 'https://www.');
    }
  }
  return actualImageUrl;
};

export const getImageSize = (url: string) => {
  return new Promise<Size>((resolve, reject) => {
    Image.getSize(
      url,
      (width, height) => {
        resolve({height, width});
      },
      // type-coverage:ignore-next-line
      error => {
        if (getDiffUrl(url) === url) {
          reject(error);
        } else {
          let urlWithwww = getDiffUrl(url);
          Image.getSize(
            urlWithwww,
            (width, height) => {
              resolve({height, width});
            },
            // type-coverage:ignore-next-line
            error => reject(error)
          );
        }
      }
    );
  });
};

// Functions below use functions from the same file and mocks are not working
/* istanbul ignore next */
export const getLinkPreview = async (text: string) => {
  const previewData: PreviewData = {
    description: undefined,
    image: undefined,
    link: undefined,
    title: undefined
  };

  try {
    const textWithoutEmails = text.replace(REGEX_EMAIL, '').trim();

    if (!textWithoutEmails) return previewData;

    const link = textWithoutEmails.match(REGEX_LINK)?.[0];

    if (!link) return previewData;

    let url = link;

    if (!url.toLowerCase().startsWith('http')) {
      url = 'https://' + url;
    }
    let abortControllerTimeout: NodeJS.Timeout = null;
    const abort = new AbortController();
    // Abort fetch request after 5 seconds.

    let request = fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
      },
      signal: abort.signal
    });
    abortControllerTimeout = setTimeout(() => {
      abort.abort();
    }, 10000);
    let response = await request;
    clearTimeout(abortControllerTimeout);

    previewData.link = url;

    const contentType = response.headers.get('content-type') ?? '';

    if (REGEX_IMAGE_CONTENT_TYPE.test(contentType)) {
      const image = await getPreviewDataImage(url);
      previewData.image = image;
      return previewData;
    }

    const html = await response.text();

    // Some pages return undefined
    if (!html) return previewData;

    const head = html.substring(0, html.indexOf('<body'));

    // Get page title
    const title = REGEX_TITLE.exec(head);
    previewData.title = getHtmlEntitiesDecodedText(title?.[1]);

    let matches: RegExpMatchArray | null;
    const meta: RegExpMatchArray[] = [];
    while ((matches = REGEX_META.exec(head)) !== null) {
      meta.push([...matches]);
    }

    const metaPreviewData = meta.reduce<{
      description?: string;
      imageUrl?: string;
      title?: string;
    }>(
      (acc, curr) => {
        // Verify that we have property/name and content
        // Note that if a page will specify property, name and content in the same meta, regex will fail
        if (!curr[2] || !curr[3]) return acc;

        // Only take the first occurrence
        // For description take the meta description tag into consideration
        const description =
          !acc.description &&
          (getContent(curr[2], curr[3], 'og:description') ||
            getContent(curr[2], curr[3], 'description'));
        const ogImage =
          !acc.imageUrl && getContent(curr[2], curr[3], 'og:image');
        const ogTitle = !acc.title && getContent(curr[2], curr[3], 'og:title');

        return {
          description: description
            ? getHtmlEntitiesDecodedText(description)
            : acc.description,
          imageUrl: ogImage ? getActualImageUrl(url, ogImage) : acc.imageUrl,
          title: ogTitle ? getHtmlEntitiesDecodedText(ogTitle) : acc.title
        };
      },
      {title: previewData.title}
    );

    previewData.description = metaPreviewData.description;
    previewData.image = await getPreviewDataImage(metaPreviewData.imageUrl);
    previewData.title = metaPreviewData.title;

    if (!previewData.image) {
      let imageMatches: RegExpMatchArray | null;
      const tags: RegExpMatchArray[] = [];
      while ((imageMatches = REGEX_IMAGE_TAG.exec(html)) !== null) {
        tags.push([...imageMatches]);
      }

      let images: PreviewDataImage[] = [];

      for (const tag of tags
        .filter(t => !t[1].startsWith('data'))
        .slice(0, 5)) {
        const image = await getPreviewDataImage(getActualImageUrl(url, tag[1]));

        if (!image) continue;

        images = [...images, image];
      }

      previewData.image = images.sort(
        (a, b) => b.height * b.width - a.height * a.width
      )[0];
    }

    return previewData;
  } catch {
    return previewData;
  }
};

/* istanbul ignore next */
export const getPreviewDataImage = async (url?: string) => {
  if (!url) return;

  try {
    const {height, width} = await getImageSize(url);
    const aspectRatio = width / (height || 1);

    if (height > 100 && width > 100 && aspectRatio > 0.1 && aspectRatio < 10) {
      const image: PreviewDataImage = {height, url, width};
      return image;
    }
  } catch {}
};

export const oneOf =
  <T extends (...args: A) => any, U, A extends any[]>(
    truthy: T | undefined,
    falsy: U
  ) =>
  (...args: Parameters<T>): ReturnType<T> | U => {
    return truthy ? truthy(...args) : falsy;
  };

export const REGEX_EMAIL =
  /([a-zA-Z0-9+._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
export const REGEX_IMAGE_CONTENT_TYPE = /image\/*/g;
// Consider empty line after img tag and take only the src field, space before to not match data-src for example
export const REGEX_IMAGE_TAG = /<img[\n\r]*.*? src=["'](.*?)["']/g;
export const REGEX_LINK =
  /((http|ftp|https):\/\/)?([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/i;
// Some pages write content before the name/property, some use single quotes instead of double
export const REGEX_META =
  /<meta.*?(property|name)=["'](.*?)["'].*?content=["'](.*?)["'].*?>/g;
export const REGEX_TITLE = /<title.*?>(.*?)<\/title>/g;
