const PATH_SEP = "/";
const EXTNAME_REGEX = /^.+\.([^.]+)$/;

function extname(path: string) {
  const firstChar = path.charAt(0);
  if (firstChar === ".") return "";

  return path.substring(path.lastIndexOf("."));
}

function basename(path: string, withExtension?: boolean): string {
  const lastChar = path.charAt(path.length - 1);
  if (lastChar === "/" || lastChar === "\\") {
    path = path.slice(0, -1);
  }

  const parts = path.split(PATH_SEP);
  const base = parts[parts.length - 1];
  const ext = extname(base);
  if (withExtension || !ext) return base;
  return base.replace(ext, "");
}

function dirname(path: string) {
  const parts = path.split(PATH_SEP);
  if (!parts[parts.length - 1].trim()) return path;
  else parts.pop();

  return parts.join(PATH_SEP);
}

function join(...paths: string[]): string {
  return paths.join(PATH_SEP);
}

export const path = { extname, basename, dirname, join };
