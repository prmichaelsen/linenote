import * as fs from "fs-extra";
import * as vscode from "vscode";
import * as path from "path";
import { matchUuid } from "../utils/helpers/match-helpers";
import { getOpenNoteBehavior } from "../utils/helpers/misc-utils";
import { getNotePathFromUuid } from "../utils/helpers/note-path-utils";
import { getNoteCache } from "../lib/getters/getNoteCache";
import { Config } from "../lib/caches/ConfigurationCache";
import { ErrorCodes } from "../lib/ErrorCodes";
import { getOutputChannel, log } from "../extension/output/getOutputChannel";

export interface NoteProps {
  targetPath: string;
  selfPath: string;
  uuid: string;
  line: number;
}

export class Note implements NoteProps {
  targetPath: string;
  selfPath: string;
  uuid: string;
  line: number;

  constructor(props: NoteProps) {
    this.targetPath = props.targetPath;
    this.uuid = props.uuid;
    this.selfPath = props.selfPath;
    this.line = props.line;
  }

  static asNote(document: vscode.TextDocument, uuid: string) {
    return new Note({
      selfPath: getNotePathFromUuid({
        uuid,
        targetPath: document.uri.fsPath,
      }),
      targetPath: document.uri.fsPath,
      uuid,
      line: Note.getLine(document, uuid),
    });
  }

  static getLine = log.time('getLine', (document: vscode.TextDocument, uuid: string): number => {
    const notePrefix = Config.notePrefix.cached();
    for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
      const line = document.lineAt(lineIndex);
      const isMatch = [notePrefix]
        .map((p) => p + " " + uuid)
        .some((m) => line.text.includes(m));
      // const charIndex = line.text.indexOf(`${getNotePrefix()} ${uuid}`);
      if (isMatch) {
        return lineIndex;
      }
    }
    getOutputChannel().appendLine(
      ErrorCodes.Error_0003({ uuid, path: document.uri.fsPath})
    );
    return -1;
  });

  static matchUuidOnActiveLine = (editor: vscode.TextEditor): string | null => {
    const anchor = editor.selection.anchor;
    const line = editor.document.lineAt(anchor);
    return matchUuid(line.text);
  };

  /** does file this note targets exist? */
  async fsExists(): Promise<boolean> {
    try {
      await fs.stat(this.targetPath);
      return true;
    } catch (e) {
      return false;
    }
  }

  noteExists(): boolean {
    try {
      return fs.statSync(this.selfPath).isFile();
    } catch (e) {
      return false;
    }
  }

  async touch(): Promise<void> {
    getNoteCache().set(this.uuid, this);
    if (!this.noteExists()) {
      await this.write("");
    }
  }

  async open(options?: vscode.TextDocumentShowOptions): Promise<void> {
    getNoteCache().set(this.uuid, this);
    await vscode.commands.executeCommand(
      "vscode.open",
      vscode.Uri.file(this.selfPath),
      {
        ...getOpenNoteBehavior(),
        ...options,
      }
    );
  }

  async write(body: string): Promise<void> {
    getNoteCache().set(this.uuid, this);
    return await fs.outputFile(this.selfPath, body);
  }

  async read(): Promise<string> {
    try {
      const buffer = await fs.readFile(this.selfPath);
      return buffer.toString();
    } catch (e) {
      throw new Error(
        `003: Tried to read note with uuid "${this.uuid}"` +
          `at path "${this.selfPath}" ` +
          `at for file "${this.targetPath}" ` +
          `at line "${this.line}" ` +
          `but the path did not exist.`
      );
    }
  }

  async readAsMarkdown(): Promise<string> {
    let body = "\\<empty note\\>";


    if (await this.noteExists()) {
      const noteText = await this.read();
      if (noteText.trim() !== "") {
        body = await this.read();
      }
    }
    const ext = path.extname(this.selfPath);
    if (ext !== 'md' && ext !== '') {
      body = '```\n' + body + '\n```';
    }

    return body;
  }

  async remove(): Promise<void> {
    getNoteCache().delete(this.uuid);
    await fs.unlink(this.selfPath);
  }
}
