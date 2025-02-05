import * as vscode from "vscode";
import { Note } from "../../models/Note";
import { filterResolved, splitArr } from "../../utils/utils";
import { matchUuids } from "../../utils/helpers/match-helpers";
import { getOutputChannel } from "../output/getOutputChannel";

export class Decorator {
  context: vscode.ExtensionContext;
  lineDecorator?: vscode.TextEditorDecorationType;
  gutterDecorator?: vscode.TextEditorDecorationType;
  noteMarkerDecorator?: vscode.TextEditorDecorationType;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.reload();
  }

  reload() {
    if (this.lineDecorator) {
      this.lineDecorator.dispose();
    }
    if (this.gutterDecorator) {
      this.gutterDecorator.dispose();
    }
    if (this.noteMarkerDecorator) {
      this.noteMarkerDecorator.dispose();
    }

    const config: vscode.WorkspaceConfiguration =
      vscode.workspace.getConfiguration();

    const noteMarkerProp: vscode.DecorationRenderOptions = {};
    const gutterProp: vscode.DecorationRenderOptions = {};

    // set line color
    const line: string | undefined = config.get("linenoteplus.lineColor");
    if (line && line.trim().length) {
      noteMarkerProp.backgroundColor = line.trim();
    }

    // set ruler color
    const ruler: string | undefined = config.get("linenoteplus.rulerColor");
    if (ruler && ruler.trim().length) {
      noteMarkerProp.overviewRulerLane = vscode.OverviewRulerLane.Right;
      noteMarkerProp.overviewRulerColor = ruler.trim();
    }

    const showGutterIcon: boolean | undefined = config.get(
      "linenoteplus.showGutterIcon"
    );
    if (showGutterIcon) {
      const iconPath: string = config.get<string>(
        "linenoteplus.gutterIconPath"
      )!;
      gutterProp.gutterIconPath = this.context.asAbsolutePath(
        iconPath || "images/gutter.png"
      );
      gutterProp.gutterIconSize = "cover";
    }

    this.noteMarkerDecorator =
      vscode.window.createTextEditorDecorationType(noteMarkerProp);
    this.lineDecorator = vscode.window.createTextEditorDecorationType({});
    this.gutterDecorator =
      vscode.window.createTextEditorDecorationType(gutterProp);
  }

  async decorate() {
    const editors = vscode.window.visibleTextEditors;
    for (const editor of editors) {
      // load notes and create decoration options
      const uuids = matchUuids(editor.document.getText());
      const notes = await Promise.all(
        uuids.map(async (uuid) => Note.asNote(editor.document, uuid))
      );
      const [lineProps, gutterProps, noteMarkerProps] = splitArr(
        await filterResolved(
          notes.map(
            async (
              note
            ): Promise<
              [
                vscode.DecorationOptions,
                vscode.DecorationOptions,
                vscode.DecorationOptions
              ]
            > => {
              const markdown = new vscode.MarkdownString(
                await note.readAsMarkdown()
              );
              markdown.isTrusted = true;
              const noteLine = editor.document.lineAt(note.line);
              return [
                {
                  // line decorator
                  // notes marker line and noted line
                  range: new vscode.Range(
                    // subtract 1 because api's line number starts with 0, not 1
                    noteLine.range.start,
                    noteLine.range.end
                  ),
                  hoverMessage: markdown,
                },
                {
                  // gutter decorator
                  range: new vscode.Range(
                    noteLine.range.start,
                    noteLine.range.start
                  ),
                },
                {
                  // note marker decoratior
                  range: new vscode.Range(
                    noteLine.range.start,
                    noteLine.range.end
                  ),
                },
              ];
            }
          )
        )
      );

      editor.setDecorations(this.lineDecorator!, lineProps);
      editor.setDecorations(this.gutterDecorator!, gutterProps);
      editor.setDecorations(this.noteMarkerDecorator!, noteMarkerProps);
    }
  }
}
