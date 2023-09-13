import * as path from 'path';
import * as fs from "fs-extra";
import { workspace, window } from 'vscode';
import { getOutputChannel, log } from '../../../extension/output/getOutputChannel';
import walk from 'ignore-walk';


const helpText = `
# The location of this \`.linenoteplus\` file determines
# the path to store and retrieve your notes.

# To relocate your notes, simply move or rename 
# the directory that contains this \`.linenoteplus\` file.
`.trim();

export const forceMissNotesDir = log.time(
  'forceMissedNotesDir', 
async () => {
  const notesDirByWorkspaceFolder: Record<string, string> = {};
  const workspaceFolders = workspace.workspaceFolders!;
  for (const folder of workspaceFolders) {
    try {
      const folderPath = folder.uri.fsPath;
      const name = folder.name;
      const _files = await walk({ 
          path: folder.uri.fsPath,
          ignoreFiles: ['.ignore', '.gitignore'],
        });
      const files = _files.filter(f => f.includes('.linenoteplus'));

      // no .linenoteplus found, create it at default
      // location
      if (files.length === 0) {
        const notesDir = path.join(folderPath, ".notes");
        if (!fs.existsSync(notesDir)) {
          fs.mkdirpSync(notesDir);
        }
        fs.writeFileSync(
          path.join(notesDir, ".linenoteplus"),
          helpText
        );
        notesDirByWorkspaceFolder[name] = notesDir;
      }
      // .linenoteplus found, return parent directory
      else if (files.length === 1) {
        notesDirByWorkspaceFolder[name] = path.join(
          folderPath,
          files[0].split(".linenoteplus")[0]
        );
      }
      // conflicting `.linenoteplus`s found, requires resolution
      else {
        const channel = getOutputChannel();
        await channel.appendLine(
          `Multiple .linenoteplus files were found in the workspace folder ${folder.name} ` +
            `but only one is supported. Line Note Plus will refuse to run until the conflict ` +
            `is manually resolved. Please consolidate the contents of each directory to ` +
            `a single directory that contains a single .linenoteplus file. This will instruct ` +
            `Line Note Plus to use this location for notes. Conflicting files:
          `
        );
        for (const file of files) {
          channel.appendLine(file);
        }
        await window.showErrorMessage(
          "Conflicting .linenoteplus files found. See output for details."
        );
      }
    } catch (e) {
      console.error(e);
    }
  }
  return notesDirByWorkspaceFolder;
});