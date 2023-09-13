import { tempalte } from "../utils/misc/generate-template-string";

export const ErrorCodes = {
  Error_0000: tempalte<{ hello: string; world: string }>()(
    "[Error_0000]: ${hello} ${world}"
  ),
  Error_0001: tempalte<{ uuid: string }>()(
    '[Error_0001]: Note with uuid "${uuid}" did not exist in globalActiveNoteMarkers cache.'
  ),
  Error_0002: tempalte<{ filePath: string }>()(
    '[Error_0002]: Unable to get uuid from note with filePath "${filePath}".'
  ),
  Error_0003: tempalte<{ uuid: string, path: string }>()(
    '[Error_0001]: Note with uuid "${uuid}" not found in document "${path}".'
  ),
};