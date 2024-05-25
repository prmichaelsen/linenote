import { Note } from "../../models/Note";
import { addFactory } from "./factories/addFactory";
import * as path from "path";
import * as short from "short-uuid";
import * as vscode from "vscode";
import { getEditor } from "../../lib/getters/getEditor";
import { getNoteCache } from "../../lib/getters/getNoteCache";
import { Config } from "../../lib/caches/ConfigurationCache";
import { log } from "../output/getOutputChannel";

export const addNote = log.time("addNote", () =>
  addFactory({
    uuidGenerator: async () => {
      const placeHolderUuid = `unfiled/${short.generate().toString()}.md`;
      const input =
        (await vscode.window.showInputBox({
          placeHolder: placeHolderUuid,
          prompt: "Enter name for note",
          validateInput: (input: string) => {
            if (input !== "" && input.trim() === "") {
              return "Note names must not be empty";
            }
            if (input.trim().startsWith(path.sep)) {
              return "Note names cannot begin with " + path.sep;
            }
            return null;
          },
        })) || placeHolderUuid;
      const uuid = input.trim();
      return uuid;
    },

    markify: (uuid: string) => {
      const notePrefix = Config.notePrefix.cached();
      const editText = Config.editText.cached();
      const removeText = Config.removeText.cached();
      const marker = `${notePrefix} ${uuid} ${editText} ${removeText}\n`;
      return marker;
    },

    insert: async (marker: string) => {
      const editor = getEditor();
      const anchor = editor.selection.anchor;
      const commentPos = new vscode.Position(anchor.line, 0);
      const isSuccessful = await editor.edit(
        (edit) => {
          edit.insert(commentPos, marker);
        },
        {
          undoStopAfter: false,
          undoStopBefore: false,
        }
      );
      // Use editor actions to comment the marker - this lets us work with any language - indejames
      if (isSuccessful) {
        await vscode.commands.executeCommand("cursorMove", { to: "up" });
        // TODO add a check here to make sure this works - otherwise I should remove the
        // marker. - indiejames
        await vscode.commands.executeCommand("editor.action.commentLine");
        await vscode.commands.executeCommand("editor.action.formatSelection");
      }
    },

    toNote: (uuid: string) => {
      return Note.asNote(getEditor().document, uuid);
    },

    map: (note: Note) => note,

    cache: (note: Note) => getNoteCache().set(note.uuid, note),

    next: async (note: Note) => {
      await note.touch();
      await note.open();
    },
  })
);
