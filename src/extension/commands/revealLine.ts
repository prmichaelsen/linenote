import { ErrorCodes } from "../../lib/ErrorCodes";
import { getEditor } from "../../lib/getters/getEditor";
import { getNoteCache, initializeGlobalNoteCache } from "../../lib/getters/getNoteCache";
import { Note } from "../../models/Note";
import { getOpenNoteBehavior } from "../../utils/helpers/misc-utils";
import { getUuidFromNotePath } from "../../utils/helpers/note-path-utils";
import { Uri, window, workspace } from "vscode";
import { getOutputChannel } from "../output/getOutputChannel";

export const revealLine = async () => {
  const editor = getEditor();
  const filePath = editor.document.uri.fsPath;
  const uuid = await getUuidFromNotePath(filePath);
  if (!uuid) {
    getOutputChannel().appendLine(ErrorCodes["Error_0002"]({ filePath }));
    return;
  }
  let note = getNoteCache().get(uuid);
  if (!note) {
    // refresh cache if not found
    await initializeGlobalNoteCache();
    note = getNoteCache().get(uuid);
    if (!note) {
      window.showErrorMessage(ErrorCodes["Error_0001"]({ uuid }));
      return;
    }
  }
  if (!(await note.fsExists())) {
    return;
  }
  const document = await workspace.openTextDocument(Uri.file(note.targetPath));
  const line = Note.getLine(document, uuid);
  const selection = document.lineAt(line).range;
  await window.showTextDocument(document, {
    selection,
    ...getOpenNoteBehavior(),
  });
};

