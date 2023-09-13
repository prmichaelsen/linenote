import { commands } from 'vscode';
import { getIncludedFilePaths, getNotesDir, getUuidFromNotePath } from "./note-path-utils";
import { identityDiffArr, isTruthy } from "../utils";
import { Note } from "../../models/Note";
import { getNoteCache } from "../../lib/getters/getNoteCache";
import { Config } from "../../lib/caches/ConfigurationCache";
import { log } from "../../extension/output/getOutputChannel";
import * as path from 'path';


export const cleanUpOrphanedNotes = async () => {
  const strategy = await Config.cleanUpOrphanedNotes.forceMiss();
  if (
    !["on-interval", "on-save-and-on-interval"]
      .some(s => s === strategy)
  ) {
    return;
  }
  const globalNoteCache = getNoteCache();
  const files = await getIncludedFilePaths();
  const uuids = (await Promise.all(files
    .map(file => getUuidFromNotePath(file)))
  ).filter(isTruthy)
    ;
  const activeUuids = 
    globalNoteCache.keys()
      .map(k => globalNoteCache.get(k).uuid);
  const uuidsToDelete = identityDiffArr(uuids, activeUuids);
  for (const uuid of uuidsToDelete) {
    const note = globalNoteCache.get(uuid);
    note.line = -1;
  }
  await Promise.all(uuidsToDelete.map(async uuid => {
    if (uuid) {
      await commands.executeCommand('linenoteplus.removeNote', uuid);
    }
  }));
};


export interface GetOrphanedNoteMarkersProps {
  /** filepath of current document */
  filePath: string;
  /** uuids in current document */
  uuids: string[],
}
export const getOrphanedUuidsForCurDoc = log.time(
  'getOrphanedUuidsForCurDoc',
(
  props: GetOrphanedNoteMarkersProps
): string[] => {
  const globalNoteCache = getNoteCache();
  const { filePath, uuids } = props;
  const notesDir = getNotesDir(filePath);
  const activeNotesMarkersForCurDuc: Note[] = [];
  globalNoteCache
    .keys()
    .filter((uuid: string) => {
      const docFilePath = globalNoteCache.get(uuid).targetPath;
      return docFilePath === filePath;
    })
    .forEach((uuid) => {
      activeNotesMarkersForCurDuc.push(globalNoteCache.get(uuid));
    });
  const activeUuidsForCurDoc = activeNotesMarkersForCurDuc.map((n) => n.uuid);
  const uuidsToDelete = identityDiffArr(uuids, activeUuidsForCurDoc);
  const unfiledDir = path.join(notesDir, 'unfiled');
  const notesToDelete = uuidsToDelete
    .map(k => globalNoteCache.get(k))
    // only delete an orphan note if
    // it is unfiled
    .filter(n => n.selfPath.includes(unfiledDir))
    ;
  return notesToDelete.map(n => n.uuid);
});