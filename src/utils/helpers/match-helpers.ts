import { Config } from "../../lib/caches/ConfigurationCache";
import { escapeRegex, isValidFilePath, normalizePath, isTruthy } from "../utils";

export const getNoteMarkerRegex = () => {
  const notePrefix = escapeRegex(Config.notePrefix.cached());
  const edit = escapeRegex(Config.editText.cached());
  const remove = escapeRegex(Config.removeText.cached());
  const regexString = `(${notePrefix}) *[^ ].+(?=${edit} ${remove})`;
  const regex = new RegExp(regexString, 'gm');
  return regex;
}

export const getUuidFromNoteMarker = (text: string) => {
  const prefix = [Config.notePrefix.cached()]
    .find((prefix) => text.includes(prefix));
  if (!prefix) {
    return null;
  }
  try {
    const back = text.split(prefix)[1].trim();
    const uuid = back.split(`${Config.editText.cached()} ${Config.removeText.cached()}`)[0].trim();
    if (isValidFilePath(uuid)) {
      const normal = normalizePath(uuid);
      return isTruthy(normal) ? normal : null;
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}

export const matchUuids = (text: string): string[] => {
  const uuids: string[] = [];
  const regex = getNoteMarkerRegex();
  const matches = text.match(regex);
  if (!matches) {
    return uuids;
  }
  for (const match of matches) {
    const uuid = getUuidFromNoteMarker(match);
    if (isTruthy(uuid)) {
      uuids.push(uuid);
    }
  }
  return  uuids;
}

export const matchUuid = (lineText: string): string | null => {
  const match = lineText.match(getNoteMarkerRegex());
  if (match) {
    const matchText = match[0];
    const uuid = getUuidFromNoteMarker(matchText);
    if (isTruthy(uuid)) {
      return uuid;
    }
  }
  return null;
}
