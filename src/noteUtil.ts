import * as chokidar from "chokidar";
import * as fs from "fs-extra";
import * as path from "path";
import * as vscode from 'vscode';
import { GlobalActiveNoteMarkers, globalActiveNoteMarkers } from "./extension";
import { Note } from "./note";
import {
  escapeRegex,
  getIncludedFilePaths,
  identityDiffArr,
  isTruthy,
  isValidFilePath,
  keys,
  normalizePath,
} from "./util";

let removeText: string;
export const getRemoveText = () => {
  if (!removeText) {
    removeText = vscode.workspace.getConfiguration().get<string>('linenoteplus.removeText')!;
  }
  return removeText;
}

let editText: string;
export const getEditText = () => {
  if (!editText) {
    editText = vscode.workspace.getConfiguration().get<string>('linenoteplus.editText')!;
  }
  return editText;
};

let notePrefix: string;
export const getNotePrefix = () => {
  if (!notePrefix) {
    notePrefix = vscode.workspace.getConfiguration().get<string>('linenoteplus.notePrefix')!;
  }
  return notePrefix;
}

export const getNotesDir = (filePath: string) => {
  const conf = vscode.workspace.getConfiguration();
  const relNotesDir: any = conf.get('linenoteplus.notesDirectory');
  const workspaceFolders = vscode.workspace.workspaceFolders!;
  for (const folder of workspaceFolders) {
    const folderPath = folder.uri.fsPath
    if (filePath.indexOf(folderPath) != -1) {
      const noteDir = path.join(folderPath, relNotesDir);
      if (!fs.existsSync(noteDir)) {
          fs.mkdirSync(noteDir);
      }
      return noteDir;
    }
  }
  throw new Error(`Unable to find or create note directory "${relNotesDir}".`);
}

// export const anyChar = escapeRegex('\\/:');
// export const noSpace = escapeRegex('\\/: ');
//         /note:.*(?=\[Edit\] \[Remove\])/gm.toString(),
// export const anyChar = /\^\\\/:/.source;
// export const noSpace = /\^\\\/: /.source;
// export const uuidRegex = /(?<=^ )([^\\/:]| )*(?= *$)/g;
export const getNoteMarkerRegex = () => {
  const notePrefix = escapeRegex(getNotePrefix());
  const edit = escapeRegex(editText);
  const remove = escapeRegex(removeText);
  const regexString = `${notePrefix} *[^ ].+(?=${edit} ${remove})`;
  const regex = new RegExp(regexString, 'gm');
  return regex;
}

export const getUuidFromNoteMarker = (text: string) => {
  try {
    const back = text.split(getNotePrefix())[1].trim();
    const uuid = back.split(`${editText} ${removeText}`)[0].trim();
    if (isValidFilePath(uuid)) {
      const normal =  normalizePath(uuid);
      return isTruthy(normal) ? normal : null;
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}

export const matchUuids = (text: string): string[] => {
  const uuids: string[] = [];
  const matches = text.match(getNoteMarkerRegex());;
  if (!matches) {
    return uuids;
  }
  for (const match of matches) {
    const uuid = getUuidFromNoteMarker(match);
    if (isTruthy(uuid)) {
      uuids.push(uuid);
    }
  }
  return  uuids;
}

export const matchUuid = (lineText: string): string | null => {
  const match = lineText.match(getNoteMarkerRegex());
  if (match) {
    const matchText = match[0];
    const uuid = getUuidFromNoteMarker(matchText);
    if (isTruthy(uuid)) {
      return uuid;
    }
  }
  return null;
}

export const isNotePath = (filePath: string): boolean => {
  const noteDir = getNotesDir(filePath);
  return filePath.startsWith(noteDir);
};

// note:qX1Kfa1nHHZUA1Zy3VGsZn [Edit] [Remove]
export const getUuidFromNotePath = (notePath: string) => {
  try {
    const noteDir = getNotesDir(notePath);
    const parts = notePath.split(noteDir)[1];
    const uuid = parts.split('.md')[0];
    return normalizePath(uuid);
  } catch (e) {
    return null;
  }
}

export const cleanUpOrphanedNotes = async () => {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) {
    return;
  }
  for (const folder of folders) {
    const filePath = folder.uri.fsPath;
    const noteDir = getNotesDir(filePath);
    const files = await fs.readdir(noteDir);
    const uuids = files
      .map(file => path.basename(file, '.md'))
      // .filter(uuidish => uuidish.match(uuidRegex))
      ;
    const activeUuids = 
      keys(globalActiveNoteMarkers)
        .map(k => globalActiveNoteMarkers[k].uuid);
    const uuidsToDelete = identityDiffArr(uuids, activeUuids);
    for (const uuid of uuidsToDelete) {
      const note = globalActiveNoteMarkers[uuid as string];
      note.line = -1;
    }
    await Promise.all(uuidsToDelete.map(async uuid => {
      if (uuid) {
        await vscode.commands.executeCommand('linenoteplus.removeNote', uuid);
      }
    }));
  }
};


export const watchCorrespondingNotes = async (
  filePath: string,
  onChange: () => void
): Promise<() => void> => {
  const noteDir = getNotesDir(filePath);
  if (!noteDir) {
    return async () => null;
  }
  const watcher = chokidar.watch(path.dirname(noteDir), {
    persistent: false,
    ignoreInitial: true
  });
  watcher
    .on("add", async (notePath: string) => {
      const stat = await fs.stat(notePath);
      if (stat.isFile()) {
        onChange();
      }
    })
    .on("change", async (notePath: string) => {
      const stat = await fs.stat(notePath);
      if (stat.isFile()) {
        onChange();
      }
    })
    .on("unlink", async (notePath: string) => {
      // we cannnot use fs.stat because the note no longer exists
      try {
        if (fs.existsSync(notePath)) {
          onChange();
        }
      } catch (e) {
        // ignore
      }
    });

  return () => {
    watcher.close();
  };
};


export interface GetOrphanedNoteMarkersProps {
  /** filepath of current document */
  filePath: string;
  /** uuids in current document */
  uuids: string[];
}
export const getOrphanedUuidsForCurDoc = (
  props: GetOrphanedNoteMarkersProps
): string[] => {
  const { 
    filePath,
    uuids,
   } = props;
  const activeNotesMarkersForCurDuc: Note[] = []
  keys(globalActiveNoteMarkers)
    .filter((uuid: string) => {
      const docFilePath = globalActiveNoteMarkers[uuid].filePath;
      return docFilePath === filePath
    })
    .forEach(uuid => {
      activeNotesMarkersForCurDuc.push(
        globalActiveNoteMarkers[uuid]
      );
    });
  const activeUuidsForCurDoc = activeNotesMarkersForCurDuc.map(n => n.uuid);
  const uuidsToDelete = identityDiffArr(uuids, activeUuidsForCurDoc);
  return uuidsToDelete as string[];
}

export const initializeGlobalActiveNoteMarkers = async (
  globalActiveNoteMarkers: GlobalActiveNoteMarkers,
) => {
  const workspaceFolders = vscode.workspace.workspaceFolders!;
  for (const folder of workspaceFolders) {
    const folderPath = folder.uri.fsPath
    const noteDir = getNotesDir(folderPath);
    const filePaths = await getIncludedFilePaths();
    for (const filePath of filePaths) {
      const document = await vscode.workspace.openTextDocument(filePath);
      const uuids = matchUuids(document.getText());
      for (const uuid of uuids) {
        const note = new Note({
          filePath,
          noteDir,
          uuid,
          line: Note.getLine(document, uuid),
        });
        globalActiveNoteMarkers[uuid] = note;
      }
    } 
  }
}
