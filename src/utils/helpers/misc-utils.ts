import * as vscode from 'vscode';
import { isNotePath } from './note-path-utils';
import { getEditor } from '../../lib/getters/getEditor';

export const updateIsActiveEditorNoteContext = async () => {
  const editor = getEditor();
  if (await isNotePath(editor.document.uri.fsPath)) {
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
  const options: vscode.TextDocumentShowOptions = {
    preview: false,
  };
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