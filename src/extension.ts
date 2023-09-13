import * as vscode from "vscode";
import { NoteLinkProvider } from './extension/providers/NoteLinkProvider';
import { Decorator } from "./extension/decorators/decorator";
import { getEditor } from './lib/getters/getEditor';
import { Note } from "./models/Note";
import { getNoteCache, initializeGlobalNoteCache } from './lib/getters/getNoteCache';
import { onDidSaveTextDocument } from './extension/events/onDidSaveTextDocument';
import { Context, ContextCache } from './lib/caches/ContextCache';
import { Config, ConfigurationCache } from './lib/caches/ConfigurationCache';
import { debounce } from './utils/std/debounce';
import { onDidCloseTextDocument } from './extension/events/onDidCloseTextDocument';
import { updateIsActiveEditorNoteContext } from "./utils/helpers/misc-utils";
import { addNote, openNote, revealLine, showPreviewToSide } from "./extension/commands";
import { refreshCache } from "./lib/cache/refreshCache";
import { cleanUpOrphanedNotes } from "./utils/helpers/note-utils";

export const activate = async (context: vscode.ExtensionContext) => {
  initializeGlobalNoteCache();
  refreshCache<ContextCache>(Context);
  refreshCache<ConfigurationCache>(Config);

  const provider = new NoteLinkProvider();
  const documentLinkDisposable = vscode.languages.registerDocumentLinkProvider(
    "*",
    provider
  );

  const decorator: Decorator = new Decorator(context);
  let disposed: boolean = false;

  // exclude notes dirs by default
  const conf = vscode.workspace.getConfiguration();
  const exclude: any = conf.get("files.exclude");
  const notesDirs = Context.notesDir.cached();
  const excludeFiles = {
    ...exclude,
  };
  for (const _workspaceFolder in notesDirs) {
    // make this configurable. (show or hide on default)
    // const notesDir = notesDirs[workspaceFolder];
    // excludeFiles[notesDir] = true;
  }
  conf.update("files.exclude", excludeFiles);
  // end

  let tid: NodeJS.Timer;
  const cleanUpOnInterval = () => {
    // watch orphaned notes
    if (disposed) {
      if (tid) {
        clearTimeout(tid);
      }
      return;
    }
    const interval = Config.cleanUpOrphanedNotesInterval.cached();
    const cleanUpStrategy = Config.cleanUpOrphanedNotes.cached();
    if (typeof interval === "number" && interval >= 0) {
      if (
        ["on-interval", "on-save-and-on-interval"].some(
          (s) => s === cleanUpStrategy
        )
      ) {
        cleanUpOrphanedNotes();
        const start = +new Date();
        const duration = +new Date() - start;
        tid = setTimeout(cleanUpOnInterval, Math.max(0, interval - duration));
      } else {
        clearTimeout(tid);
      }
    }
  };

  const cleanupOnSave = () => {
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument(onDidSaveTextDocument)
    );
  };

  // set cleanup orphaned nodes logic
  // based on conf
  const innerAsync = async () => {
  const cleanUpStrategy = await Config.cleanUpOrphanedNotes.forceMiss();
  switch (cleanUpStrategy) {
    case "on-save":
      cleanupOnSave();
      break;
    case "on-interval":
      // cleanUpOnInterval();
      vscode.window.showWarningMessage('on-interval currently unsupported to due issue [#5](https://github.com/prmichaelsen/linenoteplus/issues/5). Change'
      + ' config value for cleanUpOrphanedNotes to on-save or never to stop seeing this warning on startup.');
      break;
    case "on-save-and-on-interval":
      cleanupOnSave();
      // cleanUpOnInterval();
      vscode.window.showWarningMessage('on-save-and-on-interval currently unsupported to due issue [#5](https://github.com/prmichaelsen/linenoteplus/issues/5). Change'
        + ' config value for cleanUpOrphanedNotes to on-save or never to stop seeing this warning on startup.'
      );
      break;
    case "never":
    default:
  }
};
  innerAsync();

  const decorateDebounce = debounce({
    wait: 500,
    func: () => {
      if (disposed) {
        return;
      }
      decorator.decorate();
    },
  });
  decorateDebounce();

  const registerCommand = vscode.commands.registerCommand;
  context.subscriptions.push(
    new vscode.Disposable(() => (disposed = true)),

    documentLinkDisposable,

    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        updateIsActiveEditorNoteContext();
        decorateDebounce();
      }
    }),

    vscode.workspace.onDidChangeTextDocument((event) => {
      if (
        vscode.window.activeTextEditor &&
        event.document === vscode.window.activeTextEditor.document
      ) {
        decorateDebounce();
      }
    }),

    vscode.workspace.onDidCloseTextDocument(onDidCloseTextDocument),

    vscode.workspace.onDidChangeConfiguration(async (event) => {
      if (
        event.affectsConfiguration("linenoteplus.lineColor") ||
        event.affectsConfiguration("linenoteplus.rulerColor")
      ) {
        decorator.reload();
        decorator.decorate();
      }
      if (
        event.affectsConfiguration("linenoteplus.cleanUpOrphanedNotes") ||
        event.affectsConfiguration("linenoteplus.cleanUpOrphanedNotesInterval")
      ) {
        // TODO
        // initializeCleanupStrategy
        await vscode.window.showInformationMessage(
          "Line Note Plus: Configuration updates to cleanUpOrphanedNotes or " +
            "cleanUpOrphanedNotesInterval requires reloading."
        );
        await vscode.commands.executeCommand(
          "workbench.action.reloadExtension"
        );
      }
      if (
        event.affectsConfiguration("linenoteplus.removeText") ||
        event.affectsConfiguration("linenoteplus.editText") ||
        event.affectsConfiguration("linenoteplus.notePrefix") ||
        event.affectsConfiguration("linenoteplus.openNoteBehavior")
      ) {
      }
    }),

    registerCommand("linenoteplus.addNote", addNote),

    registerCommand("linenoteplus.openNote", openNote),

    registerCommand("linenoteplus.showPreviewToSide", showPreviewToSide),

    registerCommand("linenoteplus.removeNote", async (uuid?: string) => {
      const _uuid = uuid || Note.matchUuidOnActiveLine(getEditor());
      if (_uuid) {
        // remove specified note (when invoked from the hover text)
        const note = getNoteCache().get(_uuid);
        if (note.line > -1) {
          const uri = vscode.Uri.parse(note.targetPath);
          const document = await vscode.workspace.openTextDocument(uri);
          const line = document.lineAt(note.line);
          const edit = new vscode.WorkspaceEdit();
          edit.delete(uri, line.rangeIncludingLineBreak);
          vscode.workspace.applyEdit(edit);
        }
        await note.remove();
        decorateDebounce();
      }
    }),

    registerCommand("linenoteplus.revealLine", revealLine)
  );
};

