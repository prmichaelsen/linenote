import { commands, TextDocument } from "vscode";
import { getNoteCache } from "../../lib/getters/getNoteCache";
import { getUuidFromNotePath } from "../../utils/helpers/note-path-utils";
import { getOutputChannel, log } from "../output/getOutputChannel";

/** remove note if it is empty */
export const onDidCloseTextDocument = log.time(
  "onDidCloseTextDocument",
  async (event: TextDocument) => {
    try {
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
        await commands.executeCommand("linenoteplus.removeNote", uuid);
      }
    } catch (e: any) {
      getOutputChannel().appendLine(
        JSON.stringify(
          {
            error: true,
            message: e.message,
            stack: e.stack,
          },
          null,
          2
        )
      );
    }
  }
);
