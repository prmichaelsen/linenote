
import { window } from 'vscode';
import { getEditor } from '../../lib/getters/getEditor';
import { Note } from '../../models/Note';


export const openNote = async (uuid?: string) => {
  const editor = getEditor();
  if (uuid) {
    const note = Note.asNote(editor.document, uuid);
    await note.touch();
    await note.open();
    return;
  }
  // 📌 test note 📝 🗑
  const _uuid = Note.matchUuidOnActiveLine(editor);
  if (_uuid) {
    const note = Note.asNote(editor.document, _uuid);
    await note.touch();
    await note.open();
    return;
  } else {
    window.showErrorMessage("Select a note marker to edit a note.");
  }
};
