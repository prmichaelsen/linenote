import { DocumentLink, DocumentLinkProvider, Position, ProviderResult, Range, TextDocument, Uri } from "vscode";
import { matchUuids } from "../../utils/helpers/match-helpers";
import { Note } from "../../models/Note";
import { Config } from "../../lib/caches/ConfigurationCache";

export class NoteLinkProvider implements DocumentLinkProvider {
  provideDocumentLinks(document: TextDocument): ProviderResult<DocumentLink[]> {
    const links: DocumentLink[] = [];
    const text = document.getText();
    const uuids = matchUuids(text);
    const notePrefix = Config.notePrefix.cached();
    const editText = Config.editText.cached();
    const removeText = Config.removeText.cached();
    for (const uuid of uuids) {
      const lineIndex = Note.getLine(document, uuid);
      const line = document.lineAt(lineIndex);
      const editIndex = line.text.indexOf(editText);
      const editPosition = new Position(line.lineNumber, editIndex);
      const editEndPosition = new Position(line.lineNumber, editIndex + editText.length);
      const editRange = new Range(editPosition, editEndPosition);
      const editUri = Uri.parse(
        `command:linenoteplus.openNote?${encodeURIComponent(
          JSON.stringify(uuid)
        )}`
      );
      const editLink = new DocumentLink(editRange, editUri);
      links.push(editLink);

      const removeIndex = line.text.indexOf(removeText);
      const removePosition = new Position(line.lineNumber, removeIndex);
      const removeEndPosition = new Position(line.lineNumber, removeIndex + removeText.length);
      const removeRange = new Range(removePosition, removeEndPosition);
      const removeUri = Uri.parse(
        `command:linenoteplus.removeNote?${encodeURIComponent(
          JSON.stringify(uuid)
        )}`
      );
      const removeLink = new DocumentLink(removeRange, removeUri);
      links.push(removeLink);

      const prefixIdx = [notePrefix]
        .map((p) => line.text.indexOf(p))
        .find((idx) => idx !== -1)
        ;
      if (prefixIdx) {
        const openPosition = new Position(line.lineNumber, prefixIdx);
        const openEndPosition = new Position(line.lineNumber, editIndex - 1);
        const openRange = new Range(openPosition, openEndPosition);
        const openLink = new DocumentLink(openRange, editUri);
        links.push(openLink);
      }
    }

    return new Promise((res) => res(links));
  }
}
