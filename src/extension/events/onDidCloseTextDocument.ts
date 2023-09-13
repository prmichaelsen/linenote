import { getNoteCache } from "../../lib/getters/getNoteCache";
import { getUuidFromNotePath } from "../../utils/helpers/note-path-utils";
import { commands, TextDocument } from 'vscode';
import { log } from "../output/getOutputChannel";


/** remove note if it is empty */
export const onDidCloseTextDocument = log.time(
  'onDidCloseTextDocument',
async (event: TextDocument) => {
  const notePath = event.uri.fsPath;
  const uuid = getUuidFromNotePath(notePath);
  if (!uuid) {
    return;
  }
  const note = getNoteCache().get(uuid);
  if (!note) {
    return;
  }
  const body = await note.read();
  if (!body.trim().length) {
    await commands.executeCommand('linenoteplus.removeNote', uuid);
  }
});