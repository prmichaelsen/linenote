import { initCache } from "../../cache";
import { forceMissNotesDir } from "./forceMissNotesDir";

type WorkspaceFolder = string;
type NotesDir = string;

export interface ContextCache {
  notesDir: Record<WorkspaceFolder, NotesDir>;
}

const _cacher = initCache<ContextCache>({
  forceMiss: async (uuid) => {
    switch (uuid) {
      case "notesDir":
        return await forceMissNotesDir();
      default:
        return null as any;
    }
  },
});

export const Context = {
  ..._cacher("notesDir"),
};
