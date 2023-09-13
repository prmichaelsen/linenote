import * as vscode from 'vscode';

export const getEditor = () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    throw new Error('No active editor!');
  }
  return editor;
}