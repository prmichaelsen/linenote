import * as path from 'path';
import walk from 'ignore-walk';
import { workspace } from 'vscode';
import { normalizePath } from '../utils';
import { Context } from '../../lib/caches/ContextCache';
import { log } from '../../extension/output/getOutputChannel';

// 📌 unfiled/5mnz72vRY9icwdnA5Ns55j.md 📝 🗑
export const getNotesDir = log.time('getNotesDir', (filePath: string) => {
  const workspaceFolders = workspace.workspaceFolders!;
  for (const folder of workspaceFolders) {
    const folderPath = folder.uri.fsPath;
    if (filePath.indexOf(folderPath) != -1) {
      const notesDirs = Context.notesDir.cached();
      return notesDirs[folder.name];
    }
  }
  throw new Error(`Unable to find note directory.`);
});

export interface GetNotePathFromUuidProps {
  targetPath: string,
  uuid: string,
}
export const getNotePathFromUuid = log.time('getNotePathFromUuid', (props: GetNotePathFromUuidProps) => {
  const { targetPath, uuid } = props;
  const notesDir = getNotesDir(targetPath);
  const selfPath = path.join(notesDir, uuid);
  return selfPath;
});

export const isNotePath = (filePath: string) => {
  const notesDir = getNotesDir(filePath);
  return filePath.startsWith(notesDir);
};

export const getUuidFromNotePath = (notePath: string) => {
  try {
    const notesDir = getNotesDir(notePath);
    let uuid: string;
    if (isNotePath(notePath)) {
      uuid = notePath.split(notesDir)[1];
    } else {
      uuid = path.relative(notesDir, notePath);
    }
    return normalizePath(uuid);
  } catch (e) {
    return null;
  }
}

export const getIncludedFilePaths = async (): Promise<string[]> => {
  const fNames: string[] = [];
  for (const folder of workspace.workspaceFolders || []) {
      fNames.push(...await walk({ 
        path: folder.uri.fsPath,
        ignoreFiles: ['.ignore', '.gitignore'],
      }));
  }
  return fNames;
};