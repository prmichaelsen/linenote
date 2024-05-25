import { workspace } from "vscode";
import { matchUuids } from "../../utils/helpers/match-helpers";
import { Note } from "../../models/Note";
import { getIncludedFilePaths } from "../../utils/helpers/note-path-utils";
import { getCacheFactory } from "../cache/getCacheFactory";
import { log } from "../../extension/output/getOutputChannel";

// 📌 on global active note markers 📝 🗑
export const getNoteCache = log.time(
  'getNoteCache',
  getCacheFactory<Record<string, Note>>(),
)

export const initializeGlobalNoteCache = log.time(
  'initializeGlobalNoteCache',
async () => {
  // 📌 Does this work? 📝 🗑
  const workspaceFolders = workspace.workspaceFolders!;
  for (const _folder of workspaceFolders) {
    const filePaths = await getIncludedFilePaths();
    for (const targetPath of filePaths) {
      try {
        const document = await workspace.openTextDocument(targetPath);
        const uuids = matchUuids(document.getText());
        for (const uuid of uuids) {
          const note = Note.asNote(document, uuid);
          getNoteCache().set(note.uuid, note);
        }
      } catch (e) {
        // ignore
      }
    }
  }
});