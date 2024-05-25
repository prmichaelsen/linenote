import { Range, TextEditor } from 'vscode';

export function getSelectedTextFromEditor(editor: TextEditor): string | null {
  // Check if there is an active text editor and it has a selection
  if (editor && editor.selection) {
    // Get the selected range of text
    const selection = new Range(editor.selection.start, editor.selection.end);
    // Retrieve the text from the selection
    const selectedText = editor.document.getText(selection);
    return selectedText;
  }
  
  return null; // No active editor or no selection
}