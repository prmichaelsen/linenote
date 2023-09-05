import * as vscode from 'vscode';
import { Note } from './note';
import { getNotesDir, getOrphanedUuidsForCurDoc, isNotePath, matchUuids } from './noteUtil';
import { globalActiveNoteMarkers } from './extension';


export const getEditor = () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    throw new Error('No active editor!');
  }
  return editor;
}

export type CleanUpOrphanedNodesConf = 
  | 'on-save'
  | 'on-interval'
  | 'on-save-and-on-interval'
  | 'never'
  ;

export const onDidSaveTextDocument = async (document: vscode.TextDocument) => {
  const uuids: string[] = matchUuids(document.getText());
  const filePath = document.uri.fsPath;
  const noteDir = getNotesDir(filePath);
  await Promise.all(uuids.map(async uuid => {
    const note = new Note({
      filePath,
      noteDir,
      uuid,
      line: Note.getLine(document, uuid),
    });
    globalActiveNoteMarkers[uuid] = note;
    if (!await note.noteExists()) {
      await note.write('');
      await note.open();
    }
  }));
  const uuidsToDelete = getOrphanedUuidsForCurDoc({
    filePath,
    uuids,
  });
  // no Promise.all because no reason to 
  // block UI thread and removeNote
  // decorate call is debounced.
  uuidsToDelete.forEach(async uuid => {
    if (uuid) {
      await vscode.commands.executeCommand('linenoteplus.removeNote', uuid);
    }
  });
}

export const updateIsActiveEditorNoteContext = () => {
  const editor = getEditor();
  if (isNotePath(editor.document.uri.fsPath)) {
    vscode.commands.executeCommand('setContext', 'isActiveEditorNote', true);
  } else {
    vscode.commands.executeCommand('setContext', 'isActiveEditorNote', false);
  }
}

let openNoteBehavior:
  | 'Beside'
  | 'Active'
  | 'PreserveFocus'
  ;

export const getOpenNoteBehavior = () => {
  if (!openNoteBehavior) {
    openNoteBehavior = vscode.workspace
      .getConfiguration()
      .get<typeof openNoteBehavior>('linenoteplus.openNoteBehavior')!;
  }
  const options: vscode.TextDocumentShowOptions = {};
  switch (openNoteBehavior){
    case 'Active': {
      options.preview = true;
      options.viewColumn = vscode.ViewColumn.Active;
      break;
    }
    // fallthrough ok
    case 'PreserveFocus':
      options.preserveFocus = true;
    default:
    case 'Beside': {
      options.viewColumn = getBesideViewColumn();
      break;
    }
  }
  return options;
}

export const getBesideViewColumn = () => {
  const editor = getEditor();
  const currentColumn = editor.viewColumn;
  const viewColumns = vscode.window.visibleTextEditors.length;
  const targetColumn = currentColumn === 1 ? 2 : 1;
  return viewColumns > 1 ? targetColumn
    : vscode.ViewColumn.Beside;
}