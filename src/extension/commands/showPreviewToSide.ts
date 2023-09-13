import { commands, window } from 'vscode';
import * as fs from 'fs-extra';
import { getEditor } from '../../lib/getters/getEditor';
import { getNotesDir } from '../../utils/helpers/note-path-utils';
import { Note } from '../../models/Note';
import { getBesideViewColumn } from '../../utils/helpers/misc-utils';

export const showPreviewToSide =  async (uuid?: string) => {
  const editor = getEditor();
  const notesDir = getNotesDir(editor.document.fileName);
  if (!fs.existsSync(notesDir)) {
      window.showErrorMessage(`Can preview existing notes.`);
      return;
  }
  if (uuid) {
    const note = Note.asNote(editor.document, uuid);
    await note.open({ 
      viewColumn: getBesideViewColumn(),
      preserveFocus: false,
    });
    await commands.executeCommand('markdown.showPreview');
    return;
  }
  const _uuid = Note.matchUuidOnActiveLine(editor);
  if (_uuid) {
    const note = Note.asNote(editor.document, _uuid);
    await note.open({ 
      viewColumn: getBesideViewColumn(),
      preserveFocus: false,
    });
    await commands.executeCommand('markdown.showPreview');
  } else {
      window.showErrorMessage("Select a note marker to preview a note.");
  }
};
