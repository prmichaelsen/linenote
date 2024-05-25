import { getNoteCache } from "../../lib/getters/getNoteCache";
import { Note } from "../../models/Note";
import { matchUuids } from "../../utils/helpers/match-helpers";
import { getOrphanedUuidsForCurDoc } from "../../utils/helpers/note-utils";
import { commands, TextDocument } from "vscode";
import { Config } from "../../lib/caches/ConfigurationCache";
import { log } from "../output/getOutputChannel";

/** create notes or cleanup orphaned notes */
export const onDidSaveTextDocument = log.time(
  "onDidSaveTextDocument",
  async (document: TextDocument) => {
    // create notes for notemarkers
    // with no corresponding notes
    const uuids: string[] = matchUuids(document.getText());
    const targetPath = document.uri.fsPath;
    await Promise.all(
      uuids.map(async (uuid) => {
        const note = Note.asNote(document, uuid);
        getNoteCache().set(note.uuid, note);
        if (!note.noteExists()) {
          await note.write("");
          await note.open();
        }
      })
    );

    // delete notes based on cleanup
    // strategy
    const cleanUpStrategy = await Config.cleanUpOrphanedNotes.forceMiss();
    if (
      !["on-save", "on-save-and-on-interval"].some((s) => s === cleanUpStrategy)
    ) {
      return;
    }
    const uuidsToDelete = getOrphanedUuidsForCurDoc({
      filePath: targetPath,
      uuids,
    });
    uuidsToDelete.forEach(async (uuid) => {
      if (uuid) {
        await commands.executeCommand("linenoteplus.removeNote", uuid);
      }
    });
  }
);
